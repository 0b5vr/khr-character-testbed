import * as THREE from 'three';
import type { VRMCCharacterExpressionLookatExpressions } from '../../../../schematypes/VRMCCharacterExpressionLookatExpressions.ts';
import { saturate } from '../../utils/saturate.ts';
import type { KHRCharacterExpressionManager } from '../expressions/KHRCharacterExpressionManager.ts';

const HALF_PI = Math.PI / 2.0;
const ORIGIN_EPSILON_SQUARED = 1e-12;

export interface VRMCCharacterExpressionLookatOptions {
  referenceNode: THREE.Object3D;
  expressions?: VRMCCharacterExpressionLookatExpressions;
}

export class VRMCCharacterExpressionLookat {
  public readonly referenceNode: THREE.Object3D;
  public readonly expressions: VRMCCharacterExpressionLookatExpressions;

  /**
   * World-space target position for look-at evaluation.
   */
  public target: THREE.Vector3 | null;

  private readonly _localTarget = new THREE.Vector3();

  public constructor(options: VRMCCharacterExpressionLookatOptions) {
    this.referenceNode = options.referenceNode;
    this.expressions = options.expressions ?? {};
    this.target = null;
  }

  /**
   * Apply the look-at result to the expression manager.
   * It sets the expression values based on the given yaw and pitch.
   *
   * Call this BEFORE calling {@link KHRCharacterExpressionManager.update}, so that the look-at result can be applied to the expressions in the same frame.
   *
   * @param expressionManager - The expression manager to apply the look-at result to.
   * @param yaw - The yaw angle in radians. Positive value means looking to the right, and negative value means looking to the left.
   * @param pitch - The pitch angle in radians. Positive value means looking up, and negative value means looking down.
   */
  public applyFromYawPitchToExpressionManager(expressionManager: KHRCharacterExpressionManager, yaw: number, pitch: number): void {
    this._setExpressionValue(expressionManager, this.expressions.lookRight, saturate(yaw / HALF_PI));
    this._setExpressionValue(expressionManager, this.expressions.lookLeft, saturate(-yaw / HALF_PI));
    this._setExpressionValue(expressionManager, this.expressions.lookUp, saturate(pitch / HALF_PI));
    this._setExpressionValue(expressionManager, this.expressions.lookDown, saturate(-pitch / HALF_PI));
  }

  /**
   * Apply the look-at result to the expression manager.
   * It calculates the yaw and pitch from the reference node to the {@link target}, and sets the expression values accordingly.
   *
   * Call this BEFORE calling {@link KHRCharacterExpressionManager.update}, so that the look-at result can be applied to the expressions in the same frame.
   *
   * @param expressionManager - The expression manager to apply the look-at result to.
   */
  public applyFromTargetToExpressionManager(expressionManager: KHRCharacterExpressionManager): void {
    if (!this.target) {
      return;
    }

    this.referenceNode.updateWorldMatrix(true, false);
    this._localTarget.copy(this.target);
    this.referenceNode.worldToLocal(this._localTarget);

    let x = this._localTarget.x;
    let y = this._localTarget.y;
    let z = this._localTarget.z;

    if (this._localTarget.lengthSq() <= ORIGIN_EPSILON_SQUARED) {
      x = 0.0;
      y = 0.0;
      z = -1.0;
    }

    const yaw = Math.atan2(x, -z);
    const pitch = Math.atan2(y, Math.sqrt(x * x + z * z));

    this.applyFromYawPitchToExpressionManager(expressionManager, yaw, pitch);
  }

  private _setExpressionValue(expressionManager: KHRCharacterExpressionManager, expressionName: string | undefined, value: number): void {
    if (expressionName == null) {
      return;
    }

    if (expressionManager.getValue(expressionName) == null) {
      console.warn(`VRMCCharacterExpressionLookat: Expression "${expressionName}" is not found in the expression manager. Skipping`);
      return;
    }

    expressionManager.setValue(expressionName, value);
  }
}
