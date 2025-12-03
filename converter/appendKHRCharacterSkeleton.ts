import { logVerbose } from './logVerbose.ts';
import type { GLTF } from 'npm:@gltf-transform/core@4.2.1';
import type { KHRCharacterSkeletonMapping, KHRCharacterSkeletonMappingSkeletalRigMapping } from '../schematypes/KHRCharacterSkeletonMapping.ts';
import type { VRMCVRM } from 'npm:@pixiv/types-vrmc-vrm-1.0@3.4.4';

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
