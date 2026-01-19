import { appendKHRCharacter } from './appendKHRCharacter.ts';
import { constructGLB } from './constructGLB.ts';
import { extractGLB } from './extractGLB.ts';
import { appendKHRCharacterExpression } from './appendKHRCharacterExpression.ts';
import { parseArgs } from 'jsr:@std/cli@1.0.24/parse-args';
import { appendKHRCharacterSkeleton } from './appendKHRCharacterSkeleton.ts';
import { logVerbose } from './logVerbose.ts';
import { appendKHRMeshAnnotation } from './appendKHRMeshAnnotationRenderview.ts';
import { appendKHRVirtualTransforms } from './appendKHRVirtualTransforms.ts';
import { collectNodeBoneMap } from './collectNodeBoneMap.ts';
import { appendKHRXmpJsonLd } from './appendKHRXmpJsonLd.ts';
import { ensureSingleRoot } from './ensureSingleRoot.ts';

// == options ======================================================================================
const options = parseArgs(Deno.args, {
  boolean: ['spit-json', 'verbose'],
  string: ['input', 'output'],
  alias: { i: 'input', o: 'output' },
});

const filepath = options.input;
const outpath = options.output;
const spitJson = options['spit-json'];
const verbose = options.verbose;

if (!filepath || !outpath) {
  console.error('Usage: deno run --allow-read --allow-write main.ts -i <input.glb> -o <output.glb>');
  Deno.exit(1);
}

if (verbose) {
  logVerbose.enabled = true;
}

// == read file ====================================================================================
logVerbose('Reading file:', filepath);

const file = await Deno.readFile(filepath);

logVerbose('Extracting GLB');

const [gltf, binChunk] = extractGLB(file);
const binChunkBox: [Uint8Array] = [binChunk];

// == make it a single-root model ==================================================================
ensureSingleRoot(gltf);

// == collect vrm bone map =========================================================================
const nodeBoneMap = collectNodeBoneMap(gltf);

// == append KHR extensions ========================================================================
logVerbose('Appending KHR extensions');

appendKHRXmpJsonLd(gltf);
appendKHRCharacter(gltf);
appendKHRCharacterSkeleton(gltf);
appendKHRCharacterExpression(gltf, binChunkBox, nodeBoneMap);
appendKHRMeshAnnotation(gltf);
appendKHRVirtualTransforms(gltf);

// == reconstruct GLB ==============================================================================
logVerbose('Constructing new GLB');

const newGLB = constructGLB(gltf, binChunkBox[0]);

logVerbose('Writing file:', outpath);

await Deno.writeFile(outpath, newGLB);
if (spitJson) {
  logVerbose('Writing JSON part:', outpath + '.json');
  const path = outpath + '.json';
  const gltfToSpit = {
    '$schema': 'https://raw.githubusercontent.com/KhronosGroup/glTF/refs/heads/main/specification/2.0/schema/glTF.schema.json',
    ...gltf,
  }
  await Deno.writeTextFile(path, JSON.stringify(gltfToSpit, null, 2));
}

logVerbose('Done');
