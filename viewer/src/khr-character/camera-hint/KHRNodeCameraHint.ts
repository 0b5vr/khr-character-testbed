import * as THREE from 'three';

export interface KHRNodeCameraHint {
  node: THREE.Object3D;
  role: string;
  label?: string;
}
