import assert from 'node:assert/strict';
import { test } from 'node:test';
import { appendKHRCharacter } from '../converter/appendKHRCharacter.ts';
import { appendKHRCharacterExpression } from '../converter/expressions/appendKHRCharacterExpression.ts';
import { appendKHRXmpJsonLd } from '../converter/appendKHRXmpJsonLd.ts';
import { options } from '../converter/options.ts';

function fixture() {
  return {
    asset: { version: '2.0' },
    nodes: [{ mesh: 0, weights: [0.25, 0.5] }],
    meshes: [{ primitives: [{ attributes: {}, targets: [{}, {}] }] }],
    materials: [{ pbrMetallicRoughness: { baseColorTexture: { index: 0, extensions: { KHR_texture_transform: { offset: [0.2, 0.3], scale: [0.5, 0.5] } } } } }],
    extensions: { VRMC_vrm: {
      meta: { name: 'Test', authors: ['Author'], licenseUrl: 'https://example.com/license' },
      expressions: { preset: {
        happy: { morphTargetBinds: [{ node: 0, index: 0, weight: 0.2 }, { node: 0, index: 0, weight: 0.3 }, { node: 0, index: 1, weight: 0.1 }], textureTransformBinds: [{ material: 0, offset: [0.1, 0] }, { material: 0, offset: [0.2, 0] }], overrideMouth: 'blend' },
        aa: { morphTargetBinds: [{ node: 0, index: 1, weight: 0.4 }] },
      } },
    } },
  } as any;
}
function values(gltf: any, bin: Uint8Array, accessorIndex: number) {
  const accessor = gltf.accessors[accessorIndex];
  const view = gltf.bufferViews[accessor.bufferView];
  return [...new Float32Array(bin.buffer, bin.byteOffset + view.byteOffset, view.byteLength / 4)];
}

test('character marker does not require a root or alter hierarchy', () => {
  const gltf: any = { asset: { version: '2.0' } };
  appendKHRCharacter(gltf); appendKHRCharacter(gltf);
  assert.deepEqual(gltf.extensions.KHR_character, {});
  assert.deepEqual(gltf.extensionsUsed, ['KHR_character']);
  assert.equal(gltf.nodes, undefined);
});

test('converter emits names, documented mapping and suppression; coalesces pointers', () => {
  const gltf = fixture(); const bin: [Uint8Array] = [new Uint8Array()];
  appendKHRCharacterExpression(gltf, bin, {});
  const entries = gltf.extensions.KHR_character_expression.expressions;
  assert.equal(entries[0].name, 'happy'); assert.equal(entries[0].expression, undefined);
  assert.deepEqual(entries[0].extensions.KHR_character_expression_suppression.suppressions, [{ target: 1, name: 'aa', type: 'blend' }]);
  assert.ok(gltf.extensions.KHR_character_expression_mapping.expressionSetMappings.vrm1_expressions);
  assert.ok(gltf.extensionsUsed.includes('KHR_character_expression_texture_transform'));
  const channels = gltf.animations[0].channels;
  const pointers = channels.map((c: any) => c.target.extensions.KHR_animation_pointer.pointer);
  assert.equal(new Set(pointers).size, pointers.length);
  const morph = gltf.animations[0].samplers[channels[0].sampler];
  assert.deepEqual(values(gltf, bin[0], morph.output), [0.25, 0.75]);
  const offsetChannel = channels.find((c: any) => c.target.extensions.KHR_animation_pointer.pointer.endsWith('/offset'));
  const output = values(gltf, bin[0], gltf.animations[0].samplers[offsetChannel.sampler].output);
  assert.ok(Math.abs(output[2] - 0.5) < 1e-6);
});

test('core weights output groups all binds into one complete vector', () => {
  const previous = options.useAnimationPointerForMorphTarget;
  options.useAnimationPointerForMorphTarget = false;
  try {
    const gltf = fixture(); const bin: [Uint8Array] = [new Uint8Array()];
    appendKHRCharacterExpression(gltf, bin, {});
    const animation = gltf.animations[0];
    const channels = animation.channels.filter((c: any) => c.target.path === 'weights');
    assert.equal(channels.length, 1);
    const output = values(gltf, bin[0], animation.samplers[channels[0].sampler].output);
    assert.deepEqual(output.slice(0, 3), [0.25, 0.5, 0.75]);
    assert.ok(Math.abs(output[3] - 0.6) < 1e-6);
  } finally { options.useAnimationPointerForMorphTarget = previous; }
});

test('rejects duplicate/empty native names before creating animations', () => {
  const gltf = fixture(); gltf.extensions.VRMC_vrm.expressions.custom = { happy: {} };
  assert.throws(() => appendKHRCharacterExpression(gltf, [new Uint8Array()], {}), /unique/);
  assert.equal(gltf.animations, undefined);
});

test('XMP uses published terms and XMP language/list shapes', () => {
  const gltf = fixture(); appendKHRXmpJsonLd(gltf);
  const packet = gltf.extensions.KHR_xmp_json_ld.packets[0];
  assert.deepEqual(packet['dcterms:license'], { '@list': ['https://example.com/license'] });
  assert.equal(packet['dc:license'], undefined);
  assert.equal(packet['dc:title']['rdf:_1']['@value'], 'Test');
  assert.equal(packet['@context'].rdf, 'http://www.w3.org/1999/02/22-rdf-syntax-ns#');
});
