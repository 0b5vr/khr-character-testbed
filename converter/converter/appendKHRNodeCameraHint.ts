import { logVerbose } from './logVerbose.ts';
import { Quaternion } from 'three';
import type { GLTF } from '@gltf-transform/core';
import type { VRMCVRM } from '@pixiv/types-vrmc-vrm-1.0';
import { Bone } from './Bone.ts';

const QUAT_YP_180DEG = new Quaternion(0, 1, 0, 0);

const EXTENSION_NAME = 'KHR_node_camera_hint';

export function appendKHRNodeCameraHint(
  gltf: GLTF.IGLTF,
  nodeBoneMap: Record<number, Bone>,
): void {
  const vrm = gltf.extensions?.['VRMC_vrm'] as VRMCVRM | undefined;
  if (vrm == null) {
    return;
  }

  const vrmLookAt = vrm.lookAt;
  const offsetFromHeadBone = vrmLookAt?.offsetFromHeadBone as [
    number,
    number,
    number,
  ] | undefined;
  if (offsetFromHeadBone == null) {
    return;
  }

  const vrmHumanoid = vrm.humanoid;
  const headNodeIndex = vrmHumanoid?.humanBones.head?.node;
  if (headNodeIndex == null) {
    console.error(
      `${EXTENSION_NAME}: The model is invalid; it does not have a head bone.`,
    );
    return;
  }

  const nodes = gltf.nodes;
  if (nodes == null) {
    console.error(
      `${EXTENSION_NAME}: The model is invalid; it does not have any nodes.`,
    );
    return;
  }

  const headNode = nodes?.[headNodeIndex];
  if (headNode == null) {
    console.error(
      `${EXTENSION_NAME}: The model is invalid; head node #${headNodeIndex} is missing.`,
    );
    return;
  }

  const headBone = nodeBoneMap[headNodeIndex];
  if (headBone == null) {
    throw new Error(
      `${EXTENSION_NAME}: Unreachable. Missing bone for the node #${headNodeIndex}.`,
    );
  }

  logVerbose(
    `${EXTENSION_NAME}: VRM lookAt offsetFromHeadBone found, adding ${EXTENSION_NAME}`,
  );
  logVerbose(
    `${EXTENSION_NAME}: Head node is #${headNodeIndex} ("${headNode.name}")`,
  );
  logVerbose(
    `${EXTENSION_NAME}: Offset from head bone: [${
      offsetFromHeadBone.join(', ')
    }]`,
  );

  gltf.extensionsUsed ||= [];
  gltf.extensionsUsed.push(EXTENSION_NAME);

  const cameraNodeIndex = nodes.length;
  const cameraNodeName = '__FirstPersonCamera__';

  logVerbose(
    `${EXTENSION_NAME}: Adding a node #${cameraNodeIndex} "${cameraNodeName}" under the head bone #${headNodeIndex}}`,
  );

  const cameraNode: GLTF.INode = {
    name: cameraNodeName,
    translation: offsetFromHeadBone,
    rotation: headBone.worldRotation.clone().invert().multiply(QUAT_YP_180DEG)
      .toArray(),
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
