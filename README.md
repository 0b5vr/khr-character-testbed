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

The implementation targets the **2026-11-03 draft**, pinned to [`7ab5368`](https://github.com/Kjakubzak/glTF/commit/7ab5368a87d1d303dff33ec5f9aad42752e84c78). These extensions are still drafts. See [migration epic #2](https://github.com/0b5vr/khr-character-testbed/issues/2).

## What it currently supports

Following extensions are supported in this testbed:

- [x] [`KHR_character`](https://github.com/Kjakubzak/glTF/tree/7ab5368a87d1d303dff33ec5f9aad42752e84c78/extensions/2.0/Khronos/KHR_character)
- [x] [`KHR_character_expression`](https://github.com/Kjakubzak/glTF/tree/7ab5368a87d1d303dff33ec5f9aad42752e84c78/extensions/2.0/Khronos/KHR_character_expression)
- [x] [`KHR_character_expression_joint`](https://github.com/Kjakubzak/glTF/tree/7ab5368a87d1d303dff33ec5f9aad42752e84c78/extensions/2.0/Khronos/KHR_character_expression_joint)
- [x] [`KHR_character_expression_mapping`](https://github.com/Kjakubzak/glTF/tree/7ab5368a87d1d303dff33ec5f9aad42752e84c78/extensions/2.0/Khronos/KHR_character_expression_mapping)
- [x] [`KHR_character_expression_suppression`](https://github.com/Kjakubzak/glTF/tree/7ab5368a87d1d303dff33ec5f9aad42752e84c78/extensions/2.0/Khronos/KHR_character_expression_suppression)
- [x] [`KHR_character_expression_morphtarget`](https://github.com/Kjakubzak/glTF/tree/7ab5368a87d1d303dff33ec5f9aad42752e84c78/extensions/2.0/Khronos/KHR_character_expression_morphtarget)
- [x] [`KHR_character_expression_texture_transform`](https://github.com/Kjakubzak/glTF/tree/7ab5368a87d1d303dff33ec5f9aad42752e84c78/extensions/2.0/Khronos/KHR_character_expression_texture_transform)
- [ ] [`KHR_character_reference_pose`](https://github.com/Kjakubzak/glTF/tree/7ab5368a87d1d303dff33ec5f9aad42752e84c78/extensions/2.0/Khronos/KHR_character_reference_pose)
- [x] [`KHR_character_skeleton_mapping`](https://github.com/Kjakubzak/glTF/tree/7ab5368a87d1d303dff33ec5f9aad42752e84c78/extensions/2.0/Khronos/KHR_character_skeleton_mapping)
- [x] [`KHR_mesh_primitive_visibility_hint`](https://github.com/Kjakubzak/glTF/tree/7ab5368a87d1d303dff33ec5f9aad42752e84c78/extensions/2.0/Khronos/KHR_mesh_primitive_visibility_hint)
- [x] [`KHR_node_camera_hint`](https://github.com/Kjakubzak/glTF/tree/7ab5368a87d1d303dff33ec5f9aad42752e84c78/extensions/2.0/Khronos/KHR_node_camera_hint)
- [ ] [`KHR_node_lookat_target`](https://github.com/Kjakubzak/glTF/tree/7ab5368a87d1d303dff33ec5f9aad42752e84c78/extensions/2.0/Khronos/KHR_node_lookat_target)
- [x] [`KHR_node_visibility_hint`](https://github.com/Kjakubzak/glTF/tree/7ab5368a87d1d303dff33ec5f9aad42752e84c78/extensions/2.0/Khronos/KHR_node_visibility_hint)
- [x] [`VRMC_character_expression_lookat`](./provisional/20260319_VRMC_character_expression_lookat/README.md)

## Viewer integration

`loadGLTF()` exposes `expressionMapping`. Select a set explicitly and call
`expressionMapping.evaluate(setId, inputs)` to obtain native drivers in expression-index
order. The host arbitrates these with direct inputs before calling
`expressionManager.setValue(expressionMapping.nativeNames[index], value)`; the manager
then applies suppression and evaluates responses. The demo UI drives native inputs directly.

Visibility managers expose synchronous `withView(view, render)` scopes. Nest the node
scope around the primitive scope for each rendered view and asset instance. They combine
restrictions with existing visibility for rendering and restore it in `finally`, without
changing authored or animated state between views. `setView()` only selects a default
context. A string context uses the demo's first/third-person convention; a `Set` can
apply both recognized roles. Unknown custom roles are ignored.

Expression evaluation restores authored values when responses become inactive, uses additive
node/texture scale composition, and composes quaternion deltas in expression order. Mixing
with other animation systems is host-defined. Runtime checks validate decoded samplers and
supported node/texture targets; validation involving unsupported extension-defined targets
is incomplete. Unsupported optional target domains are skipped.

## Quick links

- [Web converter](https://0b5vr.github.io/khr-character-testbed/converter/dist/)
- [Web viewer](https://0b5vr.github.io/khr-character-testbed/viewer/dist/)

## License

[Apache License 2.0](./LICENSE)
