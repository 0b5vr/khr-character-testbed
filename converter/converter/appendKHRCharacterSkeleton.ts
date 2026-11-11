import { logVerbose } from './logVerbose.ts';
import type { GLTF } from '@gltf-transform/core';
import type {
  KHRCharacterSkeletonMapping,
  KHRCharacterSkeletonMappingSkeletalRigMapping,
} from '../../schematypes/KHRCharacterSkeletonMapping.ts';
import type { HumanoidHumanBoneName, VRMCVRM } from '@pixiv/types-vrmc-vrm-1.0';

/** Host policy: leave eyes and jaw to expression evaluation during VRM playback. */
const vrmBonesToSkip: Set<HumanoidHumanBoneName> = new Set([
  'leftEye',
  'rightEye',
  'jaw',
]);

export function appendKHRCharacterSkeleton(gltf: GLTF.IGLTF): void {
  const vrm = gltf.extensions?.['VRMC_vrm'] as VRMCVRM | undefined;
  const vrmHumanoid = vrm?.humanoid;
  if (vrmHumanoid == null) {
    return;
  }

  const nodes = gltf.nodes;
  const mappingName = 'vrm1_humanoid';
  const mapping: KHRCharacterSkeletonMappingSkeletalRigMapping = {};

  logVerbose(
    `KHR_character_skeleton_mapping: Mapping VRM humanoid bones to ${mappingName} mapping`,
  );

  for (const [boneName, humanBone] of Object.entries(vrmHumanoid.humanBones)) {
    if (vrmBonesToSkip.has(boneName as HumanoidHumanBoneName)) {
      logVerbose(
        `KHR_character_skeleton_mapping: "${mappingName}" mapping, skipping bone "${boneName}"`,
      );
      continue;
    }

    const sourceNodeIndex = humanBone.node;
    const node = nodes?.[sourceNodeIndex];
    if (node != null) {
      mapping[boneName] = {
        node: sourceNodeIndex,
        ...(node.name != null ? { name: node.name } : {}),
      };
      logVerbose(
        `KHR_character_skeleton_mapping: "${mappingName}" mapping, "${boneName}": { node: #${sourceNodeIndex}, name: "${node.name}" }`,
      );
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
