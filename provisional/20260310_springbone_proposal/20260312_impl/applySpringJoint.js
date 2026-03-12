import * as THREE from 'three';
import { SpringJoint } from './SpringJoint.js';

const MAT4_IDENTITY = new THREE.Matrix4();

/**
 * Applies the spring joint transformation to the given Three.js object.
 *
 * @param {SpringJoint} joint The spring joint to apply.
 * @param {THREE.Object3D} object The Three.js object to apply the transformation to.
 */
export function applySpringJoint(joint, object) {
  const parentMatrixWorld = object.parent?.matrixWorld ?? MAT4_IDENTITY;
  const matrixWorld = parentMatrixWorld.clone().multiply(joint.restMatrixLocal);
  const matrixWorldInv = matrixWorld.clone().invert();
  const currentTailLocal = joint.currentTailWorld.clone().applyMatrix4(matrixWorldInv);
  object.quaternion.setFromUnitVectors(joint.restTailLocal, currentTailLocal);
  object.updateWorldMatrix(false, false);
}
