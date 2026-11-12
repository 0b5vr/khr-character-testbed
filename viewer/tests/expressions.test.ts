import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createExpressionSampler, applyExpressionResponses } from '../src/khr-character/expressions/expressionResponse.ts';
import { KHRCharacterExpressionLoaderPlugin } from '../src/khr-character/expressions/KHRCharacterExpressionLoaderPlugin.ts';
import { validateKHRCharacterExpressionChannelTargets } from '../src/khr-character/expressions/validateKHRCharacterExpressionChannelTargets.ts';

test('samplers clamp endpoints, preserve raw angle winding, and support cubic tangents', () => {
  const linear = createExpressionSampler([1, 3], [2 * Math.PI, 6 * Math.PI], 1, 'LINEAR');
  assert.deepEqual(linear(0), [2 * Math.PI]);
  assert.deepEqual(linear(2), [4 * Math.PI]);
  assert.deepEqual(linear(4), [6 * Math.PI]);
  const cubic = createExpressionSampler([0, 2], [0, 0, 0, 0, 2, 0], 1, 'CUBICSPLINE');
  assert.deepEqual(cubic(1), [1]);
});

test('aggregation uses authored base and each channel neutral, with no result clamp', () => {
  let result: number[] = [];
  const response = { key: 'weights', base: [0.5, 0.7], neutral: [0.2], component: 0, quaternion: false, sample: () => [0.8], write: (v: number[]) => { result = v; } };
  applyExpressionResponses([{ responses: [response, response], time: 1, active: true }]);
  assert.deepEqual(result, [1.7000000000000002, 0.7]);
  applyExpressionResponses([{ responses: [response], time: 0, active: false }]);
  assert.deepEqual(result, [0.5, 0.7]);
});

function fixture() {
  const node = new THREE.Object3D(); node.position.set(5, 0, 0);
  const json: any = {
    extensionsUsed: ['KHR_character', 'KHR_character_expression', 'KHR_character_expression_joint', 'KHR_character_expression_suppression'],
    extensions: { KHR_character: {}, KHR_character_expression: { expressions: [
      { name: 'a', animation: 0, extensions: { KHR_character_expression_joint: { channels: [0] }, KHR_character_expression_suppression: { suppressions: [{target: 1, name: 'independent rule label', amount: 0.5}] } } },
      { name: 'b', animation: 0, extensions: { KHR_character_expression_joint: { channels: [0] } } },
    ] } },
    nodes: [{ translation: [5, 0, 0] }, {}],
    accessors: [{ type: 'SCALAR', componentType: 5126, min: [0], max: [2] }, {type:'VEC3', componentType:5126}, {type:'SCALAR',componentType:5126,min:[0],max:[4]}],
    animations: [{ channels: [{sampler:0,target:{node:0,path:'translation'}}, {sampler:1,target:{node:1,path:'translation'}}], samplers:[{input:0,output:1},{input:2,output:1}] }],
  };
  const attributes = [new THREE.Float32BufferAttribute([0,2],1),new THREE.Float32BufferAttribute([1,0,0,3,0,0],3),new THREE.Float32BufferAttribute([0,4],1)];
  const parser: any = { json, associations: new Map(), getDependency: async (type: string, i: number) => type === 'accessor' ? attributes[i] : node };
  return { node, json, parser, gltf: { scene: node, parser } as any };
}

test('shared animations evaluate independently; unlisted channels affect duration but do not animate', async () => {
  const f = fixture();
  const manager = (await new KHRCharacterExpressionLoaderPlugin(f.parser)._import(f.gltf))!;
  manager.setValue('a', 0.25); manager.setValue('b', 0.5); manager.update(0);
  // T=4. a samples t=1 => +1. b is suppressed to .4375 and samples t=1.75 => +1.75.
  assert.equal(f.node.position.x, 7.75);
  manager.setValue('a', 0); manager.setValue('b', 0); manager.update(0);
  assert.equal(f.node.position.x, 5);
});

test('suppression sums attenuation and ignores unsupported custom types', async () => {
  const f = fixture();
  f.json.extensions.KHR_character_expression.expressions[0].extensions.KHR_character_expression_suppression.suppressions = [
    {target:1,amount:0.5}, {target:1,amount:0.5}, {target:0,type:'ACME_custom',amount:1},
  ];
  const manager = (await new KHRCharacterExpressionLoaderPlugin(f.parser)._import(f.gltf))!;
  manager.setValue('a', 1); manager.setValue('b', 1); manager.update(0);
  assert.equal(f.node.position.x, 7); // only a contributes; custom rule leaves a unchanged.
});

test('duplicate targets and multiply owned channels warn without throwing', (t) => {
  const warn = t.mock.method(console, 'warn', () => {});
  const f = fixture(); const entry = f.json.extensions.KHR_character_expression.expressions[0];
  f.json.animations[0].channels[1].target.node = 0;
  assert.equal(validateKHRCharacterExpressionChannelTargets(entry, f.json), null);
  f.json.animations[0].channels[1].target.node = 1;
  entry.extensions.KHR_character_expression_joint.channels = [0,0];
  const result = validateKHRCharacterExpressionChannelTargets(entry, f.json)!;
  assert.equal(result.hasInvalidChannels, true);
  assert.equal(result.channels.size, 0);
  assert.ok(warn.mock.calls.some(call => String(call.arguments[0]).includes('overlapping')));
  assert.ok(warn.mock.calls.some(call => /multiply owned/i.test(String(call.arguments[0]))));
});

test('invalid native names and decoded sampler data skip entries with warnings', async (t) => {
  const warn = t.mock.method(console, 'warn', () => {});
  const f = fixture();
  f.json.extensions.KHR_character_expression.expressions[1].name = 'a';
  const namesManager = (await new KHRCharacterExpressionLoaderPlugin(f.parser)._import(f.gltf))!;
  assert.equal(namesManager.expressions.size, 0);
  f.json.extensions.KHR_character_expression.expressions[1].name = 'b';
  f.parser.getDependency = async () => new THREE.Float32BufferAttribute([1,1],1);
  const samplerManager = (await new KHRCharacterExpressionLoaderPlugin(f.parser)._import(f.gltf))!;
  assert.equal(samplerManager.expressions.size, 0);
  assert.ok(warn.mock.calls.length >= 2);
});

test('one invalid expression does not prevent valid entries importing and animating', async (t) => {
  const warn = t.mock.method(console, 'warn', () => {});
  const f = fixture();
  f.json.extensions.KHR_character_expression.expressions.push({ name: 'broken', animation: 999 });
  const manager = (await new KHRCharacterExpressionLoaderPlugin(f.parser)._import(f.gltf))!;
  assert.deepEqual([...manager.expressionMap.keys()], ['a', 'b']);
  manager.setValue('a', 0.25);
  manager.update(0);
  assert.equal(f.node.position.x, 6);
  assert.ok(warn.mock.calls.length > 0);
});

test('invalid driver updates warn without preventing other expressions updating', async (t) => {
  const warn = t.mock.method(console, 'warn', () => {});
  const f = fixture();
  const manager = (await new KHRCharacterExpressionLoaderPlugin(f.parser)._import(f.gltf))!;
  manager.setValue('a', 0.25);
  manager.setValue('a', NaN);
  assert.equal(manager.getValue('a'), 0.25);
  manager.expressionMap.get('b')!.weight = Infinity;
  assert.doesNotThrow(() => manager.update(0));
  assert.equal(f.node.position.x, 6);
  assert.ok(warn.mock.calls.length >= 2);
});

test('textureInfo targets remain isolated despite loader texture deduplication', async () => {
  const f = fixture();
  f.json.extensionsUsed.push('KHR_texture_transform', 'KHR_animation_pointer', 'KHR_character_expression_texture_transform');
  const a = { index:0, extensions:{KHR_texture_transform:{}} };
  f.json.materials = [{pbrMetallicRoughness:{baseColorTexture:a, metallicRoughnessTexture:a}}];
  const texture = new THREE.Texture();
  const material: any = { map:texture, metalnessMap:texture, roughnessMap:texture };
  const variant: any = {map:texture, metalnessMap:texture, roughnessMap:texture};
  f.parser.associations.set(variant, {materials:0});
  const load = f.parser.getDependency;
  f.parser.getDependency = async (type: string, i: number) => type === 'material' ? material : load(type,i);
  const plugin = new KHRCharacterExpressionLoaderPlugin(f.parser);
  const bind = (plugin as any)._binding.bind(plugin);
  const color = await bind('/materials/0/pbrMetallicRoughness/baseColorTexture/extensions/KHR_texture_transform/offset', f.json);
  const metal = await bind('/materials/0/pbrMetallicRoughness/metallicRoughnessTexture/extensions/KHR_texture_transform/offset', f.json);
  color.write([0.2,0.3]); metal.write([0.7,0.8]);
  assert.notEqual(material.map, material.metalnessMap);
  assert.equal(material.metalnessMap, material.roughnessMap);
  assert.equal(variant.metalnessMap, material.metalnessMap);
  assert.equal(variant.map, material.map);
  assert.deepEqual(material.map.offset.toArray(), [0.2,0.3]);
  assert.deepEqual(material.roughnessMap.offset.toArray(), [0.7,0.8]);
});

test('morph binding excludes descendant glTF node meshes', async () => {
  const f = fixture();
  f.json.nodes = [{mesh:0}, {mesh:0}]; f.json.meshes = [{primitives:[{targets:[{}]}]}];
  const parent = new THREE.Mesh(); parent.morphTargetInfluences = [0];
  const child = new THREE.Mesh(); child.morphTargetInfluences = [0.8]; parent.add(child);
  f.parser.associations.set(child, {nodes:1});
  f.parser.getDependency = async () => parent;
  const binding = await (new KHRCharacterExpressionLoaderPlugin(f.parser) as any)._binding('/nodes/0/weights',f.json);
  binding.write([0.4]);
  assert.deepEqual(parent.morphTargetInfluences,[0.4]);
  assert.deepEqual(child.morphTargetInfluences,[0.8]);
});

test('skipped expressions preserve suppression indices for later valid entries', async (t) => {
  const warn = t.mock.method(console, 'warn', () => {});
  const f = fixture();
  const entries = f.json.extensions.KHR_character_expression.expressions;
  entries.splice(1, 0, { name: '', animation: 0 }, { name: 'missing', animation: 999 });
  entries[0].extensions.KHR_character_expression_suppression.suppressions = [
    { target: 3 }, { target: 1 }, { target: 3, amount: 2 },
  ];
  const manager = (await new KHRCharacterExpressionLoaderPlugin(f.parser)._import(f.gltf))!;
  assert.deepEqual([...manager.expressionMap.keys()], ['a', 'b']);
  assert.equal(manager.expressionMap.get('a')!.suppressions.length, 1);
  manager.setValue('a', 1); manager.setValue('b', 1); manager.update(0);
  assert.equal(f.node.position.x, 7);
  assert.ok(warn.mock.calls.length > 0);
});

test('invalid decoded channel output leaves valid channels usable', async (t) => {
  const warn = t.mock.method(console, 'warn', () => {});
  const f = fixture();
  f.json.nodes.push({});
  f.json.animations[0].channels.push({ sampler: 2, target: { node: 2, path: 'translation' } });
  f.json.animations[0].samplers.push({ input: 0, output: 3 });
  f.json.accessors.push({ type: 'VEC3', componentType: 5126 });
  f.json.extensions.KHR_character_expression.expressions[0].extensions.KHR_character_expression_joint.channels.push(2);
  const load = f.parser.getDependency;
  f.parser.getDependency = async (type: string, index: number) => type === 'accessor' && index === 3
    ? new THREE.Float32BufferAttribute([0, NaN, 0, 2, 0, 0], 3) : load(type, index);
  const manager = (await new KHRCharacterExpressionLoaderPlugin(f.parser)._import(f.gltf))!;
  assert.equal(manager.expressionMap.get('a')!.responses.length, 1);
  manager.setValue('a', 1); manager.update(0);
  assert.equal(f.node.position.x, 7);
  assert.ok(warn.mock.calls.length > 0);
});
