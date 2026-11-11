import type { Expression as VRMExpression } from '@pixiv/types-vrmc-vrm-1.0';
import type { KHRCharacterExpressionSuppressionSuppression } from '../../../schematypes/KHRCharacterExpressionSuppression.ts';
import { logVerbose } from '../logVerbose.ts';

/**
 * Appends expression suppressions to the extension of a KHR_character_expression expression, based on the override settings in the source VRM expression.
 *
 * @param vrmExpression The source VRM expression object
 * @param extensions The extensions object of a KHR_character_expression expression to append the suppressions to
 * @param extensionsUsedSet Extension names used by the generated expression
 * @param expressionNameIndexMap Expression indices keyed by expression name
 */
export function appendExpressionSuppressionsFromOverride(
  vrmExpression: VRMExpression,
  extensions: Record<string, unknown>,
  extensionsUsedSet: Set<string>,
  expressionNameIndexMap: ReadonlyMap<string, number>,
): void {
  const suppressions: KHRCharacterExpressionSuppressionSuppression[] = [];

  const isBinary = vrmExpression.isBinary ?? false;

  const overrideCategories = [
    {
      name: 'blink',
      propertyName: 'overrideBlink' as const,
      targets: ['blink', 'blinkLeft', 'blinkRight'] as const,
    },
    {
      name: 'lookAt',
      propertyName: 'overrideLookAt' as const,
      targets: ['lookUp', 'lookDown', 'lookLeft', 'lookRight'] as const,
    },
    {
      name: 'mouth',
      propertyName: 'overrideMouth' as const,
      targets: ['aa', 'ih', 'ou', 'ee', 'oh'] as const,
    },
  ];

  for (const { name, propertyName, targets } of overrideCategories) {
    const value = vrmExpression[propertyName];
    if (value != null && value !== 'none') {
      logVerbose(
        `KHR_character_expression_suppression: The expression has ${propertyName} == "${value}", suppressing all ${name} morph targets`,
      );

      for (const target of targets) {
        const targetIndex = expressionNameIndexMap.get(target);
        if (targetIndex == null) {
          continue;
        }

        if (isBinary) {
          suppressions.push({
            target: targetIndex,
            name: target,
            type: 'block',
            threshold: 0.5,
          });
        } else {
          suppressions.push({
            target: targetIndex,
            name: target,
            type: value,
          });
        }
      }
    }
  }

  if (suppressions.length > 0) {
    logVerbose(
      'KHR_character_expression_suppression: Appending expression suppressions for expression with override settings',
    );
    extensions['KHR_character_expression_suppression'] = {
      suppressions,
    };
    extensionsUsedSet.add('KHR_character_expression_suppression');
  }
}
