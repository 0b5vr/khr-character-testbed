import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Object3D } from 'three';
import { KHRCharacterExpressionMapping } from '../src/khr-character/expression-mapping/KHRCharacterExpressionMapping.ts';
import { isVisibilityHintRoleVisible as visible } from '../src/khr-character/visibility-hint/isVisibilityHintRoleVisible.ts';
import { KHRNodeVisibilityHint } from '../src/khr-character/node-visibility-hint/KHRNodeVisibilityHint.ts';
import { KHRMeshPrimitiveVisibilityHint } from '../src/khr-character/mesh-primitive-visibility-hint/KHRMeshPrimitiveVisibilityHint.ts';

test('mapping sums contributions by index and clamps after summing', () => {
  const mapping = new KHRCharacterExpressionMapping({ expressionSetMappings: { vrm1_expressions: {
    happy: [{ source: 0, weight: 0.8, name: 'independent label' }, { source: 1, weight: 0.8 }],
    relaxed: [{ source: 0, weight: 0.2 }],
  } } }, ['left', 'right', 'unused']);
  assert.deepEqual(mapping.evaluate('vrm1_expressions', { happy: 0.5, relaxed: 0.25 }), [0.45, 0.4, 0]);
  assert.deepEqual(mapping.evaluate('vrm1_expressions', { happy: 2, relaxed: 1 }), [1, 0.8, 0]);
  assert.throws(() => mapping.evaluate('vrm1_expressions', { happy: NaN }));
  assert.throws(() => mapping.evaluate('unknown', {}));
});

test('roles are alternatives, unknown roles ignored, exact comparison', () => {
  assert.equal(visible(['first_person', 'ACME_mirror'], 'third_person'), false);
  assert.equal(visible(['ACME_mirror'], 'third_person'), true);
  assert.equal(visible(['first_person', 'third_person'], 'first_person'), true);
  assert.equal(visible(['First_Person'], 'first_person'), true);
  assert.equal(visible(['always'], 'first_person'), true);
});

test('render scopes preserve instance state and combine node and primitive restrictions', () => {
  const parent = new Object3D(), child = new Object3D(), otherInstance = new Object3D();
  parent.add(child);
  const node = new KHRNodeVisibilityHint([{ node: parent, roles: ['third_person'] }, { node: child, roles: ['always'] }]);
  const primitive = new KHRMeshPrimitiveVisibilityHint([{ object: child, roles: ['first_person'] }]);
  node.withView('first_person', () => {
    assert.equal(parent.visible, false); // hidden ancestors suppress the entire subtree in Three.js
    assert.equal(child.visible, true);
    assert.equal(otherInstance.visible, true);
  });
  assert.equal(parent.visible, true);
  node.withView('third_person', () => primitive.withView('third_person', () => assert.equal(child.visible, false)));
  assert.equal(child.visible, true);
  child.visible = false;
  assert.throws(() => primitive.withView('first_person', () => { assert.equal(child.visible, false); throw new Error('render failure'); }));
  assert.equal(child.visible, false);
});


test('advisory required hints are rejected by their loaders', async () => {
  const { KHRNodeVisibilityHintLoaderPlugin } = await import('../src/khr-character/node-visibility-hint/KHRNodeVisibilityHintLoaderPlugin.ts');
  const { KHRMeshPrimitiveVisibilityHintLoaderPlugin } = await import('../src/khr-character/mesh-primitive-visibility-hint/KHRMeshPrimitiveVisibilityHintLoaderPlugin.ts');
  const { KHRNodeCameraHintLoaderPlugin } = await import('../src/khr-character/camera-hint/KHRNodeCameraHintLoaderPlugin.ts');
  for (const [name, Plugin] of [
    ['KHR_node_visibility_hint', KHRNodeVisibilityHintLoaderPlugin],
    ['KHR_mesh_primitive_visibility_hint', KHRMeshPrimitiveVisibilityHintLoaderPlugin],
    ['KHR_node_camera_hint', KHRNodeCameraHintLoaderPlugin],
  ]) {
    const parser = { json: { extensionsUsed: [name], extensionsRequired: [name], nodes: [], meshes: [] } };
    await assert.rejects(async () => new Plugin(parser)._import({ parser, scenes: [] }));
  }
});
