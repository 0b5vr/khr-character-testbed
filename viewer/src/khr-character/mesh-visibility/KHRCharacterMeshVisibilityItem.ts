import type * as THREE from 'three';

export interface KHRCharacterMeshVisibilityItem {
  object: THREE.Object3D;
  visibility: 'firstPerson' | 'thirdPerson' | 'always';
}
