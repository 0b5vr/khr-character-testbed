import { appendAnimationAccessors } from './appendAnimationAccessors.ts';
import { logVerbose } from '../logVerbose.ts';
import type { GLTF } from 'npm:@gltf-transform/core@4.2.1';
import type { ExpressionMorphTargetBind } from 'npm:@pixiv/types-vrmc-vrm-1.0@3.4.4';
import { options } from '../options.ts';
import { transformToBinary } from './transformToBinary.ts';

/**
 * Builds a 2-keyframe weight buffer for a mesh with morph targets.
 * The first keyframe is all zeros, and the second keyframe applies `weight` only to `targetIndex`.
 *
 * @param targetsLength The total count of morph targets for the mesh
 * @param targetIndex The index of the morph target to apply the weight to
 * @param weight The weight to apply to the target at the second keyframe
 * @returns A Float32Array containing the keyframe values
 */
function createOutputWeights(
  targetsLength: number,
  targetIndex: number,
  weight: number,
): Float32Array {
  const weights = new Float32Array(targetsLength * 2);
  weights[targetsLength + targetIndex] = weight;
  return weights;
}

/**
 * Appends one VRM morph target bind as animation sampler/channel entries.
 *
 * @param vrmBind The VRM morph target bind to append
 * @param isBinary Whether the `isBinary` is true in the VRM expression
 * @param gltf The glTF object to modify
 * @param binChunkBox The reference box to the binary chunk
 * @param outAnimation The animation object to which new samplers and channels will be appended
 * @returns `[samplerIndex, channelIndex]` when appended. `[null, null]` when skipped
 */
export function appendMorphtargetAnimation(
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
  const weight = vrmBind.weight;

  if (options.useAnimationPointerForMorphTarget) {
    const [inputIndex, outputIndex] = appendAnimationAccessors(
      new Float32Array(isBinary ? [0, 0.5, 1] : [0, 1]),
      new Float32Array(isBinary ? [0, weight, weight] : [0, weight]),
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

    gltf.extensionsUsed ||= [];
    if (!gltf.extensionsUsed.includes('KHR_animation_pointer')) {
      gltf.extensionsUsed.push('KHR_animation_pointer');
    }

    const channelIndex = outAnimation.channels.length;
    const pointer = `/nodes/${nodeIndex}/weights/${targetIndex}`;
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
    logVerbose(`KHR_character_expression_texture: New animation channel, pointer for "${pointer}"`);

    return [samplerIndex, channelIndex];
  } else {
    const targetsLength = mesh.primitives?.[0]?.targets?.length ?? 0;
    const [inputIndex, outputIndex] = appendAnimationAccessors(
      new Float32Array(isBinary ? [0, 0.5, 1] : [0, 1]),
      transformToBinary(createOutputWeights(targetsLength, targetIndex, weight), isBinary),
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
}
