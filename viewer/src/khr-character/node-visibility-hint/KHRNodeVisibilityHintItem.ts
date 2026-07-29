import type * as THREE from 'three';

export interface KHRNodeVisibilityHintItem {
  node: THREE.Object3D;
  role: string;
  label?: string;
}
