import { logVerbose } from './logVerbose.ts';
import type { GLTF } from '@gltf-transform/core';
import type { VRMCVRM } from '@pixiv/types-vrmc-vrm-1.0';

const EXTENSION_NAME = 'KHR_node_camera_hint';

export function appendKHRNodeCameraHint(gltf: GLTF.IGLTF): void {
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
    console.error(`${EXTENSION_NAME}: The model is invalid; it does not have a head bone.`);
    return;
  }

  const nodes = gltf.nodes;
  if (nodes == null) {
    console.error(`${EXTENSION_NAME}: The model is invalid; it does not have any nodes.`);
    return;
  }

  const headNode = nodes?.[headNodeIndex];
  if (headNode == null) {
    console.error(`${EXTENSION_NAME}: The model is invalid; head node #${headNodeIndex} is missing.`);
    return;
  }

  logVerbose(`${EXTENSION_NAME}: VRM lookAt offsetFromHeadBone found, adding ${EXTENSION_NAME}`);
  logVerbose(`${EXTENSION_NAME}: Head node is #${headNodeIndex} ("${headNode.name}")`);
  logVerbose(`${EXTENSION_NAME}: Offset from head bone: [${offsetFromHeadBone.join(', ')}]`);

  gltf.extensionsUsed ||= [];
  gltf.extensionsUsed.push(EXTENSION_NAME);

  const cameraNodeIndex = nodes.length;
  const cameraNodeName = '__FirstPersonCamera__';

  logVerbose(`${EXTENSION_NAME}: Adding a node #${cameraNodeIndex} "${cameraNodeName}" under the head bone #${headNodeIndex}}`);

  const cameraNode: GLTF.INode = {
    name: cameraNodeName,
    translation: offsetFromHeadBone,
    extensions: {
      [EXTENSION_NAME]: {
        role: 'first_person',
      },
    },
  };
  nodes.push(cameraNode);

  headNode.children ||= [];
  headNode.children.push(cameraNodeIndex);
}
