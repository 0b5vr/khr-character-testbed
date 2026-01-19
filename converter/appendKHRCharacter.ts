import type { GLTF } from 'npm:@gltf-transform/core@4.2.1';
import type { KHRCharacter } from '../schematypes/KHRCharacter.ts';

/**
 * Gets the index of the root node in the given glTF model.
 * If the model does not have a single root node, returns null.
 *
 * @param gltf The glTF model to process.
 * @returns The index of the root node, or null if not found or multiple roots exist.
 */
function getRootNodeIndex(gltf: GLTF.IGLTF): number | null {
  // get the default scene
  const sceneIndex = gltf.scene ?? 0;
  const scene = gltf.scenes?.[sceneIndex];
  if (!scene) {
    console.warn('No default scene found in glTF');
    return null;
  }

  // identify the root node
  if (!scene.nodes || scene.nodes.length === 0) {
    console.warn('No root node found in the default scene');
    return null;
  } else if (scene.nodes.length > 1) {
    console.warn('Multiple root nodes found in the default scene; KHR_character requires a single root node');
    return null;
  }

  return scene.nodes[0];
}

/**
 * Appends the KHR_character extension to the given glTF model.
 *
 * @param gltf The glTF model to process.
 */
export function appendKHRCharacter(gltf: GLTF.IGLTF): void {
  // identify the root node
  const rootNodeIndex = getRootNodeIndex(gltf);
  if (rootNodeIndex == null) {
    console.warn('Skipping KHR_character extension append due to missing root node');
    return;
  }

  // append KHR_character extension
  gltf.extensionsUsed ||= [];
  gltf.extensionsUsed.push('KHR_character');

  gltf.extensions ||= {};
  gltf.extensions['KHR_character'] = {
    rootNode: rootNodeIndex,
  } satisfies KHRCharacter;
}
