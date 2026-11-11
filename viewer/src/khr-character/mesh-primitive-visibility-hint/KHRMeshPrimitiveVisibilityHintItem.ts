import type * as THREE from 'three';

export interface KHRMeshPrimitiveVisibilityHintItem {
  object: THREE.Object3D;
  roles: string[];
  label?: string;
}
