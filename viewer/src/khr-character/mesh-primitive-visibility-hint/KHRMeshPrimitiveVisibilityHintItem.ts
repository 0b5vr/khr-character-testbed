import type * as THREE from 'three';

export interface KHRMeshPrimitiveVisibilityHintItem {
  object: THREE.Object3D;
  role: string;
  label?: string;
}
