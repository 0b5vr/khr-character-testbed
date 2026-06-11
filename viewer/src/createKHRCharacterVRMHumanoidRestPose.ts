import * as THREE from 'three';
import { VRMHumanBoneName, VRMHumanBoneParentMap, VRMRequiredHumanBoneName } from '@pixiv/three-vrm-core';
import type { KHRCharacterSkeletonMapping } from './khr-character/skeleton/KHRCharacterSkeletonMapping';
import type { KHRCharacterVRMHumanoidRestPose } from './KHRCharacterVRMHumanoidRestPose';

const tempPosition = new THREE.Vector3();
const tempScale = new THREE.Vector3();

const vrmHumanBoneNameSet = new Set<string>(Object.values(VRMHumanBoneName));

/**
 * In KHR_character, eye rotations and jaw movements are took place in the expression system,
 * so setting eye bones and the jaw bone in the skeletal rig mapping may conflict with
 * the expression system and cause issues.
 * To avoid this, we skip reading eye bones and the jaw bone in the `vrmHumanoid` mapping
 * and ignore them.
 */
const vrmBonesToSkip: Set<VRMHumanBoneName> = new Set([
  'leftEye',
  'rightEye',
  'jaw',
]);


/**
 * Checks whether the given bone name is a known VRM humanoid bone name.
 *
 * @param boneName - A skeletal rig mapping key to test.
 * @returns True when the name is a VRM humanoid bone name.
 */
function isVRMHumanBoneName(boneName: string): boneName is VRMHumanBoneName {
  return vrmHumanBoneNameSet.has(boneName);
}

/**
 * Converts a raw skeletal rig mapping into a validated VRM humanoid bone node map.
 *
 * @param vrmHumanoidMapping - A `vrmHumanoid` skeletal rig mapping.
 * @returns A validated bone node map, or null when the mapping is invalid.
 */
function createValidatedVRMHumanoidBoneNodeMap(
  vrmHumanoidMapping: Map<string, THREE.Object3D>,
): Map<VRMHumanBoneName, THREE.Object3D> | null {
  const boneNodeMap = new Map<VRMHumanBoneName, THREE.Object3D>();

  for (const [vrmBoneName, node] of vrmHumanoidMapping) {
    // unknown bone name
    if (!isVRMHumanBoneName(vrmBoneName)) {
      console.warn(`Invalid VRM humanoid mapping: Bone "${vrmBoneName}" is not a valid VRM human bone name.`);
      return null;
    }

    // duplicated bone name
    if (boneNodeMap.has(vrmBoneName)) {
      console.warn(`Invalid VRM humanoid mapping: Bone "${vrmBoneName}" is duplicated.`);
      return null;
    }

    // eye bones and jaw bone
    if (vrmBonesToSkip.has(vrmBoneName as VRMHumanBoneName)) {
      console.warn(`Bone "${vrmBoneName}" must not be included in the "vrmHumanoid" mapping to avoid conflicts with the expression system. Skipping this bone.`);
      continue;
    }

    boneNodeMap.set(vrmBoneName, node);
  }

  // check required bones
  for (const requiredBoneName of Object.values(VRMRequiredHumanBoneName)) {
    if (!boneNodeMap.has(requiredBoneName)) {
      console.warn(`Invalid VRM humanoid mapping: Required bone "${requiredBoneName}" is missing.`);
      return null;
    }
  }

  // check if bones are in correct hierarchy
  for (const [boneName, parentBoneName] of Object.entries(VRMHumanBoneParentMap)) {
    if (parentBoneName == null) {
      continue;
    }

    const boneNode = boneNodeMap.get(boneName as VRMHumanBoneName);
    const parentBoneNode = boneNodeMap.get(parentBoneName);
    if (boneNode == null || parentBoneNode == null) {
      continue;
    }

    let found = false;
    boneNode.traverseAncestors((object) => {
      if (object === parentBoneNode) {
        found = true;
        return false;
      }

      return true;
    });

    if (!found) {
      console.warn(`Invalid VRM humanoid mapping: Bone "${boneName}" is not a descendant of its parent bone "${parentBoneName}".`);
      return null;
    }
  }

  return boneNodeMap;
}

/**
 * Captures the rest-pose data used to retarget VRM humanoid animation tracks to raw KHR character bones.
 *
 * @param skeletonMapping - The loaded KHR character skeleton mapping.
 * @returns A rest-pose map keyed by VRM humanoid bone name, or null when the `vrmHumanoid` mapping is missing.
 */
export function createKHRCharacterVRMHumanoidRestPose(
  skeletonMapping: KHRCharacterSkeletonMapping,
): KHRCharacterVRMHumanoidRestPose | null {
  const vrmHumanoidMapping = skeletonMapping.skeletalRigMappings.get('vrmHumanoid');
  if (vrmHumanoidMapping == null) {
    return null;
  }

  const boneNodeMap = createValidatedVRMHumanoidBoneNodeMap(vrmHumanoidMapping);
  if (boneNodeMap == null) {
    return null;
  }

  // ensure hips node exists
  const hipsNode = boneNodeMap.get('hips');
  if (hipsNode == null) {
    console.warn('Invalid VRM humanoid mapping: Required bone "hips" is missing.');
    return null;
  }

  // update entire world matrix
  if (hipsNode.parent != null) {
    hipsNode.parent.updateWorldMatrix(true, true);
  } else {
    hipsNode.updateWorldMatrix(true, false);
  }

  // populate rest pose data
  const restPose: KHRCharacterVRMHumanoidRestPose = new Map();
  for (const [vrmBoneName, node] of boneNodeMap) {
    const parentWorldMatrix = node.parent?.matrixWorld.clone() ?? new THREE.Matrix4();
    const parentWorldRotation = new THREE.Quaternion();
    parentWorldMatrix.decompose(tempPosition, parentWorldRotation, tempScale);

    restPose.set(vrmBoneName, {
      node,
      localRotation: node.quaternion.clone(),
      parentWorldRotation,
      parentWorldMatrix,
      worldPosition: node.getWorldPosition(new THREE.Vector3()),
      localScale: node.scale.clone(),
    });
  }

  return restPose;
}
