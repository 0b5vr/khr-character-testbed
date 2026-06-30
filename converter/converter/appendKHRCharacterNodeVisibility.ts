import type { GLTF } from '@gltf-transform/core';
import type { KHRCharacterNodeVisibility } from '../../schematypes/KHRCharacterNodeVisibility.ts';
import { logVerbose } from './logVerbose.ts';

const EXTENSION_NAME = 'KHR_character_node_visibility';

/**
 * Appends `KHR_character_node_visibility` to nodes with the specified names.
 *
 * When a node has a mesh and its name is in `thirdPersonNodeNames`, this function adds `KHR_character_node_visibility` to the node with `visibility: "thirdPerson"`.
 *
 * @param gltf - The glTF object to modify.
 * @param thirdPersonNodeNames - The names of the nodes to which the extension should be applied.
 */
export function appendKHRCharacterNodeVisibility(
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
          visibility: 'thirdPerson',
        } satisfies KHRCharacterNodeVisibility;
        isExtensionUsed = true;

        logVerbose(`${EXTENSION_NAME}: Setting "visibility": "thirdPerson" to node #${nodeIndex} ("${node.name}")`);
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
