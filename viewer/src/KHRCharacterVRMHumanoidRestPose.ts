import * as THREE from 'three';

/**
 * Rest-pose data for a single VRM humanoid bone mapped to a raw KHR character bone.
 */
export type KHRCharacterVRMHumanoidBoneRest = {
  node: THREE.Object3D;
  localRotation: THREE.Quaternion;
  parentWorldRotation: THREE.Quaternion;
  parentWorldMatrix: THREE.Matrix4;
  worldPosition: THREE.Vector3;
};

/**
 * A rest pose for VRM humanoid animation retargeting.
 */
export type KHRCharacterVRMHumanoidRestPose = Map<string, KHRCharacterVRMHumanoidBoneRest>;
