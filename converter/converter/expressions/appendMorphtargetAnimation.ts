import { appendAnimationAccessors } from './appendAnimationAccessors.ts';
import { logVerbose } from '../logVerbose.ts';
import type { GLTF } from '@gltf-transform/core';
import type { ExpressionMorphTargetBind } from '@pixiv/types-vrmc-vrm-1.0';
import { options } from '../options.ts';
import { transformToBinary } from './transformToBinary.ts';

/**
 * Appends one VRM morph target bind as animation sampler/channel entries.
 *
 * @param vrmBind The source VRM morph target bind to append
 * @param isBinary Whether the `isBinary` is true in the VRM expression
 * @param gltf The glTF object to modify
 * @param binChunkBox The reference box to the binary chunk
 * @param outAnimation The animation object to which new samplers and channels will be appended
 * @param extensionsUsedSet Extension names used by the generated animation
 * @returns `[samplerIndex, channelIndex]` when appended. `[null, null]` when skipped
 */
export function appendMorphtargetAnimation(
  vrmBind: ExpressionMorphTargetBind,
  isBinary: boolean,
  gltf: GLTF.IGLTF,
  binChunkBox: [Uint8Array],
  outAnimation: GLTF.IAnimation,
  extensionsUsedSet: Set<string>,
  nodeBinds: ExpressionMorphTargetBind[] = [vrmBind],
): [samplerIndex: number | null, channelIndex: number | null] {
  if (nodeBinds.every((bind) => bind.weight === 0)) {
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
  const targetsLength = mesh.primitives?.[0]?.targets?.length ?? 0;
  for (const bind of nodeBinds) {
    if (!Number.isInteger(bind.index) || bind.index < 0 || bind.index >= targetsLength || !Number.isFinite(bind.weight)) {
      throw new Error(`Invalid morph bind for node #${nodeIndex}`);
    }
  }
  const base = gltf.nodes?.[nodeIndex]?.weights ?? mesh.weights ?? new Array(targetsLength).fill(0);
  const initial = base[targetIndex];

  if (options.useAnimationPointerForMorphTarget) {
    const [inputIndex, outputIndex] = appendAnimationAccessors(
      new Float32Array(isBinary ? [0, 0.5, 1] : [0, 1]),
      new Float32Array(isBinary ? [initial, initial + weight, initial + weight] : [initial, initial + weight]),
      'SCALAR',
      gltf,
      binChunkBox,
    );
    logVerbose(
      `KHR_character_expression_morphtarget: New accessors (#${inputIndex}, #${outputIndex})`,
    );

    const samplerIndex = outAnimation.samplers.length;
    outAnimation.samplers.push({
      input: inputIndex,
      interpolation: isBinary ? 'STEP' : 'LINEAR',
      output: outputIndex,
    });

    extensionsUsedSet.add('KHR_animation_pointer');

    const channelIndex = outAnimation.channels.length;
    const pointer = `/nodes/${nodeIndex}/weights/${targetIndex}`;
    outAnimation.channels.push({
      sampler: samplerIndex,
      target: {
        path: 'pointer' as any,
        extensions: {
          'KHR_animation_pointer': {
            pointer,
          },
        },
      },
    });
    logVerbose(
      `KHR_character_expression_texture_transform: New animation channel, pointer for "${pointer}"`,
    );

    return [samplerIndex, channelIndex];
  } else {
    const outputWeights = new Float32Array(targetsLength * 2);
    outputWeights.set(base);
    outputWeights.set(base, targetsLength);
    for (const bind of nodeBinds) outputWeights[targetsLength + bind.index] += bind.weight;
    const [inputIndex, outputIndex] = appendAnimationAccessors(
      new Float32Array(isBinary ? [0, 0.5, 1] : [0, 1]),
      transformToBinary(
        outputWeights,
        isBinary,
      ),
      'SCALAR',
      gltf,
      binChunkBox,
    );
    logVerbose(
      `KHR_character_expression_morphtarget: New accessors (#${inputIndex}, #${outputIndex})`,
    );

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
    logVerbose(
      `KHR_character_expression_morphtarget: New animation channel, weights for node #${nodeIndex}`,
    );

    return [samplerIndex, channelIndex];
  }
}
