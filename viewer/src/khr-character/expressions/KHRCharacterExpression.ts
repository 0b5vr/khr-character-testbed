import * as THREE from 'three';
import { type KHRCharacterExpressionManager } from './KHRCharacterExpressionManager.ts';
import type { KHRCharacterExpressionMaskMask } from '../../../../schematypes/KHRCharacterExpressionMask.ts';

export type KHRCharacterExpressionMask = KHRCharacterExpressionMaskMask;

/**
 * Represents a character expression.
 *
 * It is intended to be managed and controlled via {@link KHRCharacterExpressionManager}.
 * It extends `Object3D` so that its {@link weight} can be animated via Three.js animation system.
 */
export class KHRCharacterExpression extends THREE.Object3D {
  /**
   * The name of this expression.
   * It is distinguished with {@link name} property of {@link THREE.Object3D}.
   */
  public readonly expressionName: string;

  /**
   * The current weight of this expression.
   * You usually want to set the weight via {@link KHRCharacterExpressionManager.getValue}.
   *
   * It might also be controlled by the Three.js animation system.
   */
  public weight: number;

  /**
   * Masks authored on this expression that reduce target expression influence.
   */
  public masks: KHRCharacterExpressionMask[];

  /**
   * The animation action for this expression.
   * It is controlled by {@link KHRCharacterExpressionManager}.
   */
  public action?: THREE.AnimationAction;

  /**
   * Indicates that this is a KHRCharacterExpression.
   */
  public readonly isKHRCharacterExpression = true;

  constructor(expressionName: string) {
    super();

    this.name = `KHRCharacterExpression_${expressionName}`;
    this.expressionName = expressionName;

    this.weight = 0.0;
    this.masks = [];

    // This is not intended to be visible, we set visible to false for the sake of performance.
    // It omits the calculation of the matrix every frame.
    this.visible = false;
  }
}
