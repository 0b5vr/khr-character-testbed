import { Matrix4, Vector3 } from 'three';

/**
 * Calculates the alpha of the exponential smoothing function for the restoration force.
 *
 * @param {number} alpha60 The alpha value at 60 FPS (i.e., when deltaTime is 1/60).
 * @param {number} deltaTime The time elapsed since the last frame, in seconds.
 * @returns {number} The alpha value for the given deltaTime.
 */
function calcAlpha(alpha60, deltaTime) {
  const lambda = -60.0 * Math.log(1.0 - alpha60);
  return 1.0 - Math.exp(-lambda * deltaTime);
}

/**
 * Represents a spring joint used in spring bone system.
 *
 * This class should not depend on Three.js other than primitive math classes.
 */
export class SpringJoint {
  /**
   * Parameters for the behavior of the spring joint.
   */
  params = {
    restoration: 0.1,
    inertia: 0.5,
    stiffness: 0.0,
  };

  /** The local position of the tail in the rest pose. */
  restTailLocal = new Vector3();

  /** The local matrix of the joint in the rest pose. */
  restMatrixLocal = new Matrix4();

  /**
   * The previous world position of the joint.
   * Used for calculating the stiffness force based on the movement of the joint.
   */
  prevJointPositionWorld = new Vector3();

  /** The previous world position of the tail. */
  prevTailWorld = new Vector3();

  /** The current world position of the tail. */
  currentTailWorld = new Vector3();

  /**
   * Initializes the spring joint with the given parameters.
   *
   * @param {object} options
   * @param {Vector3} options.restTailLocal The local position of the tail in the rest pose.
   * @param {Matrix4} options.restMatrixLocal The local matrix of the joint in the rest pose.
   * @param {Matrix4} options.restParentMatrixWorld The world matrix of the parent joint in the rest pose.
   */
  init({ restTailLocal, restMatrixLocal, restParentMatrixWorld }) {
    this.restTailLocal.copy(restTailLocal);
    this.restMatrixLocal.copy(restMatrixLocal);

    const restMatrixWorld = restParentMatrixWorld.clone().multiply(this.restMatrixLocal);
    const restTailWorld = this.restTailLocal.clone().applyMatrix4(restMatrixWorld);
    this.prevTailWorld.copy(restTailWorld);
    this.currentTailWorld.copy(restTailWorld);

    this.prevJointPositionWorld.set(
      restMatrixWorld.elements[12],
      restMatrixWorld.elements[13],
      restMatrixWorld.elements[14],
    );
  }

  /**
   * Solves the spring joint for the current frame.
   *
   * @param {object} options
   * @param {Matrix4} options.parentMatrixWorld The world matrix of the parent joint.
   * @param {number} options.deltaTime The time elapsed since the last frame, in seconds.
   */
  solve({ parentMatrixWorld, deltaTime }) {
    const restMatrixWorld = parentMatrixWorld.clone().multiply(this.restMatrixLocal);
    const restMatrixWorldInv = restMatrixWorld.clone().invert();
    const currentJointPositionWorld = new Vector3(
      restMatrixWorld.elements[12],
      restMatrixWorld.elements[13],
      restMatrixWorld.elements[14],
    );
    const restTailWorld = this.restTailLocal.clone().applyMatrix4(restMatrixWorld);
    const tailLength = restTailWorld.clone().sub(currentJointPositionWorld).length();

    const nextTailWorld = this.currentTailWorld.clone();

    // inertia
    const inertiaVector = this.currentTailWorld.clone().sub(this.prevTailWorld).multiplyScalar(this.params.inertia);
    nextTailWorld.add(inertiaVector);

    // restoration
    const alphaRestoration = calcAlpha(this.params.restoration, deltaTime);
    const restorationVector = restTailWorld.sub(nextTailWorld).multiplyScalar(alphaRestoration);
    nextTailWorld.add(restorationVector);

    // stiffness
    const stiffnessTargetPos = this.currentTailWorld.clone().sub(this.prevJointPositionWorld).add(currentJointPositionWorld);
    const stiffnessVector = stiffnessTargetPos.clone().sub(nextTailWorld).multiplyScalar(this.params.stiffness);
    nextTailWorld.add(stiffnessVector);

    // normalize
    const nextTailLocal = nextTailWorld.clone().applyMatrix4(restMatrixWorldInv);
    nextTailLocal.normalize().multiplyScalar(tailLength);
    nextTailWorld.copy(nextTailLocal).applyMatrix4(restMatrixWorld);

    // assign
    this.prevTailWorld.copy(this.currentTailWorld);
    this.currentTailWorld.copy(nextTailWorld);

    // store the current joint position for the next frame
    this.prevJointPositionWorld.copy(currentJointPositionWorld);
  }
}
