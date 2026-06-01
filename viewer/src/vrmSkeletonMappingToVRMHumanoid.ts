import { type KHRCharacterSkeletonMapping } from './khr-character/skeleton/KHRCharacterSkeletonMapping';
import { VRMHumanoid, type VRMHumanBones, VRMRequiredHumanBoneName, VRMHumanBoneName, VRMHumanBoneParentMap } from '@pixiv/three-vrm-core';

const vrmHumanBoneNameSet = new Set<string>(Object.values(VRMHumanBoneName));

/**
 * In KHR_character, eye rotations are took place in the expression system, so setting eye bones in
 * the skeletal rig mapping may conflict with the expression system and cause issues.
 * To avoid this, we skip reading eye bones in the `vrmHumanoid` mapping and ignore them.
 */
const vrmBonesToSkip: Set<VRMHumanBoneName> = new Set([
  'leftEye',
  'rightEye',
]);

/**
 * Convert a `vrmHumanoid` mapping in {@link KHRCharacterSkeletonMapping} to a {@link VRMHumanoid}.
 * It returns null if the mapping is invalid, e.g. missing required bones or incorrect hierarchy.
 *
 * @param skeletonMapping - A {@link KHRCharacterSkeletonMapping} that contains a `vrmHumanoid` mapping.
 * @returns A {@link VRMHumanoid} instance or null if the mapping is invalid.
 */
export function vrmSkeletonMappingToVRMHumanoid(skeletonMapping: KHRCharacterSkeletonMapping): VRMHumanoid | null {
  const source = skeletonMapping.skeletalRigMappings.get('vrmHumanoid');
  if (source == null) {
    return null;
  }

  // create a vrm human bones map
  const humanBones: Partial<VRMHumanBones> = {};
  for (const [node, vrmBoneName] of source) {
    if (!vrmHumanBoneNameSet.has(vrmBoneName)) {
      console.warn(`Bone "${vrmBoneName}" is not a valid VRM human bone name. Skipping this bone.`);
      continue;
    }

    if (vrmBonesToSkip.has(vrmBoneName as VRMHumanBoneName)) {
      console.warn(`Bone "${vrmBoneName}" must not be included in the "vrmHumanoid" mapping to avoid conflicts with the expression system. Skipping this bone.`);
      continue;
    }

    humanBones[vrmBoneName as VRMHumanBoneName] = { node };
  }

  // validation: check if all required bones exist
  for (const requiredBoneName of Object.values(VRMRequiredHumanBoneName)) {
    if (!humanBones.hasOwnProperty(requiredBoneName)) {
      console.warn(`Invalid VRM humanoid mapping: Required bone "${requiredBoneName}" is missing.`);
      return null;
    }
  }

  // validation: check if bones are in correct hierarchy
  for (const [boneName, parentBoneName] of Object.entries(VRMHumanBoneParentMap)) {
    if (parentBoneName == null) {
      continue;
    }

    const boneNode = humanBones[boneName as VRMHumanBoneName]?.node;
    const parentBoneNode = humanBones[parentBoneName as VRMHumanBoneName]?.node;
    if (boneNode == null || parentBoneNode == null) {
      continue;
    }

    let found = false;
    boneNode.traverseAncestors((o) => {
      if (o === parentBoneNode) {
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


  return new VRMHumanoid(humanBones as VRMHumanBones);
}
