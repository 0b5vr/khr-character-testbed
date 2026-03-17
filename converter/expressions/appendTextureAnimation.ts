import { appendAnimationAccessors } from './appendAnimationAccessors.ts';
import { dig } from './dig.ts';
import { logVerbose } from '../logVerbose.ts';
import { transformToBinary } from './transformToBinary.ts';
import type { GLTF } from '@gltf-transform/core';
import type { ExpressionTextureTransformBind } from '@pixiv/types-vrmc-vrm-1.0';

/**
 * Collects all KHR_texture_transform extension pointer base paths available on a material.
 *
 * @param materialIndex Material index to inspect
 * @param gltf The glTF object to inspect
 * @returns Pointer base paths ending with `/extensions/KHR_texture_transform`
 */
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

/**
 * Appends texture transform animation channels (offset/scale) for one VRM bind.
 *
 * @param vrmBind The source VRM texture transform bind to append
 * @param isBinary Whether the `isBinary` is true in the VRM expression
 * @param gltf The glTF object to modify
 * @param binChunkBox The reference box to the binary chunk
 * @param outAnimation The animation object to which new samplers and channels will be appended
 * @returns `[samplerIndices, channelIndices]`
 */
export function appendTextureAnimation(
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
