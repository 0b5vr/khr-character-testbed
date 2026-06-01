import { logVerbose } from './logVerbose.ts';
import type { GLTF } from '@gltf-transform/core';
import type { KHRCharacterSkeletonMapping, KHRCharacterSkeletonMappingSkeletalRigMapping } from '../schematypes/KHRCharacterSkeletonMapping.ts';
import type { HumanoidHumanBoneName, VRMCVRM } from '@pixiv/types-vrmc-vrm-1.0';

/**
 * In KHR_character, eye rotations are took place in the expression system, so setting eye bones in
 * the skeletal rig mapping may conflict with the expression system and cause issues.
 * To avoid this, we skip setting eye bones in the `vrmHumanoid` mapping.
 */
const vrmBonesToSkip: Set<HumanoidHumanBoneName> = new Set([
  'leftEye',
  'rightEye',
]);

export function appendKHRCharacterSkeleton(gltf: GLTF.IGLTF): void {
  const vrm = gltf.extensions?.['VRMC_vrm'] as VRMCVRM | undefined;
  const vrmHumanoid = vrm?.humanoid;
  if (vrmHumanoid == null) {
    return;
  }

  const nodes = gltf.nodes;
  const mappingName = 'vrmHumanoid';
  const mapping: KHRCharacterSkeletonMappingSkeletalRigMapping = {};

  logVerbose(`KHR_character_skeleton_mapping: Mapping VRM humanoid bones to ${mappingName} mapping`);

  for (const [boneName, humanBone] of Object.entries(vrmHumanoid.humanBones)) {
    if (vrmBonesToSkip.has(boneName as HumanoidHumanBoneName)) {
      logVerbose(`KHR_character_skeleton_mapping: "${mappingName}" mapping, skipping bone "${boneName}"`);
      continue;
    }

    const node = nodes?.[humanBone.node];
    const nodeName = node?.name;
    if (node != null && nodeName) {
      mapping[nodeName] = boneName;
      logVerbose(`KHR_character_skeleton_mapping: "${mappingName}" mapping, "${nodeName}": "${boneName}"`);
    }
  }

  gltf.extensionsUsed ||= [];
  gltf.extensionsUsed.push('KHR_character_skeleton_mapping');

  gltf.extensions ||= {};
  gltf.extensions['KHR_character_skeleton_mapping'] = {
    skeletalRigMappings: {
      [mappingName]: mapping,
    },
  } as KHRCharacterSkeletonMapping;
}
