import * as THREE from 'three';
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { applyExpressionResponses } from './expressionResponse.ts';
import { saturate } from '../../utils/saturate.ts';
import { type KHRCharacterExpression, type KHRCharacterExpressionSuppression } from './KHRCharacterExpression.ts';

/** Attenuation is summed from one immutable driver snapshot. */
export function getSuppressionAttenuation(rule: KHRCharacterExpressionSuppression, source: number): number {
  const amount = saturate(rule.amount ?? 1);
  if (rule.type === 'block') return source > (rule.threshold ?? 0) ? amount : 0;
  if (rule.type != null && rule.type !== 'blend') return 0;
  return amount * source;
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

    if (!Number.isFinite(weight)) throw new Error('Expression drivers must be finite');
    expression.weight = saturate(weight);
  }

  /**
   * Update and apply the expressions. This should be called in the animation loop.
   *
   * @param delta - The delta time. Usually taken from `THREE.Timer`.
   */
  public update(delta: number): void {
    const inputWeights = new Map<string, number>();
    for (const expression of this._expressions) {
      if (!Number.isFinite(expression.weight)) throw new Error('Expression drivers must be finite');
      inputWeights.set(expression.expressionName, saturate(expression.weight));
    }
    const attenuation = new Map<string, number>();
    for (const expression of this._expressions) {
      for (const rule of expression.suppressions) {
        attenuation.set(rule.target, (attenuation.get(rule.target) ?? 0)
          + getSuppressionAttenuation(rule, inputWeights.get(expression.expressionName) ?? 0));
      }
    }
    applyExpressionResponses([...this._expressions].map((expression) => ({
      responses: expression.responses,
      time: (inputWeights.get(expression.expressionName) ?? 0)
        * (1 - saturate(attenuation.get(expression.expressionName) ?? 0)) * expression.duration,
      active: (inputWeights.get(expression.expressionName) ?? 0)
        * (1 - saturate(attenuation.get(expression.expressionName) ?? 0)) > 0,
    })));
    // Retained for callers using the public mixer; response evaluation itself is stateless.
    this.animationMixer.update(delta);
  }
}
