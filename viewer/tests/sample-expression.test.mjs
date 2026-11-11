import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as THREE from 'three';
import { KHRCharacterExpressionLoaderPlugin } from '../src/khr-character/expressions/KHRCharacterExpressionLoaderPlugin.ts';

// Decode the checked-in asset rather than synthetic sampler values. Rendering and image
// decoding are intentionally omitted; the parser presents the same nodes/accessors as Three.js.
test('bundled GLB expression payload loads and evaluates independently of history', async () => {
  const bytes = await readFile(new URL('../src/assets/khr-character-example.glb', import.meta.url));
  assert.equal(bytes.readUInt32LE(0), 0x46546c67);
  assert.equal(bytes.readUInt32LE(4), 2);
  assert.equal(bytes.readUInt32LE(8), bytes.length);
  const jsonLength = bytes.readUInt32LE(12);
  assert.equal(bytes.readUInt32LE(16), 0x4e4f534a);
  const json = JSON.parse(bytes.subarray(20, 20 + jsonLength).toString());
  const binHeader = 20 + jsonLength;
  const binLength = bytes.readUInt32LE(binHeader);
  assert.equal(bytes.readUInt32LE(binHeader + 4), 0x004e4942);
  const bin = bytes.subarray(binHeader + 8);
  assert.equal(bin.length, binLength);
  assert.ok(bin.length >= json.buffers[0].byteLength);
  assert.ok(bin.length - json.buffers[0].byteLength <= 3);
  for (const view of json.bufferViews) {
    assert.equal(view.buffer, 0);
    assert.ok((view.byteOffset ?? 0) + view.byteLength <= json.buffers[0].byteLength);
  }
  const types = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };
  const components = {
    5120: [1, 'getInt8'], 5121: [1, 'getUint8'], 5122: [2, 'getInt16'],
    5123: [2, 'getUint16'], 5125: [4, 'getUint32'], 5126: [4, 'getFloat32'],
  };
  const data = new DataView(bin.buffer, bin.byteOffset, bin.byteLength);
  const accessors = json.accessors.map(accessor => {
    assert.equal(accessor.sparse, undefined, 'sample decoder expects dense accessors');
    const view = json.bufferViews[accessor.bufferView];
    const [size, method] = components[accessor.componentType];
    const width = types[accessor.type];
    assert.ok(width);
    const stride = view.byteStride ?? size * width;
    const offset = accessor.byteOffset ?? 0;
    assert.ok(offset + (accessor.count - 1) * stride + size * width <= view.byteLength);
    const values = new Float32Array(accessor.count * width);
    for (let i = 0; i < accessor.count; i++) for (let j = 0; j < width; j++) {
      const value = data[method]((view.byteOffset ?? 0) + offset + i * stride + j * size, true);
      assert.ok(Number.isFinite(value));
      values[i * width + j] = value;
    }
    return new THREE.BufferAttribute(values, width);
  });
  const associations = new Map();
  const nodes = json.nodes.map((definition, index) => {
    const node = new THREE.Object3D();
    associations.set(node, { nodes: index });
    if (definition.translation) node.position.fromArray(definition.translation);
    if (definition.rotation) node.quaternion.fromArray(definition.rotation);
    if (definition.scale) node.scale.fromArray(definition.scale);
    if (definition.matrix) { node.matrix.fromArray(definition.matrix); node.matrix.decompose(node.position, node.quaternion, node.scale); }
    if (definition.mesh != null) for (const primitive of json.meshes[definition.mesh].primitives) {
      const mesh = new THREE.Mesh();
      if (primitive.targets) mesh.morphTargetInfluences = [...(definition.weights ?? json.meshes[definition.mesh].weights ?? primitive.targets.map(() => 0))];
      node.add(mesh);
    }
    return node;
  });
  json.nodes.forEach((node, index) => node.children?.forEach(child => nodes[index].add(nodes[child])));
  const scene = new THREE.Scene();
  for (const index of json.scenes[json.scene ?? 0].nodes) scene.add(nodes[index]);
  const parser = { json, associations, getDependency: async (kind, index) => {
    if (kind === 'node') return nodes[index];
    if (kind === 'accessor') return accessors[index];
    throw new Error(`Unexpected dependency: ${kind}`);
  } };
  const manager = await new KHRCharacterExpressionLoaderPlugin(parser)._import({ scene, scenes: [scene], parser, animations: [], userData: {} });
  assert.equal(manager.expressions.size, 18);
  const snapshot = () => nodes.map(node => [
    ...node.position.toArray(), ...node.quaternion.toArray(), ...node.scale.toArray(),
    ...node.children.flatMap(child => child.morphTargetInfluences ?? []),
  ]);
  const setAll = value => { for (const entry of manager.expressions) manager.setValue(entry.expressionName, value); };
  setAll(0); manager.update(0); const neutral = snapshot();
  for (const entry of manager.expressions) {
    assert.ok(entry.duration > 0);
    assert.ok(entry.responses.length > 0);
    setAll(0); manager.setValue(entry.expressionName, 0.5); manager.update(0);
    const first = snapshot();
    setAll(1); manager.update(0.123);
    setAll(0); manager.setValue(entry.expressionName, 0.5); manager.update(0.456);
    assert.deepEqual(snapshot(), first, `history-independent ${entry.expressionName}`);
  }
  setAll(0); manager.update(0);
  assert.deepEqual(snapshot(), neutral);
});
