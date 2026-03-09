import { appendAnimationAccessors } from './appendAnimationAccessors.ts';
import { logVerbose } from '../logVerbose.ts';
import { appendMorphtargetAnimation } from './appendMorphtargetAnimation.ts';
import { appendTextureAnimation } from './appendTextureAnimation.ts';
// @ts-types="npm:@types/three@0.181.0"
import { Quaternion } from 'npm:three@0.181.2';
import type { GLTF } from 'npm:@gltf-transform/core@4.2.1';
import type { LookAtRangeMap, VRMCVRM, Expression as VRMExpression, Humanoid as VRMHumanoid, LookAt as VRMLookAt } from 'npm:@pixiv/types-vrmc-vrm-1.0@3.4.4';
import type { KHRCharacterExpression, KHRCharacterExpressionExpression } from '../../schematypes/KHRCharacterExpression.ts';
import type { KHRCharacterExpressionMorphtarget } from '../../schematypes/KHRCharacterExpressionMorphtarget.ts';
import type { KHRCharacterExpressionMapping, KHRCharacterExpressionMappingExpressionSetMapping } from '../../schematypes/KHRCharacterExpressionMapping.ts';
import type { Bone } from '../Bone.ts';

/** Identity quaternion Do not mutate */
const QUAT_IDENTITY = new Quaternion(0, 0, 0, 1);

/** Quaternion for temporary calculations */
const _quatA = new Quaternion();
const _quatB = new Quaternion();

export const VRMLookExpressionName = {
  LookUp: 'lookUp',
  LookDown: 'lookDown',
  LookLeft: 'lookLeft',
  LookRight: 'lookRight',
} as const;

export type VRMLookExpressionName =
  (typeof VRMLookExpressionName)[keyof typeof VRMLookExpressionName];

const vrmLookExpressionNames: Set<VRMLookExpressionName> = new Set(Object.values(VRMLookExpressionName));
function appendAnimation(
  name: string,
  vrmExpression: VRMExpression,
  gltf: GLTF.IGLTF,
  binChunkBox: [Uint8Array],
): [animationIndex: number | null, morphtargetChannelIndices: number[], textureChannelIndices: number[]] {
  const animation: GLTF.IAnimation = {
    name,
    samplers: [],
    channels: [],
  };

  const morphtargetChannelIndices: number[] = [];
  const textureChannelIndices: number[] = [];

  const isBinary = vrmExpression.isBinary ?? false;

  for (const bind of vrmExpression.morphTargetBinds ?? []) {
    logVerbose('KHR_character_expression_morphtarget: Appending an animation channel for morph target bind');
    const [_, i] = appendMorphtargetAnimation(bind, isBinary, gltf, binChunkBox, animation);
    if (i != null) {
      morphtargetChannelIndices.push(i);
    }
  }

  for (const bind of vrmExpression.textureTransformBinds ?? []) {
    logVerbose('KHR_character_expression_texture: Appending animation channels for texture transform bind');
    const [_, i] = appendTextureAnimation(bind, isBinary, gltf, binChunkBox, animation);
    textureChannelIndices.push(...i);
  }

  if (vrmExpression.materialColorBinds != null && vrmExpression.materialColorBinds.length > 0) {
    console.warn(`The expression ${name} contains materialColorBinds, which is not supported in KHR_character_expression. Ignoring the bind.`);
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

function appendBoneRotationAccessors(
  bone: Bone,
  vrmLookAt: VRMLookAt,
  name: VRMLookExpressionName,
  isLeft: boolean,
  gltf: GLTF.IGLTF,
  binChunkBox: [Uint8Array],
): [input: number, output: number] | null {
  let rangeMap: LookAtRangeMap | undefined;

  if (name === 'lookUp') {
    rangeMap = vrmLookAt.rangeMapVerticalUp;
    _quatA.set(-0.7071, 0, 0, 0.7071); // 90 degrees up
  } else if (name === 'lookDown') {
    rangeMap = vrmLookAt.rangeMapVerticalDown;
    _quatA.set(0.7071, 0, 0, 0.7071); // 90 degrees down
  } else if (name === 'lookLeft') {
    rangeMap = isLeft ? vrmLookAt.rangeMapHorizontalOuter : vrmLookAt.rangeMapHorizontalInner;
    _quatA.set(0, 0.7071, 0, 0.7071); // 90 degrees left
  } else if (name === 'lookRight') {
    rangeMap = isLeft ? vrmLookAt.rangeMapHorizontalInner : vrmLookAt.rangeMapHorizontalOuter;
    _quatA.set(0, -0.7071, 0, 0.7071); // 90 degrees right
  } else {
    throw new Error(`Unreachable. Unknown look expression name: ${name}`);
  }

  if (rangeMap == null || rangeMap.inputMaxValue == null || rangeMap.outputScale == null || rangeMap.outputScale === 0) {
    return null;
  }

  _quatB.copy(bone.worldRotation).invert();
  _quatA.slerp(QUAT_IDENTITY, 1 - rangeMap.outputScale / 90.0)
    .multiply(bone.worldRotation)
    .premultiply(_quatB)
    .premultiply(bone.rotation);

  const t = Math.max(rangeMap.inputMaxValue / 90.0, 1E-6);
  const input = t === 1
    ? new Float32Array([0, 1])
    : new Float32Array([0, t, 1]);
  const output = new Float32Array([
    bone.rotation.x, bone.rotation.y, bone.rotation.z, bone.rotation.w,
    _quatA.x, _quatA.y, _quatA.z, _quatA.w,
    ...t === 1 ? [] : [_quatA.x, _quatA.y, _quatA.z, _quatA.w],
  ]);

  return appendAnimationAccessors(
    input,
    output,
    'VEC4',
    gltf,
    binChunkBox,
  );
}

/**
 * Create look at animation using bones, append it to gltf.animations, and return the animation index.
 * When this function is called, it assume that vrmLookAt is using "bone" type.
 */
function appendBoneLookAnimation(
  name: VRMLookExpressionName,
  vrmHumanoid: VRMHumanoid,
  vrmLookAt: VRMLookAt,
  gltf: GLTF.IGLTF,
  binChunkBox: [Uint8Array],
  nodeBoneMap: Record<number, Bone>,
): [number | null, channelIndices: number[]] {
  const animation: GLTF.IAnimation = {
    name,
    samplers: [],
    channels: [],
  };

  const channelIndices: number[] = [];

  for (const isLeft of [false, true]) {
    const vrmBoneName = isLeft ? 'leftEye' : 'rightEye';
    const nodeIndex = vrmHumanoid.humanBones[vrmBoneName]?.node;
    if (nodeIndex != null) {
      const bone = nodeBoneMap[nodeIndex]!;

      const inputIndexAndOutputIndex = appendBoneRotationAccessors(
        bone,
        vrmLookAt,
        name,
        isLeft,
        gltf,
        binChunkBox,
      );
      if (inputIndexAndOutputIndex == null) {
        continue;
      }

      const [inputIndex, outputIndex] = inputIndexAndOutputIndex;
      logVerbose(`KHR_character_expression_joint: New accessors (#${inputIndex}, #${outputIndex})`);

      const samplerIndex = animation.samplers.length;
      animation.samplers.push({
        input: inputIndex,
        interpolation: 'LINEAR',
        output: outputIndex,
      });

      const channelIndex = animation.channels.length;
      animation.channels.push({
        sampler: samplerIndex,
        target: {
          node: nodeIndex,
          path: 'rotation',
        },
      });
      logVerbose(`KHR_character_expression_joint: New animation channel, rotation for node #${nodeIndex}`);
      channelIndices.push(channelIndex);
    }
  }

  gltf.animations ||= [];
  gltf.animations.push(animation);

  const animationIndex = gltf.animations.length - 1;
  logVerbose(`KHR_character_expression_joint: New animation (#${animationIndex})`);

  return [animationIndex, channelIndices];
}

function appendExpression(
  name: string,
  vrmExpression: VRMExpression,
  gltf: GLTF.IGLTF,
  binChunkBox: [Uint8Array],
  outExpressions: KHRCharacterExpressionExpression[],
): number | null {
  const [animationIndex, morphtargetChannelIndices, textureChannelIndices] = appendAnimation(name, vrmExpression, gltf, binChunkBox);
  if (animationIndex == null) {
    return null;
  }

  const extensions: Record<string, unknown> = {};

  if (morphtargetChannelIndices.length > 0) {
    logVerbose(`KHR_character_expression: Morphtarget channels: [${morphtargetChannelIndices.join(', ')}]`);
    extensions['KHR_character_expression_morphtarget'] = {
      channels: morphtargetChannelIndices,
    } satisfies KHRCharacterExpressionMorphtarget;
  }

  if (textureChannelIndices.length > 0) {
    logVerbose(`KHR_character_expression: Texture channels: [${textureChannelIndices.join(', ')}]`);
    extensions['KHR_character_expression_texture'] = {
      channels: textureChannelIndices,
    };
  }

  const expression: KHRCharacterExpressionExpression = {
    expression: name,
    animation: animationIndex,
    extensions,
  };
  outExpressions.push(expression);

  return outExpressions.length - 1;
}

function appendBoneLookExpression(
  name: VRMLookExpressionName,
  vrmHumanoid: VRMHumanoid,
  vrmLookAt: VRMLookAt,
  gltf: GLTF.IGLTF,
  binChunkBox: [Uint8Array],
  outExpressions: KHRCharacterExpressionExpression[],
  nodeBoneMap: Record<number, Bone>,
): number | null {
  const [animationIndex, channelIndices] = appendBoneLookAnimation(name, vrmHumanoid, vrmLookAt, gltf, binChunkBox, nodeBoneMap);
  if (animationIndex == null) {
    return null;
  }

  const expression: KHRCharacterExpressionExpression = {
    expression: name,
    animation: animationIndex,
    extensions: {
      'KHR_character_expression_joint': {
        channels: channelIndices,
      },
    },
  };
  outExpressions.push(expression);

  return outExpressions.length - 1;
}

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
    logVerbose('KHR_character_expression: VRM lookAt type is not defined, skipping look expressions');
  } else {
    logVerbose(`KHR_character_expression: VRM lookAt type is "${vrm.lookAt?.type}"`);
  }

  const expressions: KHRCharacterExpressionExpression[] = [];
  const mappingName = 'vrmExpressionPresets';
  const mapping: KHRCharacterExpressionMappingExpressionSetMapping = {};

  for (const [name, vrmExpression] of Object.entries(vrm.expressions.preset ?? {})) {
    if (vrmLookExpressionNames.has(name as any)) {
      // look expressions are handled later
      continue;
    }

    logVerbose(`KHR_character_expression: Appending expression "${name}"`);
    appendExpression(name, vrmExpression, gltf, binChunkBox, expressions);
    mapping[name] = [{ source: name, weight: 1 }];
    logVerbose(`KHR_character_expression_mapping: "${mappingName}" mapping, "${name}": [{ source: "${name}", weight: 1 }]`);
  }

  if (vrm.lookAt?.type === 'expression') {
    for (const lookName of vrmLookExpressionNames) {
      const vrmExpression = vrm.expressions.preset?.[lookName];
      if (vrmExpression == null) {
        continue;
      }

      logVerbose(`KHR_character_expression: Appending look expression "${lookName}"`);
      appendExpression(lookName, vrmExpression, gltf, binChunkBox, expressions);

      mapping[lookName] = [{ source: lookName, weight: 1 }];
      logVerbose(`KHR_character_expression_mapping: "${mappingName}" mapping, "${lookName}": [{ source: "${lookName}", weight: 1 }]`);
    }
  } else if (vrm.lookAt?.type === 'bone') {
    // create look expressions out of vrm lookAt
    for (const lookName of vrmLookExpressionNames) {
      logVerbose(`KHR_character_expression: Appending look expression "${lookName}"`);
      appendBoneLookExpression(lookName, vrm.humanoid, vrm.lookAt, gltf, binChunkBox, expressions, nodeBoneMap);

      mapping[lookName] = [{ source: lookName, weight: 1 }];
      logVerbose(`KHR_character_expression_mapping: "${mappingName}" mapping, "${lookName}": [{ source: "${lookName}", weight: 1 }]`);
    }
  }

  for (const [name, vrmExpression] of Object.entries(vrm.expressions?.custom ?? {})) {
    logVerbose(`KHR_character_expression: Appending expression "${name}"`);
    appendExpression(name, vrmExpression, gltf, binChunkBox, expressions);
  }

  gltf.extensionsUsed ||= [];
  gltf.extensionsUsed.push('KHR_character_expression');
  gltf.extensionsUsed.push('KHR_character_expression_mapping');
  // TODO: conditionally add 'KHR_character_expression_morphtarget' and 'KHR_character_expression_texture' and 'KHR_character_expression_joint'

  gltf.extensions ||= {};
  gltf.extensions['KHR_character_expression'] = {
    expressions,
  } satisfies KHRCharacterExpression;
  gltf.extensions['KHR_character_expression_mapping'] = {
    expressionSetMappings: {
      [mappingName]: mapping,
    },
  } satisfies KHRCharacterExpressionMapping;
}
