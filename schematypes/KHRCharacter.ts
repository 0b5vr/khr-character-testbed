import type { GLTFProperty } from './GLTFProperty.ts';

/**
 * glTF extension for character-specific metadata and properties.
 */
export interface KHRCharacter extends GLTFProperty {
  /**
   * Index of the glTF node representing the root of the character hierarchy. This node SHOULD be a common ancestor of all nodes containing character-related meshes and joints.
   */
  rootNode: number;
}
