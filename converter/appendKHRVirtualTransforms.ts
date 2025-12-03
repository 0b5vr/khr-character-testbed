import { logVerbose } from './logVerbose.ts';
import type { GLTF } from 'npm:@gltf-transform/core@4.2.1';
import type { VRMCVRM } from 'npm:@pixiv/types-vrmc-vrm-1.0@3.4.4';
import type { KHRVirtualTransforms } from '../schematypes/KHRVirtualTransforms.ts';

export function appendKHRVirtualTransforms(gltf: GLTF.IGLTF): void {
  const vrm = gltf.extensions?.['VRMC_vrm'] as VRMCVRM | undefined;
  if (vrm == null) {
    return;
  }

  const vrmLookAt = vrm.lookAt;
  const offsetFromHeadBone = vrmLookAt?.offsetFromHeadBone as [number, number, number] | undefined;
  if (offsetFromHeadBone == null) {
    return;
  }

  const vrmHumanoid = vrm.humanoid;
  const headBone = vrmHumanoid?.humanBones.head;
  const headNodeIndex = headBone?.node;
  if (headNodeIndex == null) {
    console.error('KHR_virtual_transforms: The model is invalid; it does not have a head bone.')
    return;
  }

  const nodes = gltf.nodes;
  const headNode = nodes?.[headNodeIndex];
  if (headNode == null) {
    console.error(`KHR_virtual_transforms: The model is invalid; head node #${headNodeIndex} is missing.`);
    return;
  }

  logVerbose(`KHR_virtual_transforms: VRM lookAt offsetFromHeadBone found, adding KHR_virtual_transforms`);
  logVerbose(`KHR_virtual_transforms: Head node is #${headNodeIndex} ("${headNode.name}")`);
  logVerbose(`KHR_virtual_transforms: Offset from head bone: [${offsetFromHeadBone.join(', ')}]`);

  gltf.extensionsUsed ||= [];
  gltf.extensionsUsed.push('KHR_virtual_transforms');

  gltf.extensions ||= {};
  gltf.extensions['KHR_virtual_transforms'] = {
    virtualTransforms: [
      {
        name: 'VRMLookAtOffsetFromHeadBone',
        parent: headNodeIndex,
        translation: offsetFromHeadBone,
        tags: ['look_at'],
      },
    ],
  } satisfies KHRVirtualTransforms;
}
