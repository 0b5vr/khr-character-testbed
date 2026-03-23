import * as THREE from 'three';
import { SpringJoint } from './SpringJoint.js';
import { applySpringJoint } from './applySpringJoint.js';

export class SpringBoneGroup extends THREE.Group {
  /** @type {THREE.Mesh[]} Array of cube meshes representing the bones in the group. */
  meshes = [];

  /** @type {SpringJoint[]} Array of spring joints corresponding to the bones. */
  joints = [];

  constructor() {
    super();

    // cubes
    const geometry = new THREE.BoxGeometry();
    geometry.translate(0.0, 0.5, 0.0);
    const material = new THREE.MeshStandardMaterial({ color: 0x22dd22 });

    this.meshes = [];
    for (let i = 0; i < 5; i++) {
      const mesh = new THREE.Mesh(geometry, material);
      const parent = i === 0 ? this : this.meshes[i - 1];
      parent.add(mesh);

      mesh.position.y = i === 0 ? -2.0 : 1.0;
      this.meshes[i] = mesh;
    }

    const rootMesh = this.meshes[0];
    rootMesh.updateWorldMatrix(true, true);

    // spring joints
    this.joints = [];
    for (let i = 0; i < 3; i++) {
      const parent = this.meshes[i];
      const mesh = this.meshes[i + 1];
      const child = this.meshes[i + 2];

      const joint = new SpringJoint();
      joint.init({
        restTailLocal: child.position,
        restMatrixLocal: mesh.matrix,
        restParentMatrixWorld: parent.matrixWorld,
      });
      this.joints[i] = joint;
    }
  }

  /**
   * @param {number} deltaTime The time elapsed since the last update, in seconds.
   */
  update(deltaTime) {
    this.updateWorldMatrix(false, false);
    this.meshes[0].updateWorldMatrix(false, false);

    for (let i = 0; i < 3; i++) {
      const parent = this.meshes[i];
      const mesh = this.meshes[i + 1];
      const joint = this.joints[i];

      joint.solve({
        deltaTime,
        parentMatrixWorld: parent.matrixWorld,
      });
      applySpringJoint(joint, mesh);
    }
  }

  /**
   * Sets the given parameters to all spring joints in the group.
   *
   * @param {object} params The parameters to set.
   */
  setParams(params) {
    for (const joint of this.joints) {
      joint.params.restoration = params.restoration;
      joint.params.inertia = params.inertia;
      joint.params.stiffness = params.stiffness;
    }
  }
}
