import type { GLTF } from '@gltf-transform/core';
import type { KHRNodeVisibilityHint } from '../../schematypes/KHRNodeVisibilityHint.ts';
import { logVerbose } from './logVerbose.ts';

const EXTENSION_NAME = 'KHR_node_visibility_hint';

/**
 * Appends `KHR_node_visibility_hint` to nodes with the specified names.
 *
 * When a node has a mesh and its name is in `thirdPersonNodeNames`, this function adds `KHR_node_visibility_hint` to the node with `role: "third_person"`.
 *
 * @param gltf - The glTF object to modify.
 * @param thirdPersonNodeNames - The names of the nodes to which the extension should be applied.
 */
export function appendKHRNodeVisibilityHint(
  gltf: GLTF.IGLTF,
  thirdPersonNodeNames: readonly string[],
): void {
  const nodes = gltf.nodes;
  if (nodes == null) {
    return;
  }

  const targetNodeNames = new Set(thirdPersonNodeNames);
  let isExtensionUsed = false;

  for (let nodeIndex = 0; nodeIndex < nodes.length; nodeIndex += 1) {
    const node = nodes[nodeIndex];
    if (
      node.mesh != null && node.name != null && targetNodeNames.has(node.name)
    ) {
      node.extensions ||= {};
      if (node.extensions[EXTENSION_NAME] != null) {
        logVerbose(`${EXTENSION_NAME}: Node #${nodeIndex} ("${node.name}") already has ${EXTENSION_NAME}, skipping`);
      } else {
        node.extensions[EXTENSION_NAME] = {
          role: 'third_person',
        } satisfies KHRNodeVisibilityHint;
        isExtensionUsed = true;

        logVerbose(`${EXTENSION_NAME}: Setting "role": "third_person" to node #${nodeIndex} ("${node.name}")`);
      }
    }
  }

  if (isExtensionUsed) {
    gltf.extensionsUsed ||= [];
    if (!gltf.extensionsUsed.includes(EXTENSION_NAME)) {
      gltf.extensionsUsed.push(EXTENSION_NAME);
    }
  }
}
