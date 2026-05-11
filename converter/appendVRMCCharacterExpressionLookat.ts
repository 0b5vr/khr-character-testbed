import { Quaternion } from 'three';
import type { GLTF } from '@gltf-transform/core';
import type { VRMCVRM } from '@pixiv/types-vrmc-vrm-1.0';
import type { Bone } from './Bone.ts';
import { logVerbose } from './logVerbose.ts';
import type { KHRCharacterExpression } from '../schematypes/KHRCharacterExpression.ts';
import type { VRMCCharacterExpressionLookat } from '../schematypes/VRMCCharacterExpressionLookat.ts';
import type { VRMCCharacterExpressionLookatExpressions } from '../schematypes/VRMCCharacterExpressionLookatExpressions.ts';

const QUAT_YP_180DEG = new Quaternion(0, 1, 0, 0);

function appendReferenceNode(
  gltf: GLTF.IGLTF,
  vrm: VRMCVRM,
  nodeBoneMap: Record<number, Bone>,
): number | null {
  const vrmLookAt = vrm.lookAt;
  const offsetFromHeadBone = vrmLookAt?.offsetFromHeadBone as [number, number, number] | undefined;
  if (offsetFromHeadBone == null) {
    logVerbose('VRMC_character_expression_lookat: VRM lookAt offsetFromHeadBone is not found, skipping VRMC_character_expression_lookat');
    return null;
  }

  const vrmHumanoid = vrm.humanoid;
  const headNodeIndex = vrmHumanoid?.humanBones.head?.node;
  if (headNodeIndex == null) {
    console.error(
      `VRMC_character_expression_lookat: The model is invalid; it does not have a head bone.`,
    );
    return null;
  }

  const nodes = gltf.nodes;
  if (nodes == null) {
    console.error('VRMC_character_expression_lookat: The model is invalid; it does not have any nodes.');
    return null;
  }

  const headNode = nodes?.[headNodeIndex];
  if (headNode == null) {
    console.error(
      `VRMC_character_expression_lookat: The model is invalid; head node #${headNodeIndex} is missing.`,
    );
    return null;
  }

  const headBone = nodeBoneMap[headNodeIndex];
  if (headBone == null) {
    throw new Error(
      `VRMC_character_expression_lookat: Unreachable. Missing bone for the node #${headNodeIndex}.`,
    );
  }

  logVerbose('VRMC_character_expression_lookat: VRM lookAt offsetFromHeadBone found, adding VRMC_character_expression_lookat');
  logVerbose(`VRMC_character_expression_lookat: Head node is #${headNodeIndex} ("${headNode.name}")`);
  logVerbose(`VRMC_character_expression_lookat: Offset from head bone: [${offsetFromHeadBone.join(', ')}]`);

  const referenceNodeIndex = nodes.length;
  const referenceNodeName = '__LookAtReferenceNode__';

  logVerbose(`VRMC_character_expression_lookat: Adding a node #${referenceNodeIndex} "${referenceNodeName}" under the head bone #${headNodeIndex}`);

  const referenceNode: GLTF.INode = {
    name: referenceNodeName,
    translation: offsetFromHeadBone,
    rotation: headBone.worldRotation.clone().invert().multiply(QUAT_YP_180DEG).toArray(),
  };
  nodes.push(referenceNode);

  // add the reference node as a child of the head bone
  headNode.children ||= [];
  headNode.children.push(referenceNodeIndex);

  // return the index of the reference node
  return referenceNodeIndex;
}

function collectLookExpressions(
  gltf: GLTF.IGLTF,
): VRMCCharacterExpressionLookatExpressions | null {
  const expressionExtension = gltf.extensions?.['KHR_character_expression'] as KHRCharacterExpression | undefined;
  if (expressionExtension == null) {
    logVerbose(
      `VRMC_character_expression_lookat: KHR_character_expression extension is not found. Aborting`,
    );
    return null;
  }

  const lookatExpressionNames = [
    'lookUp',
    'lookDown',
    'lookLeft',
    'lookRight',
  ] as const;

  const expressions: VRMCCharacterExpressionLookatExpressions = {};

  for (const lookatExpressionName of lookatExpressionNames) {
    const expression = expressionExtension.expressions.find((expression) => expression.expression === lookatExpressionName);
    if (expression != null) {
      logVerbose(
        `VRMC_character_expression_lookat: Found look-at expression "${lookatExpressionName}". Adding it to VRMC_character_expression_lookat`,
      );
      expressions[lookatExpressionName] = lookatExpressionName;
    }
  }

  return expressions;
}

/**
 * Appends VRMC_character_expression_lookat extension to the glTF,
 * converting VRM lookAt definitions into extension-compatible representations.
 *
 * This must be called after {@link appendKHRCharacterExpression} since it uses the expressions defined by KHR_character_expression extension to find look expressions.
 *
 * @param gltf The glTF object to modify
 * @param nodeBoneMap Node index to bone map. Used to find the head bone.
 */
export function appendVRMCCharacterExpressionLookat(
  gltf: GLTF.IGLTF,
  nodeBoneMap: Record<number, Bone>,
): void {
  const vrm = gltf.extensions?.['VRMC_vrm'] as VRMCVRM | undefined;
  if (vrm == null) {
    return;
  }

  const referenceNodeIndex = appendReferenceNode(gltf, vrm, nodeBoneMap);
  if (referenceNodeIndex == null) {
    return;
  }

  gltf.extensionsUsed ||= [];
  gltf.extensionsUsed.push('VRMC_character_expression_lookat');

  const extension: VRMCCharacterExpressionLookat = {
    referenceNode: referenceNodeIndex,
  };
  gltf.extensions ||= {};
  gltf.extensions['VRMC_character_expression_lookat'] = extension;

  const expressions = collectLookExpressions(gltf);
  if (expressions != null) {
    extension.expressions = expressions;
  }
}
