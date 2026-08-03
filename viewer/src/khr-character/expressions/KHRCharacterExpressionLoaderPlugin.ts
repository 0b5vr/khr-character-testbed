import * as THREE from 'three';
import type { GLTF, GLTFLoaderPlugin, GLTFParser } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { type GLTF as GLTFSchema } from '@gltf-transform/core';
import { KHRCharacterExpressionManager } from './KHRCharacterExpressionManager';
import { type KHRCharacterExpressionExpression, type KHRCharacterExpression as KHRCharacterExpressionSchema } from '../../../../schematypes/KHRCharacterExpression.ts';
import { type KHRCharacterExpressionMask as KHRCharacterExpressionMaskSchema, type KHRCharacterExpressionMaskMask } from '../../../../schematypes/KHRCharacterExpressionMask.ts';
import { KHRCharacterExpression, type KHRCharacterExpressionMask } from './KHRCharacterExpression';
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

    for (const expressionDef of extension.expressions) {
      const clip = gltf.animations[expressionDef.animation];
      if (!clip) {
        console.warn(`Animation with index ${expressionDef.animation} not found for expression "${expressionDef.expression}". Skipping this expression.`);
        continue;
      }

      THREE.AnimationUtils.makeClipAdditive(clip);

      const expression = new KHRCharacterExpression(expressionDef.expression);
      expression.masks = this._importMasks(expressionDef, extension.expressions);
      validateKHRCharacterExpressionChannelTargets(expressionDef, json);
      expressionManager.registerExpression(expression);

      expression.action = expressionManager.animationMixer.clipAction(clip);
      expression.action.timeScale = 0;
      expression.action.blendMode = THREE.AdditiveAnimationBlendMode;
      expression.action.play();
    }

    // Validate expression masks
    for (const expression of expressionManager.expressions) {
      for (const mask of expression.masks) {
        if (expressionManager.getValue(mask.target) == null) {
          console.warn(`Expression mask on "${expression.expressionName}" targets unknown expression "${mask.target}". Skipping this mask.`);
        }
      }
    }

    return expressionManager;
  }

  /**
   * Import expression masks from the extension.
   *
   * @param expressionDef - The expression definition from the GLTF schema.
   * @returns The imported masks.
   */
  private _importMasks(
    expressionDef: KHRCharacterExpressionExpression,
    expressions: KHRCharacterExpressionExpression[],
  ): KHRCharacterExpressionMask[] {
    const extension = expressionDef.extensions?.['KHR_character_expression_mask'] as KHRCharacterExpressionMaskSchema | undefined;

    const masks: KHRCharacterExpressionMaskMask[] = extension?.masks ?? [];
    return masks.flatMap((mask) => {
      const targetExpression = expressions[mask.target];
      if (targetExpression == null) {
        console.warn(`Expression mask on "${expressionDef.expression}" targets invalid expression index ${mask.target}. Skipping this mask.`);
        return [];
      }
      if (mask.name != null && mask.name !== targetExpression.expression) {
        console.warn(`Expression mask on "${expressionDef.expression}" names "${mask.name}", but target index ${mask.target} is "${targetExpression.expression}". Skipping this mask.`);
        return [];
      }

      return [{
        target: targetExpression.expression,
        type: mask.type,
        amount: mask.amount,
        threshold: mask.threshold,
      }];
    });
  }
}
