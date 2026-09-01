# VRM 1.0 to KHR Character Compatibility Testbed

This repository is 0b5vr's testbed for checking compatibility between [VRM 1.0](https://github.com/vrm-c/vrm-specification/tree/master/specification/VRMC_vrm-1.0) models and the ongoing [KHR_character](https://github.com/KhronosGroup/glTF/pull/2512) draft extension for glTF.
This repository aims to support the development of the KHR_character extension by applying it to real-world models and verifying its functionality.

## What it contains

- [converter](./converter): A Deno script that converts VRM 1.0 models to KHR_character glTF files.
- [provisional](./provisional): A collection of provisional documents and prototypes related to the KHR_character extension.
- [schematypes](./schematypes): TypeScript type definitions for the KHR_character extension schema.
- [specification](./specification): A submodule containing the proposal branch of the KHR_character extension in the glTF repository.
- [viewer](./viewer): A Three.js-based web viewer for testing KHR_character models.
    - It contains a sample KHR_character model converted from a VRM 1.0 model: [viewer/src/assets/khr-character-example.glb](./viewer/src/assets/khr-character-example.glb).
    - Asset provenance and file-specific license terms are recorded in [viewer/src/assets/ATTRIBUTION.md](./viewer/src/assets/ATTRIBUTION.md).

## What it currently supports

Following extensions are supported in this testbed:

- [x] [`KHR_character`](https://github.com/Kjakubzak/glTF/tree/kjakubzak/avatar_ext/extensions/2.0/Khronos/KHR_character)
- [x] [`KHR_character_expression`](https://github.com/Kjakubzak/glTF/tree/kjakubzak/avatar_ext/extensions/2.0/Khronos/KHR_character_expression)
- [x] [`KHR_character_expression_joint`](https://github.com/Kjakubzak/glTF/tree/kjakubzak/avatar_ext/extensions/2.0/Khronos/KHR_character_expression_joint)
- [x] [`KHR_character_expression_mapping`](https://github.com/Kjakubzak/glTF/tree/kjakubzak/avatar_ext/extensions/2.0/Khronos/KHR_character_expression_mapping)
- [x] [`KHR_character_expression_mask`](https://github.com/Kjakubzak/glTF/tree/kjakubzak/avatar_ext/extensions/2.0/Khronos/KHR_character_expression_mask)
- [x] [`KHR_character_expression_morphtarget`](https://github.com/Kjakubzak/glTF/tree/kjakubzak/avatar_ext/extensions/2.0/Khronos/KHR_character_expression_morphtarget)
- [x] [`KHR_character_expression_texture`](https://github.com/Kjakubzak/glTF/tree/kjakubzak/avatar_ext/extensions/2.0/Khronos/KHR_character_expression_texture)
- [ ] [`KHR_character_reference_pose`](https://github.com/Kjakubzak/glTF/tree/kjakubzak/avatar_ext/extensions/2.0/Khronos/KHR_character_reference_pose)
- [x] [`KHR_character_skeleton_mapping`](https://github.com/Kjakubzak/glTF/tree/kjakubzak/avatar_ext/extensions/2.0/Khronos/KHR_character_skeleton_mapping)
- [x] [`KHR_mesh_primitive_visibility_hint`](https://github.com/Kjakubzak/glTF/tree/kjakubzak/avatar_ext/extensions/2.0/Khronos/KHR_mesh_primitive_visibility_hint)
- [x] [`KHR_node_camera_hint`](https://github.com/Kjakubzak/glTF/tree/kjakubzak/avatar_ext/extensions/2.0/Khronos/KHR_node_camera_hint)
- [ ] [`KHR_node_lookat_target`](https://github.com/Kjakubzak/glTF/tree/kjakubzak/avatar_ext/extensions/2.0/Khronos/KHR_node_lookat_target)
- [x] [`KHR_node_visibility_hint`](https://github.com/Kjakubzak/glTF/tree/kjakubzak/avatar_ext/extensions/2.0/Khronos/KHR_node_visibility_hint)
- [x] [`VRMC_character_expression_lookat`](./provisional/20260319_VRMC_character_expression_lookat/README.md)

## Quick links

- [Web converter](https://0b5vr.github.io/khr-character-testbed/converter/dist/)
- [Web viewer](https://0b5vr.github.io/khr-character-testbed/viewer/dist/)

## License

Repository-authored source code and documentation are licensed under the [Apache License 2.0](./LICENSE), except where a file-specific notice states otherwise.

Bundled model content is not relicensed by the repository's Apache license. See [viewer/src/assets/ATTRIBUTION.md](./viewer/src/assets/ATTRIBUTION.md) and the checksum-pinned [asset manifest](./viewer/src/assets/ASSET_MANIFEST.tsv) for its applicable terms.
