// @ts-types="npm:@types/three@0.181.0"
import type { Quaternion, Vector3 } from 'npm:three@0.181.2';

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
