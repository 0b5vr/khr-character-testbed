# converter

This directory contains a converter script that appends the KHR_character extension suite to VRM 1.0 models.

Sanity checks are not enough and it may be specific to certain models, don't expect too much.

## Usage

```bash
deno run --allow-read --allow-write main.ts -i <input_vrm1_glb> -o <output_khr_character_glb>
```
