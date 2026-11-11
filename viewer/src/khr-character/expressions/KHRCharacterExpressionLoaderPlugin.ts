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
    if (!extension) {
      console.warn('KHR_character_expression extension is listed in extensionsUsed but not found in extensions.');
      return null;
    }

    const expressionManager = new KHRCharacterExpressionManager(gltf);

    const names = new Set<string>();
    for (const entry of extension.expressions) {
      if (typeof entry.name !== 'string' || entry.name.length === 0 || names.has(entry.name)) {
        throw new Error('Expression names must be nonempty and unique');
      }
      names.add(entry.name);
    }
    for (const expressionDef of extension.expressions) {
      const clip = gltf.animations[expressionDef.animation];
      if (!clip) {
        console.warn(`Animation with index ${expressionDef.animation} not found for expression "${expressionDef.name}". Skipping this expression.`);
        continue;
      }

      THREE.AnimationUtils.makeClipAdditive(clip);

      const expression = new KHRCharacterExpression(expressionDef.name);
      expression.suppressions = this._importSuppressions(expressionDef, extension.expressions);
      validateKHRCharacterExpressionChannelTargets(expressionDef, json);
      expressionManager.registerExpression(expression);

      expression.action = expressionManager.animationMixer.clipAction(clip);
      expression.action.timeScale = 0;
      expression.action.blendMode = THREE.AdditiveAnimationBlendMode;
      expression.action.play();
    }

    // Validate expression suppressions
    for (const expression of expressionManager.expressions) {
      for (const suppression of expression.suppressions) {
        if (expressionManager.getValue(suppression.target) == null) {
          console.warn(`Expression suppression on "${expression.expressionName}" targets unknown expression "${suppression.target}". Skipping this suppression.`);
        }
      }
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

    const suppressions: KHRCharacterExpressionSuppressionSuppression[] = extension?.suppressions ?? [];
    return suppressions.flatMap((suppression) => {
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
