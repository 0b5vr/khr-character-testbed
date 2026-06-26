import { appendKHRCharacter } from './appendKHRCharacter.ts';
import { appendKHRCharacterSkeleton } from './appendKHRCharacterSkeleton.ts';
import { appendKHRNodeCameraHint } from './appendKHRNodeCameraHint.ts';
import { appendKHRXmpJsonLd } from './appendKHRXmpJsonLd.ts';
import { appendVRMCCharacterExpressionLookat } from './appendVRMCCharacterExpressionLookat.ts';
import { collectNodeBoneMap } from './collectNodeBoneMap.ts';
import { constructGLB } from './constructGLB.ts';
import { ensureSingleRoot } from './ensureSingleRoot.ts';
import { appendKHRCharacterExpression } from './expressions/appendKHRCharacterExpression.ts';
import { extractGLB } from './extractGLB.ts';
import { logVerbose } from './logVerbose.ts';
import { type ConvertVRMToKHRCharacterOptions } from './ConvertVRMToKHRCharacterOptions.ts';
import { type ConvertVRMToKHRCharacterResult } from './ConvertVRMToKHRCharacterResult.ts';
import { type GLBInput } from './GLBInput.ts';

function toUint8Array(input: GLBInput): Uint8Array {
  return input instanceof Uint8Array ? input : new Uint8Array(input);
}

export function convertVRMToKHRCharacter(
  input: GLBInput,
  options: ConvertVRMToKHRCharacterOptions = {},
): ConvertVRMToKHRCharacterResult {
  logVerbose.handler = options.verboseHandler;

  logVerbose('Extracting GLB');

  const [gltf, binChunk] = extractGLB(toUint8Array(input));
  const binChunkBox: [Uint8Array] = [binChunk];

  ensureSingleRoot(gltf);

  const nodeBoneMap = collectNodeBoneMap(gltf);

  logVerbose('Appending KHR extensions');

  appendKHRXmpJsonLd(gltf);
  appendKHRCharacter(gltf);
  appendKHRCharacterSkeleton(gltf);
  appendKHRCharacterExpression(gltf, binChunkBox, nodeBoneMap);
  appendVRMCCharacterExpressionLookat(gltf, nodeBoneMap);
  appendKHRNodeCameraHint(gltf, nodeBoneMap);

  logVerbose('Constructing new GLB');

  const glb = constructGLB(gltf, binChunkBox[0]);

  return {
    glb,
    gltf,
    binChunk: binChunkBox[0],
  };
}
