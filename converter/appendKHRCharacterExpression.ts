import { appendAnimationAccessors } from './appendAnimationAccessors.ts';
import { logVerbose } from './logVerbose.ts';
// @ts-types="npm:@types/three@0.181.0"
import { Quaternion } from 'npm:three@0.181.2';
import type { GLTF } from 'npm:@gltf-transform/core@4.2.1';
import type { ExpressionMorphTargetBind, ExpressionTextureTransformBind, LookAtRangeMap, VRMCVRM, Expression as VRMExpression, Humanoid as VRMHumanoid, LookAt as VRMLookAt } from 'npm:@pixiv/types-vrmc-vrm-1.0@3.4.4';
import type { KHRCharacterExpression, KHRCharacterExpressionExpression } from '../schematypes/KHRCharacterExpression.ts';
import type { KHRCharacterExpressionMorphtarget } from '../schematypes/KHRCharacterExpressionMorphtarget.ts';
import type { KHRCharacterExpressionMapping, KHRCharacterExpressionMappingExpressionSetMapping } from '../schematypes/KHRCharacterExpressionMapping.ts';
import type { Bone } from './Bone.ts';

/** Identity quaternion Do not mutate */
const QUAT_IDENTITY = new Quaternion(0, 0, 0, 1);

/** Quaternion for temporary calculations */
const _quatA = new Quaternion();
const _quatB = new Quaternion();

export const VRMLookExpressionName = {
  LookUp: 'lookUp',
  LookDown: 'lookDown',
  LookLeft: 'lookLeft',
  LookRight: 'lookRight',
} as const;

export type VRMLookExpressionName =
  (typeof VRMLookExpressionName)[keyof typeof VRMLookExpressionName];

const vrmLookExpressionNames: Set<VRMLookExpressionName> = new Set(Object.values(VRMLookExpressionName));

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

      gltf.extensionsUsed ||= [];
      if (!gltf.extensionsUsed.includes('KHR_animation_pointer')) {
        gltf.extensionsUsed.push('KHR_animation_pointer');
      }

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

function appendBoneRotationAccessors(
  bone: Bone,
  vrmLookAt: VRMLookAt,
  name: VRMLookExpressionName,
  isLeft: boolean,
  gltf: GLTF.IGLTF,
  binChunkBox: [Uint8Array],
): [input: number, output: number] | null {
  let rangeMap: LookAtRangeMap | undefined;

  if (name === 'lookUp') {
    rangeMap = vrmLookAt.rangeMapVerticalUp;
    _quatA.set(-0.7071, 0, 0, 0.7071); // 90 degrees up
  } else if (name === 'lookDown') {
    rangeMap = vrmLookAt.rangeMapVerticalDown;
    _quatA.set(0.7071, 0, 0, 0.7071); // 90 degrees down
  } else if (name === 'lookLeft') {
    rangeMap = isLeft ? vrmLookAt.rangeMapHorizontalOuter : vrmLookAt.rangeMapHorizontalInner;
    _quatA.set(0, 0.7071, 0, 0.7071); // 90 degrees left
  } else if (name === 'lookRight') {
    rangeMap = isLeft ? vrmLookAt.rangeMapHorizontalInner : vrmLookAt.rangeMapHorizontalOuter;
    _quatA.set(0, -0.7071, 0, 0.7071); // 90 degrees right
  } else {
    throw new Error(`Unreachable. Unknown look expression name: ${name}`);
  }

  if (rangeMap == null || rangeMap.inputMaxValue == null || rangeMap.outputScale == null || rangeMap.outputScale === 0) {
    return null;
  }

  _quatB.copy(bone.worldRotation).invert();
  _quatA.slerp(QUAT_IDENTITY, 1 - rangeMap.outputScale / 90.0)
    .multiply(bone.worldRotation)
    .premultiply(_quatB)
    .premultiply(bone.rotation);

  const t = Math.max(rangeMap.inputMaxValue / 90.0, 1E-6);
  const input = t === 1
    ? new Float32Array([0, 1])
    : new Float32Array([0, t, 1]);
  const output = new Float32Array([
    bone.rotation.x, bone.rotation.y, bone.rotation.z, bone.rotation.w,
    _quatA.x, _quatA.y, _quatA.z, _quatA.w,
    ...t === 1 ? [] : [_quatA.x, _quatA.y, _quatA.z, _quatA.w],
  ]);

  return appendAnimationAccessors(
    input,
    output,
    'VEC4',
    gltf,
    binChunkBox,
  );
}

/**
 * Create look at animation using bones, append it to gltf.animations, and return the animation index.
 * When this function is called, it assume that vrmLookAt is using "bone" type.
 */
function appendBoneLookAnimation(
  name: VRMLookExpressionName,
  vrmHumanoid: VRMHumanoid,
  vrmLookAt: VRMLookAt,
  gltf: GLTF.IGLTF,
  binChunkBox: [Uint8Array],
  nodeBoneMap: Record<number, Bone>,
): [number | null, channelIndices: number[]] {
  const animation: GLTF.IAnimation = {
    name,
    samplers: [],
    channels: [],
  };

  const channelIndices: number[] = [];

  for (const isLeft of [false, true]) {
    const vrmBoneName = isLeft ? 'leftEye' : 'rightEye';
    const nodeIndex = vrmHumanoid.humanBones[vrmBoneName]?.node;
    if (nodeIndex != null) {
      const bone = nodeBoneMap[nodeIndex]!;

      const inputIndexAndOutputIndex = appendBoneRotationAccessors(
        bone,
        vrmLookAt,
        name,
        isLeft,
        gltf,
        binChunkBox,
      );
      if (inputIndexAndOutputIndex == null) {
        continue;
      }

      const [inputIndex, outputIndex] = inputIndexAndOutputIndex;
      logVerbose(`KHR_character_expression_joint: New accessors (#${inputIndex}, #${outputIndex})`);

      const samplerIndex = animation.samplers.length;
      animation.samplers.push({
        input: inputIndex,
        interpolation: 'LINEAR',
        output: outputIndex,
      });

      const channelIndex = animation.channels.length;
      animation.channels.push({
        sampler: samplerIndex,
        target: {
          node: nodeIndex,
          path: 'rotation',
        },
      });
      logVerbose(`KHR_character_expression_joint: New animation channel, rotation for node #${nodeIndex}`);
      channelIndices.push(channelIndex);
    }
  }

  gltf.animations ||= [];
  gltf.animations.push(animation);

  const animationIndex = gltf.animations.length - 1;
  logVerbose(`KHR_character_expression_joint: New animation (#${animationIndex})`);

  return [animationIndex, channelIndices];
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

function appendBoneLookExpression(
  name: VRMLookExpressionName,
  vrmHumanoid: VRMHumanoid,
  vrmLookAt: VRMLookAt,
  gltf: GLTF.IGLTF,
  binChunkBox: [Uint8Array],
  outExpressions: KHRCharacterExpressionExpression[],
  nodeBoneMap: Record<number, Bone>,
): number | null {
  const [animationIndex, channelIndices] = appendBoneLookAnimation(name, vrmHumanoid, vrmLookAt, gltf, binChunkBox, nodeBoneMap);
  if (animationIndex == null) {
    return null;
  }

  const expression: KHRCharacterExpressionExpression = {
    expression: name,
    animation: animationIndex,
    extensions: {
      'KHR_character_expression_joint': {
        channels: channelIndices,
      },
    },
  };
  outExpressions.push(expression);

  return outExpressions.length - 1;
}

export function appendKHRCharacterExpression(
  gltf: GLTF.IGLTF,
  binChunkBox: [Uint8Array],
  nodeBoneMap: Record<number, Bone>,
): void {
  const vrm = gltf.extensions?.['VRMC_vrm'] as VRMCVRM | undefined;
  if (vrm == null) {
    return;
  }

  if (vrm.expressions == null) {
    return;
  }

  if (vrm.lookAt?.type == null) {
    logVerbose('KHR_character_expression: VRM lookAt type is not defined, skipping look expressions');
  } else {
    logVerbose(`KHR_character_expression: VRM lookAt type is "${vrm.lookAt?.type}"`);
  }

  const expressions: KHRCharacterExpressionExpression[] = [];
  const mappingName = 'vrmExpressionPresets';
  const mapping: KHRCharacterExpressionMappingExpressionSetMapping = {};

  for (const [name, vrmExpression] of Object.entries(vrm.expressions.preset ?? {})) {
    if (vrmLookExpressionNames.has(name as any)) {
      // look expressions are handled later
      continue;
    }

    logVerbose(`KHR_character_expression: Appending expression "${name}"`);
    appendExpression(name, vrmExpression, gltf, binChunkBox, expressions);
    mapping[name] = [{ source: name, weight: 1 }];
    logVerbose(`KHR_character_expression_mapping: "${mappingName}" mapping, "${name}": [{ source: "${name}", weight: 1 }]`);
  }

  if (vrm.lookAt?.type === 'expression') {
    for (const lookName of vrmLookExpressionNames) {
      const vrmExpression = vrm.expressions.preset?.[lookName];
      if (vrmExpression == null) {
        continue;
      }

      logVerbose(`KHR_character_expression: Appending look expression "${lookName}"`);
      appendExpression(lookName, vrmExpression, gltf, binChunkBox, expressions);

      mapping[lookName] = [{ source: lookName, weight: 1 }];
      logVerbose(`KHR_character_expression_mapping: "${mappingName}" mapping, "${lookName}": [{ source: "${lookName}", weight: 1 }]`);
    }
  } else if (vrm.lookAt?.type === 'bone') {
    // create look expressions out of vrm lookAt
    for (const lookName of vrmLookExpressionNames) {
      logVerbose(`KHR_character_expression: Appending look expression "${lookName}"`);
      appendBoneLookExpression(lookName, vrm.humanoid, vrm.lookAt, gltf, binChunkBox, expressions, nodeBoneMap);

      mapping[lookName] = [{ source: lookName, weight: 1 }];
      logVerbose(`KHR_character_expression_mapping: "${mappingName}" mapping, "${lookName}": [{ source: "${lookName}", weight: 1 }]`);
    }
  }

  for (const [name, vrmExpression] of Object.entries(vrm.expressions?.custom ?? {})) {
    logVerbose(`KHR_character_expression: Appending expression "${name}"`);
    appendExpression(name, vrmExpression, gltf, binChunkBox, expressions);
  }

  gltf.extensionsUsed ||= [];
  gltf.extensionsUsed.push('KHR_character_expression');
  gltf.extensionsUsed.push('KHR_character_expression_mapping');
  // TODO: conditionally add 'KHR_character_expression_morphtarget' and 'KHR_character_expression_texture' and 'KHR_character_expression_joint'

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
