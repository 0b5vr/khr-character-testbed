import { parseArgs } from '@std/cli';
import { convertVRMToKHRCharacter } from './converter/index.ts';

// == options ======================================================================================
const options = parseArgs(Deno.args, {
  boolean: ['spit-json', 'verbose', 'auto-visibility'],
  string: ['input', 'output'],
  alias: { i: 'input', o: 'output' },
});

const filepath = options.input;
const outpath = options.output;
const spitJson = options['spit-json'];
const verbose = options.verbose;
const autoVisibility = options['auto-visibility'];

if (!filepath || !outpath) {
  console.error(
    'Usage: deno run --allow-read --allow-write main.ts -i <input.glb> -o <output.glb>',
  );
  Deno.exit(1);
}

function logVerbose(...message: string[]): void {
  if (!verbose) return;
  console.log(...message);
}

// == read file ====================================================================================
logVerbose('Reading file:', filepath);

const file = await Deno.readFile(filepath);
const { glb, gltf } = convertVRMToKHRCharacter(file, {
  autoVisibility,
  verboseHandler: logVerbose,
});

logVerbose('Writing file:', outpath);

await Deno.writeFile(outpath, glb);
if (spitJson) {
  logVerbose('Writing JSON part:', outpath + '.json');
  const path = outpath + '.json';
  const gltfToSpit = {
    '$schema':
      'https://raw.githubusercontent.com/KhronosGroup/glTF/refs/heads/main/specification/2.0/schema/glTF.schema.json',
    ...gltf,
  };
  await Deno.writeTextFile(path, JSON.stringify(gltfToSpit, null, 2));
}

logVerbose('Done');
