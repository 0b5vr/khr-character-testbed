import * as THREE from 'three';
import type { GLTF, GLTFLoaderPlugin, GLTFParser } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { type GLTF as GLTFSchema } from '@gltf-transform/core';
import { KHRCharacterExpressionManager } from './KHRCharacterExpressionManager';
import { type KHRCharacterExpressionExpression, type KHRCharacterExpression as KHRCharacterExpressionSchema } from '../../../../schematypes/KHRCharacterExpression.ts';
import { type KHRCharacterExpressionSuppression as KHRCharacterExpressionSuppressionSchema, type KHRCharacterExpressionSuppressionSuppression } from '../../../../schematypes/KHRCharacterExpressionSuppression.ts';
import { KHRCharacterExpression, type KHRCharacterExpressionSuppression } from './KHRCharacterExpression';
import { validateKHRCharacterExpressionChannelTargets } from './validateKHRCharacterExpressionChannelTargets.ts';

/**
 * A GLTFLoader plugin for loading `KHR_character_expression` extension.
 *
 * It reads the content of `KHR_character_expression` extension and creates a {@link KHRCharacterExpressionManager}.
 * The created {@link KHRCharacterExpressionManager} is stored in `gltf.userData.khrCharacterExpressionManager` property.
 */
export class KHRCharacterExpressionLoaderPlugin implements GLTFLoaderPlugin {
  public readonly parser: GLTFParser;

  public get name(): string {
    return 'KHRCharacterExpressionLoaderPlugin';
  }

  public constructor(parser: GLTFParser) {
    this.parser = parser;
  }

  public async afterRoot(gltf: GLTF): Promise<void> {
    gltf.userData.khrCharacterExpressionManager = await this._import(gltf);
  }

  public async _import(gltf: GLTF): Promise<KHRCharacterExpressionManager | null> {
    const json = gltf.parser.json as GLTFSchema.IGLTF;

    const isExtensionUsed = json.extensionsUsed?.includes('KHR_character_expression');
    if (!isExtensionUsed) {
      return null;
    }

    const extension = json.extensions?.['KHR_character_expression'] as KHRCharacterExpressionSchema | undefined;
    if (!extension || !Array.isArray(extension.expressions)) {
      console.warn('KHR_character_expression extension is listed in extensionsUsed but not found in extensions.');
      return null;
    }

    const expressionManager = new KHRCharacterExpressionManager(gltf);

    const names = new Map<string, number>();
    for (const entry of extension.expressions) {
      if (typeof entry?.name === 'string') names.set(entry.name, (names.get(entry.name) ?? 0) + 1);
    }
    for (const expressionDef of extension.expressions) {
      if (typeof expressionDef?.name !== 'string' || expressionDef.name.length === 0 || names.get(expressionDef.name) !== 1) {
        console.warn('Expression names must be nonempty and unique. Skipping this expression.');
        continue;
      }
      const validation = validateKHRCharacterExpressionChannelTargets(expressionDef, json);
      if (!validation || validation.hasInvalidChannels) {
        // This legacy clip path cannot safely exclude individual invalid channels.
        continue;
      }
      const clip = gltf.animations[expressionDef.animation];
      if (!clip) {
        console.warn(`Animation with index ${expressionDef.animation} not found for expression "${expressionDef.name}". Skipping this expression.`);
        continue;
      }

      THREE.AnimationUtils.makeClipAdditive(clip);

      const expression = new KHRCharacterExpression(expressionDef.name);
      expression.suppressions = this._importSuppressions(expressionDef, extension.expressions);
      expressionManager.registerExpression(expression);

      expression.action = expressionManager.animationMixer.clipAction(clip);
      expression.action.timeScale = 0;
      expression.action.blendMode = THREE.AdditiveAnimationBlendMode;
      expression.action.play();
    }

    // Validate expression suppressions
    for (const expression of expressionManager.expressions) {
      expression.suppressions = expression.suppressions.filter((suppression) => {
        if (expressionManager.getValue(suppression.target) != null) return true;
        console.warn(`Expression suppression on "${expression.expressionName}" targets unknown expression "${suppression.target}". Skipping this suppression.`);
        return false;
      });
    }

    return expressionManager;
  }

  /**
   * Import expression suppressions from the extension.
   *
   * @param expressionDef - The expression definition from the GLTF schema.
   * @returns The imported suppressions.
   */
  private _importSuppressions(
    expressionDef: KHRCharacterExpressionExpression,
    expressions: KHRCharacterExpressionExpression[],
  ): KHRCharacterExpressionSuppression[] {
    const extension = expressionDef.extensions?.['KHR_character_expression_suppression'] as KHRCharacterExpressionSuppressionSchema | undefined;

    if (extension && (!this.parser.json.extensionsUsed?.includes('KHR_character_expression_suppression') || !Array.isArray(extension.suppressions))) {
      console.warn(`Invalid suppression declaration on "${expressionDef.name}". Ignoring suppressions.`);
      return [];
    }
    const suppressions: KHRCharacterExpressionSuppressionSuppression[] = extension?.suppressions ?? [];
    return suppressions.flatMap((suppression) => {
      if (!suppression || !Number.isInteger(suppression.target) || suppression.target < 0 || [suppression.amount, suppression.threshold].some((v) => v != null && (!Number.isFinite(v) || v < 0 || v > 1))) {
        console.warn(`Invalid suppression on "${expressionDef.name}". Skipping this rule.`);
        return [];
      }
      if (suppression.type != null && suppression.type !== 'blend' && suppression.type !== 'block' && !/^[A-Z0-9]+_[a-z0-9]+(?:_[a-z0-9]+)*$/.test(suppression.type)) {
        console.warn(`Invalid suppression type on "${expressionDef.name}". Skipping this rule.`);
        return [];
      }
      const targetExpression = expressions[suppression.target];
      if (targetExpression == null) {
        console.warn(`Expression suppression on "${expressionDef.name}" targets invalid expression index ${suppression.target}. Skipping this suppression.`);
        return [];
      }


      return [{
        target: targetExpression.name,
        type: suppression.type,
        amount: suppression.amount,
        threshold: suppression.threshold,
      }];
    });
  }
}
