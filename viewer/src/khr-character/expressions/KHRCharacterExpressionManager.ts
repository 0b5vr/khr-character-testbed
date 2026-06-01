import * as THREE from 'three';
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { saturate } from '../../utils/saturate.ts';
import { type KHRCharacterExpression, type KHRCharacterExpressionMask } from './KHRCharacterExpression.ts';

/**
 * Calculate how much a mask attenuates its target expression.
 *
 * A `blend` mask linearly reduces the target as the source expression grows.
 * A `block` mask reduces the target by a fixed amount once the source expression exceeds the threshold.
 *
 * @param mask - The mask definition authored on the source expression.
 * @param sourceWeight - The current input weight of the source expression.
 * @returns A multiplier applied to the target expression weight.
 */
function getMaskMultiplier(mask: KHRCharacterExpressionMask, sourceWeight: number): number {
  const amount = saturate(mask.amount ?? 1.0);

  if (mask.type === 'block') {
    const threshold = saturate(mask.threshold ?? 0.0);
    return sourceWeight > threshold ? 1.0 - amount : 1.0;
  }

  return 1.0 - saturate(sourceWeight * amount);
}

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
    // Gather input weights
    const inputWeights = new Map<string, number>();
    for (const expression of this._expressions) {
      inputWeights.set(expression.expressionName, saturate(expression.weight));
    }

    // Calculate output weights by applying masks
    const outputWeights = new Map(inputWeights);
    for (const sourceExpression of this._expressions) {
      const sourceWeight = inputWeights.get(sourceExpression.expressionName) ?? 0.0;

      for (const mask of sourceExpression.masks) {
        const targetWeight = outputWeights.get(mask.target);
        if (targetWeight == null) {
          continue;
        }

        outputWeights.set(mask.target, targetWeight * getMaskMultiplier(mask, sourceWeight));
      }
    }

    // Apply output weights to animation actions
    for (const expression of this._expressions) {
      if (!expression.action) {
        console.warn(
          `Expression "${expression.expressionName}" does not have an animation action. Skipping update for this expression.`,
        );
        continue;
      }

      expression.action.time = outputWeights.get(expression.expressionName) ?? 0.0;
    }

    // Finally, update the animation mixer to apply the changes
    this.animationMixer.update(delta);
  }
}
