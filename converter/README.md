# converter

This directory contains a converter script that appends the KHR_character
extension suite to VRM 1.0 models.

Sanity checks are not enough and it may be specific to certain models, don't
expect too much.

## Module API

```ts
import { convertVRMToKHRCharacter } from './converter/index.ts';

const input = await file.arrayBuffer();
const { glb, gltf } = convertVRMToKHRCharacter(input, {
  autoVisibility: true,
});
```

The module API only depends on standard JavaScript binary APIs for input and
output, so it can be used from browser build tools as well as Deno. It accepts
`ArrayBuffer` or `Uint8Array` and returns the converted GLB as `Uint8Array`.

## Web UI

```bash
npm install
npm run dev
```

Open the local Vite URL and convert a VRM 1.0 GLB from the browser.

## Usage - Deno

You will need [Deno](https://deno.land/) to run the script.

```bash
deno run --allow-read --allow-write main.ts -i <input_vrm1_glb> -o <output_khr_character_glb>
```

### Options

- `--input`, `-i` to specify input VRM 1.0 glb file (required).
- `--output`, `-o` to specify output glb file (required).
- `--spit-json` to output JSON separately for inspection.
- `--verbose` to output detailed logs.
- `--auto-visibility` to set mesh nodes named `Face` or `Hair` to `KHR_node_visibility_hint` with `roles: ["third_person"]`.

## Development checks

With Node.js 24 or newer, run from this directory:

```bash
npm ci --ignore-scripts
node test/november-draft.test.ts
npm run build
```

To rebuild the bundled viewer sample from its retained VRM payload, run from the
repository root after installing the converter dependencies:

```bash
node scripts/regenerate-sample.ts
python3 scripts/validate-sample.py
```

The schema check requires Python's `jsonschema` and `referencing` packages and the
initialized specification submodule (`git submodule update --init`). The rebuild
script is specific to the bundled sample and refuses unexpected source animations
or layouts where generated accessor/buffer-view data cannot safely be removed.
It overwrites the sample in place; repeated runs produce the same GLB.
