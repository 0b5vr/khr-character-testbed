import type { Quaternion, Vector3 } from 'three';

export interface Bone {
  gltfIndex: number;
  name: string;
  position: Vector3;
  rotation: Quaternion;
  scale: Vector3;
  worldPosition: Vector3;
  worldRotation: Quaternion;
  worldScale: Vector3;
}
