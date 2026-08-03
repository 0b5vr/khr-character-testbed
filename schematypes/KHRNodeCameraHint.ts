import type { GLTFProperty } from './GLTFProperty.ts';

/**
 * Marks a node as an authored camera positioning suggestion. The node's world-space transform defines the recommended camera placement. The runtime MAY use this as a default view, orbit center, portrait framing, or other camera-related viewpoint.
 */
export interface KHRNodeCameraHint extends GLTFProperty {
  /**
   * The semantic purpose of this camera hint. Determines how runtimes interpret the node's transform. Standard vocabulary values provide interoperability guarantees; custom values are permitted for domain-specific use cases.
   */
  role: string;

  /**
   * Index of a glTF camera in the root cameras array whose projection parameters (FOV, clip planes, type) and any camera extensions apply to this hint. Advisory — runtimes MAY override.
   */
  camera?: number;

  /**
   * Index of a glTF node that this camera should orient toward. When specified, the camera's look-at direction is computed from the vector between this node and the target node.
   */
  targetNode?: number;

  /**
   * Human-readable label for this camera position. Used for UI display in model viewers and camera selection menus.
   */
  label?: string;
}
