import * as THREE from 'three';
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { saturate } from '../../utils/saturate.ts';
import { type KHRCharacterExpression } from './KHRCharacterExpression.ts';

/**
 * Manages character expressions for a GLTF model.
 */
export class KHRCharacterExpressionManager {
  /**
   * The animation mixer for the character.
   */
  public readonly animationMixer: THREE.AnimationMixer;

  /**
   * The list of expressions.
   * Intended to be modified only by {@link registerExpression} and {@link unregisterExpression} methods.
   */
  private _expressions: Set<KHRCharacterExpression>;

  /**
   * The list of expressions.
   * Intended to be modified only by {@link registerExpression} and {@link unregisterExpression} methods.
   */
  public get expressions(): Set<KHRCharacterExpression> {
    return new Set(this._expressions);
  }

  /**
   * A map from expression name to expression.
   * Intended to be modified only by {@link registerExpression} and {@link unregisterExpression} methods.
   */
  private _expressionMap: Map<string, KHRCharacterExpression>;

  /**
   * A map from expression name to expression.
   * Intended to be modified only by {@link registerExpression} and {@link unregisterExpression} methods.
   */
  public get expressionMap(): Map<string, KHRCharacterExpression> {
    return new Map(this._expressionMap);
  }

  /**
   * @param gltf - The GLTF object taken from the GLTFLoader.
   */
  constructor(gltf: GLTF) {
    this.animationMixer = new THREE.AnimationMixer(gltf.scene);

    this._expressions = new Set();
    this._expressionMap = new Map();
  }

  /**
   * Register an expression.
   *
   * @param expression - The expression to register.
   */
  public registerExpression(expression: KHRCharacterExpression): void {
    if (this._expressionMap.has(expression.expressionName)) {
      console.warn(
        `Expression with name "${expression.expressionName}" is already registered. Skipping registration.`,
      );
      return;
    }

    this._expressions.add(expression);
    this._expressionMap.set(expression.expressionName, expression);
  }

  /**
   * Unregister an expression.
   *
   * @param expression - The expression to unregister.
   */
  public unregisterExpression(expression: KHRCharacterExpression): void {
    if (!this._expressionMap.has(expression.expressionName)) {
      console.warn(
        `Expression with name "${expression.expressionName}" is not registered. Skipping unregistration.`,
      );
      return;
    }

    this._expressions.delete(expression);
    this._expressionMap.delete(expression.expressionName);
  }

  /**
   * Get the current weight of the specified expression.
   *
   * @param expressionName - The name of the expression.
   * @returns The current weight of the expression. Returns `null` if the expression is not registered.
   */
  public getValue(expressionName: string): number | null {
    const expression = this._expressionMap.get(expressionName);
    return expression?.weight ?? null;
  }

  /**
   * Set the weight of the specified expression.
   *
   * @param expressionName - The name of the expression.
   * @param weight - The weight to set. It will be clamped to the range [0, 1].
   */
  public setValue(expressionName: string, weight: number): void {
    const expression = this._expressionMap.get(expressionName);
    if (!expression) {
      console.warn(
        `Expression with name "${expressionName}" is not registered. Cannot set value.`,
      );
      return;
    }

    expression.weight = saturate(weight);
  }

  /**
   * Update and apply the expressions. This should be called in the animation loop.
   *
   * @param delta - The delta time. Usually taken from `THREE.Timer`.
   */
  public update(delta: number): void {
    for (const expression of this._expressions) {
      if (!expression.action) {
        console.warn(
          `Expression "${expression.expressionName}" does not have an animation action. Skipping update for this expression.`,
        );
        continue;
      }

      expression.action.time = expression.weight;
    }

    this.animationMixer.update(delta);
  }
}
