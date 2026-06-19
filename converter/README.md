# converter

This directory contains a converter script that appends the KHR_character
extension suite to VRM 1.0 models.

Sanity checks are not enough and it may be specific to certain models, don't
expect too much.

## Module API

```ts
import { convertVRMToKHRCharacter } from './converter/index.ts';

const input = await file.arrayBuffer();
const { glb, gltf } = convertVRMToKHRCharacter(input);
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
