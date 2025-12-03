import { appendAnimationAccessors } from './appendAnimationAccessors.ts';
import { logVerbose } from './logVerbose.ts';
import type { GLTF } from 'npm:@gltf-transform/core@4.2.1';
import type { ExpressionMorphTargetBind, ExpressionTextureTransformBind, VRMCVRM, Expression as VRMExpression } from 'npm:@pixiv/types-vrmc-vrm-1.0@3.4.4';
import type { KHRCharacterExpression, KHRCharacterExpressionExpression } from '../schematypes/KHRCharacterExpression.ts';
import type { KHRCharacterExpressionMorphtarget } from '../schematypes/KHRCharacterExpressionMorphtarget.ts';
import type { KHRCharacterExpressionMapping, KHRCharacterExpressionMappingExpressionSetMapping } from '../schematypes/KHRCharacterExpressionMapping.ts';

function transformToBinary(data: Float32Array, isBinary: boolean): Float32Array {
  if (!isBinary) {
    return data;
  }

  const binaryData = new Float32Array(data.length / 2 * 3);
  binaryData.set(data, 0);
  binaryData.set(data.subarray(data.length / 2), data.length);
  return binaryData;
}

function createOutputWeights(
  targetsLength: number,
  targetIndex: number,
  weight: number,
): Float32Array {
  const weights = new Float32Array(targetsLength * 2);
  weights[targetsLength + targetIndex] = weight;
  return weights;
}

function appendMorphtargetAnimation(
  vrmBind: ExpressionMorphTargetBind,
  isBinary: boolean,
  gltf: GLTF.IGLTF,
  binChunkBox: [Uint8Array],
  outAnimation: GLTF.IAnimation,
): [samplerIndex: number | null, channelIndex: number | null] {
  if (vrmBind.weight === 0) {
    return [null, null];
  }

  const nodeIndex = vrmBind.node;
  const meshIndex = gltf.nodes?.[nodeIndex]?.mesh;
  if (meshIndex == null) {
    return [null, null];
  }

  const mesh = gltf.meshes?.[meshIndex];
  if (mesh == null) {
    return [null, null];
  }

  const targetIndex = vrmBind.index;
  const targetsLength = mesh.primitives?.[0]?.targets?.length ?? 0;

  const [inputIndex, outputIndex] = appendAnimationAccessors(
    new Float32Array(isBinary ? [0, 0.5, 1] : [0, 1]),
    transformToBinary(createOutputWeights(targetsLength, targetIndex, vrmBind.weight), isBinary),
    'SCALAR',
    gltf,
    binChunkBox,
  );
  logVerbose(`KHR_character_expression_morphtarget: New accessors (#${inputIndex}, #${outputIndex})`);

  const samplerIndex = outAnimation.samplers.length;
  outAnimation.samplers.push({
    input: inputIndex,
    interpolation: isBinary ? 'STEP' : 'LINEAR',
    output: outputIndex,
  });

  const channelIndex = outAnimation.channels.length;
  outAnimation.channels.push({
    sampler: samplerIndex,
    target: {
      node: nodeIndex,
      path: 'weights',
    },
  });
  logVerbose(`KHR_character_expression_morphtarget: New animation channel, weights for node #${nodeIndex}`);

  return [samplerIndex, channelIndex];
}

function dig(obj: any, path: string): any {
  const parts = path.split('/');
  let current = obj;
  for (const part of parts) {
    if (current == null) {
      return undefined;
    }
    current = current[part];
  }
  return current;
}

function compileTextureTransformExtPaths(
  materialIndex: number,
  gltf: GLTF.IGLTF,
): string[] {
  const material = gltf.materials?.[materialIndex];
  if (material == null) {
    return [];
  }

  const texturePaths = [
    'normalTexture',
    'occlusionTexture',
    'emissiveTexture',
    'pbrMetallicRoughness/baseColorTexture',
    'pbrMetallicRoughness/metallicRoughnessTexture',
    'extensions/KHR_materials_anisotropy/anisotropyTexture',
    'extensions/KHR_materials_clearcoat/clearcoatTexture',
    'extensions/KHR_materials_clearcoat/clearcoatRoughnessTexture',
    'extensions/KHR_materials_clearcoat/clearcoatNormalTexture',
    'extensions/KHR_materials_iridescence/iridescenceTexture',
    'extensions/KHR_materials_iridescence/iridescenceThicknessTexture',
    'extensions/KHR_materials_sheen/sheenColorTexture',
    'extensions/KHR_materials_sheen/sheenRoughnessTexture',
    'extensions/KHR_materials_specular/specularTexture',
    'extensions/KHR_materials_specular/specularColorTexture',
    'extensions/KHR_materials_transmission/transmissionTexture',
    'extensions/KHR_materials_volume/thicknessTexture',
    'extensions/ADOBE_materials_clearcoat_specular/clearcoatSpecularTexture',
    'extensions/ADOBE_materials_clearcoat_tint/clearcoatTintTexture',
    'extensions/VRMC_materials_mtoon/shadeMultiplyTexture',
    'extensions/VRMC_materials_mtoon/shadingShiftTexture',
    // 'extensions/VRMC_materials_mtoon/matcapTexture', // ignored in VRM spec
    'extensions/VRMC_materials_mtoon/rimMultiplyTexture',
    'extensions/VRMC_materials_mtoon/outlineWidthMultiplyTexture',
    'extensions/VRMC_materials_mtoon/uvAnimationMaskTexture',
  ];

  return texturePaths
    .filter((path) => dig(material, path) != null)
    .map((path) => `/materials/${materialIndex}/${path}/extensions/KHR_texture_transform`);
}

function appendTextureAnimation(
  vrmBind: ExpressionTextureTransformBind,
  isBinary: boolean,
  gltf: GLTF.IGLTF,
  binChunkBox: [Uint8Array],
  outAnimation: GLTF.IAnimation,
): [samplerIndices: number[], channelIndices: number[]] {
  const samplerIndices: number[] = [];
  const channelIndices: number[] = [];

  if (vrmBind.offset == null && vrmBind.scale == null) {
    return [samplerIndices, channelIndices];
  }

  const materialIndex = vrmBind.material;
  const extPaths = compileTextureTransformExtPaths(materialIndex, gltf);

  for (const propName of ['offset', 'scale'] as const) {
    const prop = vrmBind[propName];
    if (prop == null) {
      continue;
    }

    // TODO: We assume default offset and scale, and it's not always true
    const [x0, y0] = propName === 'offset' ? [0, 0] : [1, 1];
    const [x1, y1] = prop;

    const [inputIndex, outputIndex] = appendAnimationAccessors(
      new Float32Array(isBinary ? [0, 0.5, 1] : [0, 1]),
      transformToBinary(new Float32Array([x0, y0, x1, y1]), isBinary),
      'VEC2',
      gltf,
      binChunkBox,
    );
    logVerbose(`KHR_character_expression_texture: New accessors (#${inputIndex}, #${outputIndex})`);

    const samplerIndex = outAnimation.samplers.length;
    outAnimation.samplers.push({
      input: inputIndex,
      interpolation: isBinary ? 'STEP' : 'LINEAR',
      output: outputIndex,
    });
    samplerIndices.push(samplerIndex);

    for (const extPath of extPaths) {
      const channelIndex = outAnimation.channels.length;

      const pointer = `${extPath}/${propName}`;
      outAnimation.channels.push({
        sampler: samplerIndex,
        target: {
          path: 'pointer' as any,
          extensions: {
            'KHR_animation_pointer': {
              pointer,
            }
          }
        },
      });
      channelIndices.push(channelIndex);
      logVerbose(`KHR_character_expression_texture: New animation channel, pointer for "${pointer}"`);
    }
  }

  return [samplerIndices, channelIndices];
}


function appendAnimation(
  name: string,
  vrmExpression: VRMExpression,
  gltf: GLTF.IGLTF,
  binChunkBox: [Uint8Array],
): [animationIndex: number | null, morphtargetChannelIndices: number[], textureChannelIndices: number[]] {
  const animation: GLTF.IAnimation = {
    name,
    samplers: [],
    channels: [],
  };

  const morphtargetChannelIndices: number[] = [];
  const textureChannelIndices: number[] = [];

  const isBinary = vrmExpression.isBinary ?? false;

  for (const bind of vrmExpression.morphTargetBinds ?? []) {
    logVerbose('KHR_character_expression_morphtarget: Appending an animation channel for morph target bind');
    const [_, i] = appendMorphtargetAnimation(bind, isBinary, gltf, binChunkBox, animation);
    if (i != null) {
      morphtargetChannelIndices.push(i);
    }
  }

  for (const bind of vrmExpression.textureTransformBinds ?? []) {
    logVerbose('KHR_character_expression_texture: Appending animation channels for texture transform bind');
    const [_, i] = appendTextureAnimation(bind, isBinary, gltf, binChunkBox, animation);
    textureChannelIndices.push(...i);
  }

  if (vrmExpression.materialColorBinds != null && vrmExpression.materialColorBinds.length > 0) {
    console.warn(`The expression ${name} contains materialColorBinds, which is not supported in KHR_character_expression. Ignoring the bind.`);
  }

  if (animation.channels.length === 0) {
    return [null, [], []];
  }

  gltf.animations ||= [];
  gltf.animations.push(animation);

  const animationIndex = gltf.animations.length - 1;
  logVerbose(`KHR_character_expression: New animation (#${animationIndex})`);

  return [animationIndex, morphtargetChannelIndices, textureChannelIndices];
}

function appendExpression(
  name: string,
  vrmExpression: VRMExpression,
  gltf: GLTF.IGLTF,
  binChunkBox: [Uint8Array],
  outExpressions: KHRCharacterExpressionExpression[],
): number | null {
  const [animationIndex, morphtargetChannelIndices, textureChannelIndices] = appendAnimation(name, vrmExpression, gltf, binChunkBox);
  if (animationIndex == null) {
    return null;
  }

  const extensions: Record<string, unknown> = {};

  if (morphtargetChannelIndices.length > 0) {
    logVerbose(`KHR_character_expression: Morphtarget channels: [${morphtargetChannelIndices.join(', ')}]`);
    extensions['KHR_character_expression_morphtarget'] = {
      channels: morphtargetChannelIndices,
    } satisfies KHRCharacterExpressionMorphtarget;
  }

  if (textureChannelIndices.length > 0) {
    logVerbose(`KHR_character_expression: Texture channels: [${textureChannelIndices.join(', ')}]`);
    extensions['KHR_character_expression_texture'] = {
      channels: textureChannelIndices,
    };
  }

  const expression: KHRCharacterExpressionExpression = {
    expression: name,
    animation: animationIndex,
    extensions,
  };
  outExpressions.push(expression);

  return outExpressions.length - 1;
}

export function appendKHRCharacterExpression(gltf: GLTF.IGLTF, binChunkBox: [Uint8Array]): void {
  const vrm = gltf.extensions?.['VRMC_vrm'] as VRMCVRM | undefined;
  const vrmExpressions = vrm?.expressions;
  if (vrmExpressions == null) {
    return;
  }

  const expressions: KHRCharacterExpressionExpression[] = [];
  const mappingName = 'vrmExpressionPresets';
  const mapping: KHRCharacterExpressionMappingExpressionSetMapping = {};

  for (const [name, vrmExpression] of Object.entries(vrmExpressions?.preset ?? {})) {
    logVerbose(`KHR_character_expression: Appending expression "${name}"`);
    appendExpression(name, vrmExpression, gltf, binChunkBox, expressions);
    mapping[name] = [{ source: name, weight: 1 }];
    logVerbose(`KHR_character_expression_mapping: "${mappingName}" mapping, "${name}": [{ source: "${name}", weight: 1 }]`);
  }

  for (const [name, vrmExpression] of Object.entries(vrmExpressions?.custom ?? {})) {
    logVerbose(`KHR_character_expression: Appending expression "${name}"`);
    appendExpression(name, vrmExpression, gltf, binChunkBox, expressions);
  }

  gltf.extensionsUsed ||= [];
  gltf.extensionsUsed.push('KHR_character_expression');
  gltf.extensionsUsed.push('KHR_character_expression_mapping');

  gltf.extensions ||= {};
  gltf.extensions['KHR_character_expression'] = {
    expressions,
  } satisfies KHRCharacterExpression;
  gltf.extensions['KHR_character_expression_mapping'] = {
    expressionSetMappings: {
      [mappingName]: mapping,
    },
  } satisfies KHRCharacterExpressionMapping;
}
