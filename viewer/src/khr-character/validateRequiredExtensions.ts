/** Support supplied by this viewer's configured loaders (no external mesh/texture decoders). */
const supported = new Set([
  'KHR_character', 'KHR_character_expression', 'KHR_character_expression_joint',
  'KHR_character_expression_morphtarget', 'KHR_character_expression_texture_transform',
  'KHR_character_expression_suppression', 'KHR_character_expression_mapping',
  'KHR_character_skeleton_mapping', 'KHR_animation_pointer', 'KHR_texture_transform',
  'KHR_mesh_quantization', 'KHR_lights_punctual', 'KHR_materials_unlit',
  'KHR_materials_anisotropy', 'KHR_materials_clearcoat', 'KHR_materials_dispersion',
  'KHR_materials_emissive_strength', 'KHR_materials_ior', 'KHR_materials_iridescence',
  'KHR_materials_sheen', 'KHR_materials_specular', 'KHR_materials_transmission',
  'KHR_materials_volume', 'EXT_materials_bump', 'EXT_mesh_gpu_instancing',
  'EXT_texture_webp', 'EXT_texture_avif', 'VRMC_vrm_animation',
  'VRMC_character_expression_lookat',
]);

/** Three.js only warns for some unknown required extensions, so enforce the contract explicitly. */
export function validateRequiredExtensions(json: { extensionsUsed?: string[]; extensionsRequired?: string[] }): void {
  for (const name of json.extensionsRequired ?? []) {
    if (!json.extensionsUsed?.includes(name)) throw new Error(`Required extension absent from extensionsUsed: ${name}`);
    if (!supported.has(name)) throw new Error(`Unsupported required extension: ${name}`);
  }
}
