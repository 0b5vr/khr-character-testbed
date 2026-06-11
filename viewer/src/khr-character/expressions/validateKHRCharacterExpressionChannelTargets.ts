import { type GLTF as GLTFSchema } from '@gltf-transform/core';
import { type KHRCharacterExpressionExpression } from '../../../../schematypes/KHRCharacterExpression.ts';

interface KHRCharacterExpressionChannelExtension {
  channels: number[];
}

/**
 * Get the `KHR_animation_pointer` pointer from an animation channel target.
 *
 * @param target - The animation channel target to inspect.
 * @returns The animation pointer, or `null` when the target does not use `KHR_animation_pointer`.
 */
function getAnimationPointer(target: GLTFSchema.IAnimationChannelTarget): string | null {
  const extension = target.extensions?.['KHR_animation_pointer'] as { pointer?: string } | null;
  if (extension == null) {
    return null;
  }

  const path = target.path as string;
  if (path !== 'pointer') {
    console.warn('KHR_animation_pointer extension is present on an animation channel target but the target path is not "pointer".');
    return null;
  }

  const pointer = extension.pointer;
  if (pointer == null) {
    console.warn('KHR_animation_pointer extension is present on an animation channel target but does not contain a pointer.');
    return null;
  }

  return pointer;
}

/**
 * Check whether an animation channel target affects a node transform used as a joint target.
 *
 * @param target - The animation channel target to inspect.
 * @returns `true` when the target uses either the classic `translation`/`rotation`/`scale` path or a transform animation pointer.
 */
function isJointChannelTarget(target: GLTFSchema.IAnimationChannelTarget): boolean {
  const path = target.path as string;
  const pointer = getAnimationPointer(target);

  // check for the classic node transform
  if (target.node != null && (path === 'translation' || path === 'rotation' || path === 'scale')) {
    return true;
  }

  // check for the animation pointer
  const regexPointer = /^\/nodes\/\d+\/(translation|rotation|scale)$/;
  if (pointer != null && regexPointer.test(pointer)) {
    return true;
  }

  return false;
}

/**
 * Check whether an animation channel target affects morph target weights.
 *
 * @param target - The animation channel target to inspect.
 * @returns `true` when the target uses either the classic `weights` path or a weights animation pointer.
 */
function isMorphtargetChannelTarget(target: GLTFSchema.IAnimationChannelTarget): boolean {
  const path = target.path as string;
  const pointer = getAnimationPointer(target);

  // check for the classic node weights
  if (target.node != null && path === 'weights') {
    return true;
  }

  // check for the animation pointer (array)
  const regexPointerWeights = /^\/nodes\/\d+\/weights$/;
  if (path === 'pointer' && pointer != null && regexPointerWeights.test(pointer)) {
    return true;
  }

  // check for the animation pointer (individual)
  const regexPointerWeight = /^\/nodes\/\d+\/weights\/\d+$/;
  if (path === 'pointer' && pointer != null && regexPointerWeight.test(pointer)) {
    return true;
  }

  return false;
}

/**
 * Check whether an animation channel target affects texture transform values.
 *
 * @param target - The animation channel target to inspect.
 * @returns `true` when the target points to a `KHR_texture_transform` offset, scale, or rotation.
 */
function isTextureChannelTarget(target: GLTFSchema.IAnimationChannelTarget): boolean {
  const path = target.path as string;
  const pointer = getAnimationPointer(target);

  // check for the animation pointer
  const regexPointerOffset = /^\/materials\/\d+\/.+\/extensions\/KHR_texture_transform\/(offset|scale|rotation)$/;
  if (path === 'pointer' && pointer != null && regexPointerOffset.test(pointer)) {
    return true;
  }

  return false;
}

/**
 * Validate that declared KHR_character_expression channel indices point to matching animation targets.
 *
 * This intentionally only emits warnings. Runtime expression application is still driven by the animation clip created by GLTFLoader.
 *
 * @param expressionDef - The expression definition to validate.
 * @param json - The source GLTF JSON containing animation channel targets.
 */
export function validateKHRCharacterExpressionChannelTargets(
  expressionDef: KHRCharacterExpressionExpression,
  json: GLTFSchema.IGLTF,
): void {
  const animation = json.animations?.[expressionDef.animation];
  if (animation == null) {
    console.error(`Unreachable. Expression "${expressionDef.expression}" references missing animation #${expressionDef.animation}. This should have been caught during expression loading.`);
    return;
  }

  const extensionsToValidate = [
    ['joint', 'KHR_character_expression_joint', isJointChannelTarget],
    ['morphtarget', 'KHR_character_expression_morphtarget', isMorphtargetChannelTarget],
    ['texture', 'KHR_character_expression_texture', isTextureChannelTarget],
  ] as const;

  for (const [targetKind, extensionName, isValidTarget] of extensionsToValidate) {
    const extension = expressionDef.extensions?.[extensionName] as KHRCharacterExpressionChannelExtension | undefined;
    if (extension == null) {
      continue;
    }

    const channels = extension.channels;

    for (const channelIndex of channels) {
      const channel = animation.channels[channelIndex];
      if (channel == null) {
        console.warn(`${extensionName} on expression "${expressionDef.expression}" references missing animation channel #${channelIndex}.`);
        continue;
      }

      if (!isValidTarget(channel.target)) {
        const pointer = getAnimationPointer(channel.target);

        if (pointer == null) {
          console.warn(
            `${extensionName} on expression "${expressionDef.expression}" references animation channel #${channelIndex}, but its target path "${channel.target.path}" is not a ${targetKind} target.`,
          );
        } else {
          console.warn(
            `${extensionName} on expression "${expressionDef.expression}" references animation channel #${channelIndex}, but its target path "${channel.target.path}" with pointer "${pointer}" is not a ${targetKind} target.`,
          );
        }
      }
    }
  }
}
