import type { Expression as VRMExpression } from '@pixiv/types-vrmc-vrm-1.0';
import type { KHRCharacterExpressionMaskMask } from '../../../schematypes/KHRCharacterExpressionMask.ts';
import { logVerbose } from '../logVerbose.ts';

/**
 * Appends expression masks to the extension of a KHR_character_expression expression, based on the override settings in the source VRM expression.
 *
 * @param vrmExpression The source VRM expression object
 * @param extensions The extensions object of a KHR_character_expression expression to append the masks to
 */
export function appendExpressionMasksFromOverride(
  vrmExpression: VRMExpression,
  extensions: Record<string, unknown>,
): void {
  const masks: KHRCharacterExpressionMaskMask[] = [];

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
        `KHR_character_expression_mask: The expression has ${propertyName} == "${value}", masking all ${name} morph targets`,
      );

      for (const target of targets) {
        if (isBinary) {
          masks.push({
            target,
            type: 'block',
            threshold: 0.5,
          });
        } else {
          masks.push({
            target,
            type: value,
          });
        }
      }
    }
  }

  if (masks.length > 0) {
    logVerbose(
      'KHR_character_expression_mask: Appending expression masks for expression with override settings',
    );
    extensions['KHR_character_expression_mask'] = {
      masks,
    };
  }
}
