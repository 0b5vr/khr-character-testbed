import { logVerbose } from '../logVerbose.ts';
import { appendMorphtargetAnimation } from './appendMorphtargetAnimation.ts';
import { appendTextureAnimation } from './appendTextureAnimation.ts';
import { appendBoneLookExpression } from './appendBoneLookExpression.ts';
import {
  VRMLookExpressionName,
  vrmLookExpressionNameSet,
} from './VRMLookExpressionName.ts';
import type { GLTF } from '@gltf-transform/core';
import type {
  Expression as VRMExpression,
  VRMCVRM,
} from '@pixiv/types-vrmc-vrm-1.0';
import type {
  KHRCharacterExpression,
  KHRCharacterExpressionExpression,
} from '../../../schematypes/KHRCharacterExpression.ts';
import type { KHRCharacterExpressionMorphtarget } from '../../../schematypes/KHRCharacterExpressionMorphtarget.ts';
import type {
  KHRCharacterExpressionMapping,
  KHRCharacterExpressionMappingExpressionSetMapping,
} from '../../../schematypes/KHRCharacterExpressionMapping.ts';
import type { Bone } from '../Bone.ts';
import { appendExpressionMasksFromOverride } from './appendExpressionMasksFromOverride.ts';

/**
 * Appends one glTF animation for a single VRM expression.
 *
 * @param name The source VRM expression name
 * @param vrmExpression The source VRM expression object
 * @param gltf The glTF object to modify
 * @param binChunkBox The reference box to the binary chunk
 * @param extensionsUsedSet Extension names used by the generated animation
 * @returns `[animationIndex, morphtargetChannelIndices, textureChannelIndices]`
 */
function appendAnimation(
  name: string,
  vrmExpression: VRMExpression,
  gltf: GLTF.IGLTF,
  binChunkBox: [Uint8Array],
  extensionsUsedSet: Set<string>,
): [
  animationIndex: number | null,
  morphtargetChannelIndices: number[],
  textureChannelIndices: number[],
] {
  const animation: GLTF.IAnimation = {
    name,
    samplers: [],
    channels: [],
  };

  const morphtargetChannelIndices: number[] = [];
  const textureChannelIndices: number[] = [];

  const isBinary = vrmExpression.isBinary ?? false;

  for (const bind of vrmExpression.morphTargetBinds ?? []) {
    logVerbose(
      'KHR_character_expression_morphtarget: Appending an animation channel for morph target bind',
    );
    const [_, i] = appendMorphtargetAnimation(
      bind,
      isBinary,
      gltf,
      binChunkBox,
      animation,
      extensionsUsedSet,
    );
    if (i != null) {
      morphtargetChannelIndices.push(i);
    }
  }

  for (const bind of vrmExpression.textureTransformBinds ?? []) {
    logVerbose(
      'KHR_character_expression_texture: Appending animation channels for texture transform bind',
    );
    const [_, i] = appendTextureAnimation(
      bind,
      isBinary,
      gltf,
      binChunkBox,
      animation,
      extensionsUsedSet,
    );
    textureChannelIndices.push(...i);
  }

  if (
    vrmExpression.materialColorBinds != null &&
    vrmExpression.materialColorBinds.length > 0
  ) {
    console.warn(
      `The expression ${name} contains materialColorBinds, which is not supported in KHR_character_expression. Ignoring the bind.`,
    );
  }

  if (animation.channels.length === 0) {
    return [null, [], []];
  }

  gltf.animations ||= [];
  gltf.animations.push(animation);

  const animationIndex = gltf.animations.length - 1;
  logVerbose(`KHR_character_expression: New animation (#${animationIndex})`);

  return [animationIndex, morphtargetChannelIndices, textureChannelIndices];
}

/**
 * Appends one KHR_character_expression expression entry from a VRM expression.
 *
 * @param name The source VRM expression name
 * @param vrmExpression The source VRM expression object
 * @param gltf The glTF object to modify
 * @param binChunkBox The reference box to the binary chunk
 * @param outExpressions Output expression list to append to
 * @param extensionsUsedSet Extension names used by the generated expression
 * @returns Appended expression index, or `null` if no animation was created
 */
function appendExpression(
  name: string,
  vrmExpression: VRMExpression,
  gltf: GLTF.IGLTF,
  binChunkBox: [Uint8Array],
  outExpressions: KHRCharacterExpressionExpression[],
  extensionsUsedSet: Set<string>,
): number | null {
  const [animationIndex, morphtargetChannelIndices, textureChannelIndices] =
    appendAnimation(
      name,
      vrmExpression,
      gltf,
      binChunkBox,
      extensionsUsedSet,
    );
  if (animationIndex == null) {
    return null;
  }

  const extensions: Record<string, unknown> = {};

  if (morphtargetChannelIndices.length > 0) {
    logVerbose(
      `KHR_character_expression: Morphtarget channels: [${
        morphtargetChannelIndices.join(', ')
      }]`,
    );
    extensions['KHR_character_expression_morphtarget'] = {
      channels: morphtargetChannelIndices,
    } satisfies KHRCharacterExpressionMorphtarget;
    extensionsUsedSet.add('KHR_character_expression_morphtarget');
  }

  if (textureChannelIndices.length > 0) {
    logVerbose(
      `KHR_character_expression: Texture channels: [${
        textureChannelIndices.join(', ')
      }]`,
    );
    extensions['KHR_character_expression_texture'] = {
      channels: textureChannelIndices,
    };
    extensionsUsedSet.add('KHR_character_expression_texture');
  }

  const expression: KHRCharacterExpressionExpression = {
    expression: name,
    animation: animationIndex,
    extensions,
  };
  outExpressions.push(expression);

  return outExpressions.length - 1;
}

/**
 * Appends KHR_character_expression and KHR_character_expression_mapping to glTF,
 * converting VRM expression definitions into extension-compatible expressions.
 *
 * @param gltf The glTF object to modify
 * @param binChunkBox The reference box to the binary chunk
 * @param nodeBoneMap Node index to bone map (used when lookAt type is `bone`)
 */
export function appendKHRCharacterExpression(
  gltf: GLTF.IGLTF,
  binChunkBox: [Uint8Array],
  nodeBoneMap: Record<number, Bone>,
): void {
  const vrm = gltf.extensions?.['VRMC_vrm'] as VRMCVRM | undefined;
  if (vrm == null) {
    return;
  }

  if (vrm.expressions == null) {
    return;
  }

  if (vrm.lookAt?.type == null) {
    logVerbose(
      'KHR_character_expression: VRM lookAt type is not defined, skipping look expressions',
    );
  } else {
    logVerbose(
      `KHR_character_expression: VRM lookAt type is "${vrm.lookAt?.type}"`,
    );
  }

  const expressions: KHRCharacterExpressionExpression[] = [];
  const mappingName = 'vrmExpressionPresets';
  const mapping: KHRCharacterExpressionMappingExpressionSetMapping = {};
  const extensionsUsed = new Set(gltf.extensionsUsed ?? []);

  // preset expressions (except look expressions, which are handled later)
  for (
    const [name, vrmExpression] of Object.entries(vrm.expressions.preset ?? {})
  ) {
    if (vrmLookExpressionNameSet.has(name)) {
      // look expressions are handled later
      continue;
    }

    logVerbose(`KHR_character_expression: Appending expression "${name}"`);
    const expressionIndex = appendExpression(
      name,
      vrmExpression,
      gltf,
      binChunkBox,
      expressions,
      extensionsUsed,
    );
    if (expressionIndex != null) {
      mapping[name] = [{ source: expressionIndex, name, weight: 1 }];
      logVerbose(
        `KHR_character_expression_mapping: "${mappingName}" mapping, "${name}": [{ source: ${expressionIndex}, name: "${name}", weight: 1 }]`,
      );
    }
  }

  // look expressions from lookAt
  if (vrm.lookAt?.type === 'expression') {
    for (const lookName of VRMLookExpressionName) {
      const vrmExpression = vrm.expressions.preset?.[lookName];
      if (vrmExpression == null) {
        continue;
      }

      logVerbose(
        `KHR_character_expression: Appending look expression "${lookName}"`,
      );
      const expressionIndex = appendExpression(
        lookName,
        vrmExpression,
        gltf,
        binChunkBox,
        expressions,
        extensionsUsed,
      );
      if (expressionIndex != null) {
        mapping[lookName] = [{ source: expressionIndex, name: lookName, weight: 1 }];
        logVerbose(
          `KHR_character_expression_mapping: "${mappingName}" mapping, "${lookName}": [{ source: ${expressionIndex}, name: "${lookName}", weight: 1 }]`,
        );
      }
    }
  } else if (vrm.lookAt?.type === 'bone') {
    // create look expressions out of vrm lookAt
    for (const lookName of VRMLookExpressionName) {
      logVerbose(
        `KHR_character_expression: Appending look expression "${lookName}"`,
      );
      const expressionIndex = appendBoneLookExpression(
        lookName,
        vrm.humanoid,
        vrm.lookAt,
        gltf,
        binChunkBox,
        expressions,
        nodeBoneMap,
        extensionsUsed,
      );
      if (expressionIndex != null) {
        mapping[lookName] = [{ source: expressionIndex, name: lookName, weight: 1 }];
        logVerbose(
          `KHR_character_expression_mapping: "${mappingName}" mapping, "${lookName}": [{ source: ${expressionIndex}, name: "${lookName}", weight: 1 }]`,
        );
      }
    }
  }

  // custom expressions
  for (
    const [name, vrmExpression] of Object.entries(vrm.expressions?.custom ?? {})
  ) {
    logVerbose(`KHR_character_expression: Appending expression "${name}"`);
    appendExpression(
      name,
      vrmExpression,
      gltf,
      binChunkBox,
      expressions,
      extensionsUsed,
    );
  }

  if (expressions.length === 0) {
    logVerbose(
      'KHR_character_expression: No animation channels were generated, skipping expression extensions',
    );
    return;
  }

  const expressionNameIndexMap = new Map(
    expressions.map((expression, index) => [expression.expression, index]),
  );
  const vrmExpressionsByName = new Map([
    ...Object.entries(vrm.expressions.preset ?? {}),
    ...Object.entries(vrm.expressions.custom ?? {}),
  ]);
  for (const expression of expressions) {
    const vrmExpression = vrmExpressionsByName.get(expression.expression);
    if (vrmExpression == null) {
      continue;
    }

    expression.extensions ||= {};
    appendExpressionMasksFromOverride(
      vrmExpression,
      expression.extensions,
      extensionsUsed,
      expressionNameIndexMap,
    );
  }

  gltf.extensions ||= {};
  gltf.extensions['KHR_character_expression'] = {
    expressions,
  } satisfies KHRCharacterExpression;
  extensionsUsed.add('KHR_character_expression');

  if (Object.keys(mapping).length > 0) {
    gltf.extensions['KHR_character_expression_mapping'] = {
      expressionSetMappings: {
        [mappingName]: mapping,
      },
    } satisfies KHRCharacterExpressionMapping;
    extensionsUsed.add('KHR_character_expression_mapping');
  }

  gltf.extensionsUsed = [...extensionsUsed];
}
