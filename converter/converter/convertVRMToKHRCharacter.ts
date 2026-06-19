import { appendKHRCharacter } from './appendKHRCharacter.ts';
import { appendKHRCharacterSkeleton } from './appendKHRCharacterSkeleton.ts';
import { appendKHRMeshAnnotation } from './appendKHRMeshAnnotationRenderview.ts';
import { appendKHRNodeCameraHint } from './appendKHRNodeCameraHint.ts';
import { appendKHRVirtualTransforms } from './appendKHRVirtualTransforms.ts';
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

export function convertVRMToKHRCharacter(
  input: Uint8Array,
  options: ConvertVRMToKHRCharacterOptions = {},
): ConvertVRMToKHRCharacterResult {
  const previousVerbose = logVerbose.enabled;
  logVerbose.enabled = options.verbose ?? previousVerbose;

  try {
    logVerbose('Extracting GLB');

    const [gltf, binChunk] = extractGLB(input);
    const binChunkBox: [Uint8Array] = [binChunk];

    ensureSingleRoot(gltf);

    const nodeBoneMap = collectNodeBoneMap(gltf);

    logVerbose('Appending KHR extensions');

    appendKHRXmpJsonLd(gltf);
    appendKHRCharacter(gltf);
    appendKHRCharacterSkeleton(gltf);
    appendKHRCharacterExpression(gltf, binChunkBox, nodeBoneMap);
    appendVRMCCharacterExpressionLookat(gltf, nodeBoneMap);
    appendKHRMeshAnnotation(gltf);
    appendKHRVirtualTransforms(gltf);
    appendKHRNodeCameraHint(gltf, nodeBoneMap);

    logVerbose('Constructing new GLB');

    const glb = constructGLB(gltf, binChunkBox[0]);

    return {
      glb,
      gltf,
      binChunk: binChunkBox[0],
    };
  } finally {
    logVerbose.enabled = previousVerbose;
  }
}
