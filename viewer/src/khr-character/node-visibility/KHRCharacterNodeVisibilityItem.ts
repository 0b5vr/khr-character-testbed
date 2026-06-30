import type * as THREE from 'three';

export interface KHRCharacterNodeVisibilityItem {
  node: THREE.Object3D;
  visibility: 'firstPerson' | 'thirdPerson' | 'always';
}
