/** Rebuild the bundled sample from its retained VRM payload (Node 24+). */
import { readFileSync, writeFileSync } from 'node:fs';
import { convertVRMToKHRCharacter } from '../converter/converter/convertVRMToKHRCharacter.ts';
import { extractGLB } from '../converter/converter/extractGLB.ts';
import { constructGLB } from '../converter/converter/constructGLB.ts';

const path = new URL('../viewer/src/assets/khr-character-example.glb', import.meta.url);
const [gltf, bin] = extractGLB(readFileSync(path));
if (!gltf.extensions?.VRMC_vrm) throw new Error('Sample must retain its VRM source');
const generated = new Set(gltf.extensions?.KHR_character_expression?.expressions.map((entry: { animation: number }) => entry.animation) ?? []);
// The bundled asset contains only generated expression animations.
if ((gltf.animations ?? []).some((_, i) => !generated.has(i))) throw new Error('Unexpected source animation; preserve it before rebuilding');
const generatedAccessors = (gltf.animations ?? []).flatMap(a => a.samplers.flatMap(s => [s.input, s.output]));
if (generatedAccessors.length) {
  const start = Math.min(...generatedAccessors);
  const generatedSet = new Set(generatedAccessors);
  if (gltf.accessors!.slice(start).some((_, i) => !generatedSet.has(start + i))) {
    throw new Error('Generated accessors must form a suffix; refusing to discard source accessors');
  }
  const sourceAccessors = [
    ...(gltf.meshes ?? []).flatMap(mesh => mesh.primitives.flatMap(primitive => [
      primitive.indices,
      ...Object.values(primitive.attributes),
      ...(primitive.targets ?? []).flatMap(target => Object.values(target)),
    ])),
    ...(gltf.skins ?? []).map(skin => skin.inverseBindMatrices),
  ].filter((index): index is number => index != null);
  if (sourceAccessors.some(index => generatedSet.has(index))) throw new Error('Source geometry/skin shares a generated accessor');
  const views = gltf.accessors!.slice(start).flatMap(a => a.bufferView == null ? [] : [a.bufferView]);
  const generatedViews = new Set(views);
  const firstView = Math.min(...views);
  if (views.length && gltf.bufferViews!.slice(firstView).some((_, i) => !generatedViews.has(firstView + i))) {
    throw new Error('Generated buffer views must form a suffix; refusing to discard source data');
  }
  const retainedViews = [
    ...gltf.accessors!.slice(0, start).flatMap(a => [a.bufferView, a.sparse?.indices.bufferView, a.sparse?.values.bufferView]),
    ...(gltf.images ?? []).map(image => image.bufferView),
  ].filter((index): index is number => index != null);
  if (retainedViews.some(index => generatedViews.has(index))) throw new Error('Source data shares a generated buffer view');
  gltf.accessors = gltf.accessors!.slice(0, start);
  if (views.length) gltf.bufferViews = gltf.bufferViews!.slice(0, Math.min(...views));
}
delete gltf.animations;
const nodes = gltf.nodes!;
const helperNames = new Set(['__LookAtReferenceNode__', '__FirstPersonCamera__']);
// These helpers are appended; fail rather than silently invalidate arbitrary node indices.
while (helperNames.has(nodes.at(-1)?.name ?? '')) {
  const index = nodes.length - 1;
  for (const node of nodes) if (node.children) node.children = node.children.filter(i => i !== index);
  nodes.pop();
}
const obsolete = (name: string) => name === 'KHR_character' || name.startsWith('KHR_character_') || name === 'VRMC_character_expression_lookat' || name === 'KHR_node_camera_hint' || name === 'KHR_node_visibility_hint' || name === 'KHR_xmp_json_ld';
for (const extensions of [gltf.extensions, gltf.asset.extensions, ...nodes.map(n => n.extensions)]) {
  if (extensions) for (const key of Object.keys(extensions)) if (obsolete(key)) delete extensions[key];
}
gltf.extensionsUsed = gltf.extensionsUsed?.filter(name => !obsolete(name));
gltf.extensionsRequired = gltf.extensionsRequired?.filter(name => !obsolete(name));
if (gltf.buffers?.length !== 1 || gltf.buffers[0].uri || (gltf.bufferViews ?? []).some(view => view.buffer !== 0)) throw new Error('Sample rebuild requires one embedded buffer');
const byteLength = Math.max(0, ...(gltf.bufferViews ?? []).map(v => (v.byteOffset ?? 0) + v.byteLength));
gltf.buffers![0].byteLength = byteLength;
const input = constructGLB(gltf, bin.slice(0, byteLength));
writeFileSync(path, convertVRMToKHRCharacter(input, { autoVisibility: true }).glb);
console.log('Regenerated sample');
