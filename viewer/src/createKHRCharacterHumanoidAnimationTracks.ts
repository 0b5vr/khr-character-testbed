import * as THREE from 'three';
import type { VRMAnimation } from '@pixiv/three-vrm-animation';
import type { KHRCharacterVRMHumanoidBoneRest, KHRCharacterVRMHumanoidRestPose } from './KHRCharacterVRMHumanoidRestPose';

/**
 * Retargeted Three.js humanoid animation tracks keyed by VRM humanoid bone name.
 */
export type KHRCharacterHumanoidAnimationTracks = {
  translation: Map<string, THREE.VectorKeyframeTrack>;
  rotation: Map<string, THREE.QuaternionKeyframeTrack>;
};

const _quatA = new THREE.Quaternion();
const _quatB = new THREE.Quaternion();
const _v3A = new THREE.Vector3();

/**
 * Converts a VRM humanoid rotation track into keyframe values targeting a raw KHR character bone.
 *
 * @param origTrack - The source VRM humanoid quaternion track.
 * @param boneRest - Rest-pose data for the target raw bone.
 * @returns Quaternion keyframe values in the target bone local space.
 */
function createRotationValues(
  origTrack: THREE.QuaternionKeyframeTrack,
  boneRest: KHRCharacterVRMHumanoidBoneRest,
): Float32Array {
  const values = new Float32Array(origTrack.values.length);
  const parentWorldRotation = boneRest.parentWorldRotation;
  const parentWorldRotationInverse = _quatB.copy(parentWorldRotation).invert();

  for (let i = 0; i < origTrack.values.length; i += 4) {
    _quatA.fromArray(origTrack.values, i);

    _quatA
      .multiply(parentWorldRotation)
      .premultiply(parentWorldRotationInverse)
      .multiply(boneRest.localRotation)
      .toArray(values, i);
  }

  return values;
}

/**
 * Converts a VRM humanoid hips translation track into keyframe values targeting a raw KHR character hips bone.
 *
 * @param vrmAnimation - The source VRM animation.
 * @param origTrack - The source VRM humanoid vector track.
 * @param boneRest - Rest-pose data for the target raw hips bone.
 * @returns Position keyframe values in the target hips parent local space.
 */
function createTranslationValues(
  vrmAnimation: VRMAnimation,
  origTrack: THREE.VectorKeyframeTrack,
  boneRest: KHRCharacterVRMHumanoidBoneRest,
): Float32Array {
  const values = new Float32Array(origTrack.values.length);
  const animationHipsHeight = vrmAnimation.restHipsPosition.y;
  const targetHipsHeight = boneRest.worldPosition.y;
  const scale = Math.abs(animationHipsHeight) > 0.000001
    ? targetHipsHeight / animationHipsHeight
    : 1.0;
  const parentWorldMatrixInverse = boneRest.parentWorldMatrix.clone().invert();

  for (let i = 0; i < origTrack.values.length; i += 3) {
    _v3A.fromArray(origTrack.values, i);

    _v3A
      .multiplyScalar(scale)
      .applyMatrix4(parentWorldMatrixInverse)
      .toArray(values, i);
  }

  return values;
}

/**
 * Creates Three.js keyframe tracks that animate raw KHR character humanoid bones.
 *
 * @param vrmAnimation - The source VRM animation.
 * @param restPose - A rest pose captured with `createKHRCharacterVRMHumanoidRestPose`.
 * @returns Retargeted translation and rotation tracks keyed by VRM humanoid bone name.
 */
export function createKHRCharacterHumanoidAnimationTracks(
  vrmAnimation: VRMAnimation,
  restPose: KHRCharacterVRMHumanoidRestPose,
): KHRCharacterHumanoidAnimationTracks {
  const translation = new Map<string, THREE.VectorKeyframeTrack>();
  const rotation = new Map<string, THREE.QuaternionKeyframeTrack>();

  for (const [boneName, origTrack] of vrmAnimation.humanoidTracks.rotation.entries()) {
    const boneRest = restPose.get(boneName);
    if (boneRest == null) {
      continue;
    }

    rotation.set(
      boneName,
      new THREE.QuaternionKeyframeTrack(
        `${boneRest.node.name}.quaternion`,
        origTrack.times,
        createRotationValues(origTrack, boneRest),
      ),
    );
  }

  for (const [boneName, origTrack] of vrmAnimation.humanoidTracks.translation.entries()) {
    const boneRest = restPose.get(boneName);
    if (boneRest == null) {
      continue;
    }

    translation.set(
      boneName,
      new THREE.VectorKeyframeTrack(
        `${boneRest.node.name}.position`,
        origTrack.times,
        createTranslationValues(vrmAnimation, origTrack, boneRest),
      ),
    );
  }

  return { translation, rotation };
}
