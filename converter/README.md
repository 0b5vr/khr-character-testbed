# converter

This directory contains a converter script that appends the KHR_character extension suite to VRM 1.0 models.

Sanity checks are not enough and it may be specific to certain models, don't expect too much.

## Usage

You will need [Deno](https://deno.land/) to run the script.

```bash
deno run --allow-read --allow-write main.ts -i <input_vrm1_glb> -o <output_khr_character_glb>
```

### Options

- `--input`, `-i` to specify input VRM 1.0 glb file (required).
- `--output`, `-o` to specify output glb file (required).
- `--spit-json` to output JSON separately for inspection.
- `--verbose` to output detailed logs.
