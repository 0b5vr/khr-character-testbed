import type { GLTF } from 'npm:@gltf-transform/core@4.2.1';
import { logVerbose } from './logVerbose.ts';

/**
 * Ensures that the given glTF model has a single root node.
 * If the model has multiple root nodes, a new empty root node is created
 * that groups all existing root nodes as its children.
 *
 * @param gltf The glTF model to process.
 */
export function ensureSingleRoot(gltf: GLTF.IGLTF): void {
  // sanity check: does the glTF have nodes?
  if (!gltf.nodes || gltf.nodes.length === 0) {
    return;
  }

  // get the default scene
  const sceneIndex = gltf.scene ?? 0;
  const scene = gltf.scenes?.[sceneIndex];
  if (!scene) {
    console.warn('No default scene found in glTF');
    return;
  }

  // if the scene already has a single root, do nothing
  if (scene.nodes && scene.nodes.length === 1) {
    logVerbose('The given glTF already is a single-root model');
    return;
  }
  logVerbose('Making it a single-root model');

  // create a new root node
  const newRootNode: GLTF.INode = {
    name: '__SingleRoot__',
    children: scene.nodes,
  };
  const newRootNodeIndex = gltf.nodes.length;
  gltf.nodes.push(newRootNode);

  // update the scene to have only the new root node
  scene.nodes = [newRootNodeIndex];
}
