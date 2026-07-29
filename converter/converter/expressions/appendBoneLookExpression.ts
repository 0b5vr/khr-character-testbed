import { appendAnimationAccessors } from './appendAnimationAccessors.ts';
import { logVerbose } from '../logVerbose.ts';
import { Quaternion } from 'three';
import type { GLTF } from '@gltf-transform/core';
import type {
  Humanoid as VRMHumanoid,
  LookAt as VRMLookAt,
  LookAtRangeMap,
} from '@pixiv/types-vrmc-vrm-1.0';
import type { KHRCharacterExpressionExpression } from '../../../schematypes/KHRCharacterExpression.ts';
import type { Bone } from '../Bone.ts';
import type { VRMLookExpressionName } from './VRMLookExpressionName.ts';

/** Identity quaternion. Do not mutate */
const QUAT_IDENTITY = new Quaternion(0, 0, 0, 1);

const _quatA = new Quaternion();
const _quatB = new Quaternion();

/**
 * Creates lookAt rotation animation using eye bones and appends it to glTF.
 *
 * @param bone The eye bone to create the lookAt animation for
 * @param vrmLookAt VRM lookAt object. Assume to be type == "bone"
 * @param name The corresponding look expression name
 * @param isLeft Is the bone for left eye?
 * @param gltf The glTF object to modify
 * @param binChunkBox The reference box to the binary chunk
 * @returns Tuple of `[inputAccessorIndex, outputAccessorIndex]`, or `null` if the animation cannot be created
 */
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
    rangeMap = isLeft
      ? vrmLookAt.rangeMapHorizontalOuter
      : vrmLookAt.rangeMapHorizontalInner;
    _quatA.set(0, 0.7071, 0, 0.7071); // 90 degrees left
  } else if (name === 'lookRight') {
    rangeMap = isLeft
      ? vrmLookAt.rangeMapHorizontalInner
      : vrmLookAt.rangeMapHorizontalOuter;
    _quatA.set(0, -0.7071, 0, 0.7071); // 90 degrees right
  } else {
    throw new Error(`Unreachable. Unknown look expression name: ${name}`);
  }

  if (
    rangeMap == null || rangeMap.inputMaxValue == null ||
    rangeMap.outputScale == null || rangeMap.outputScale === 0
  ) {
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
    bone.rotation.x,
    bone.rotation.y,
    bone.rotation.z,
    bone.rotation.w,
    _quatA.x,
    _quatA.y,
    _quatA.z,
    _quatA.w,
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
 * Creates look-at rotation animation using eye bones and appends it to glTF.
 *
 * @param name The interested look expression name
 * @param vrmHumanoid VRM humanoid containing eye bone mappings
 * @param vrmLookAt VRM lookAt object. Assume to be type == "bone"
 * @param gltf The glTF object to modify
 * @param binChunkBox The reference box to the binary chunk
 * @param nodeBoneMap Node index to bone map
 * @returns Tuple of `[animationIndex, channelIndices]`
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
    if (nodeIndex == null) {
      continue;
    }

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
    logVerbose(
      `KHR_character_expression_joint: New accessors (#${inputIndex}, #${outputIndex})`,
    );

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
    logVerbose(
      `KHR_character_expression_joint: New animation channel, rotation for node #${nodeIndex}`,
    );
    channelIndices.push(channelIndex);
  }

  gltf.animations ||= [];
  gltf.animations.push(animation);

  const animationIndex = gltf.animations.length - 1;
  logVerbose(
    `KHR_character_expression_joint: New animation (#${animationIndex})`,
  );

  return [animationIndex, channelIndices];
}

/**
 * Appends a KHR_character_expression expression entry generated from VRM bone lookAt.
 *
 * @param name The interested look expression name
 * @param vrmHumanoid VRM humanoid containing eye bone mappings
 * @param vrmLookAt VRM lookAt object. Assume to be type == "bone"
 * @param gltf The glTF object to modify
 * @param binChunkBox The reference box to the binary chunk
 * @param outExpressions Output expression list to append to
 * @param nodeBoneMap Node index to bone map
 * @param extensionsUsedSet Extension names used by the generated expression
 * @returns Appended expression index, or `null` if not created
 */
export function appendBoneLookExpression(
  name: VRMLookExpressionName,
  vrmHumanoid: VRMHumanoid,
  vrmLookAt: VRMLookAt,
  gltf: GLTF.IGLTF,
  binChunkBox: [Uint8Array],
  outExpressions: KHRCharacterExpressionExpression[],
  nodeBoneMap: Record<number, Bone>,
  extensionsUsedSet: Set<string>,
): number | null {
  const [animationIndex, channelIndices] = appendBoneLookAnimation(
    name,
    vrmHumanoid,
    vrmLookAt,
    gltf,
    binChunkBox,
    nodeBoneMap,
  );
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
  extensionsUsedSet.add('KHR_character_expression_joint');

  return outExpressions.length - 1;
}
