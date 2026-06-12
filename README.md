# VRM 1.0 to KHR Character Compatibility Testbed

This repository is 0b5vr's testbed for checking compatibility between [VRM 1.0](https://github.com/vrm-c/vrm-specification/tree/master/specification/VRMC_vrm-1.0) models and the ongoing [KHR_character](https://github.com/KhronosGroup/glTF/pull/2512) draft extension for glTF.
This repository aims to support the development of the KHR_character extension by applying it to real-world models and verifying its functionality.

## What it contains

- [converter](./converter): A Deno script that converts VRM 1.0 models to KHR_character glTF files.
- [provisional](./provisional): A collection of provisional documents and prototypes related to the KHR_character extension.
- [schematypes](./schematypes): TypeScript type definitions for the KHR_character extension schema.
- [viewer](./viewer): A Three.js-based web viewer for testing KHR_character models.
    - It contains a sample KHR_character model converted from a VRM 1.0 model: [viewer/src/assets/khr-character-example.glb](./viewer/src/assets/khr-character-example.glb).

## License

[Apache License 2.0](./LICENSE)
