import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Object3D } from 'three';
import { KHRCharacterExpressionMapping } from '../src/khr-character/expression-mapping/KHRCharacterExpressionMapping.ts';
import { isVisibilityHintRoleVisible as visible } from '../src/khr-character/visibility-hint/isVisibilityHintRoleVisible.ts';
import { KHRNodeVisibilityHint } from '../src/khr-character/node-visibility-hint/KHRNodeVisibilityHint.ts';
import { KHRMeshPrimitiveVisibilityHint } from '../src/khr-character/mesh-primitive-visibility-hint/KHRMeshPrimitiveVisibilityHint.ts';

test('mapping sums contributions by index and clamps after summing', (t) => {
  const warn = t.mock.method(console, 'warn', () => {});
  const mapping = new KHRCharacterExpressionMapping({ expressionSetMappings: { vrm1_expressions: {
    happy: [{ source: 0, weight: 0.8, name: 'independent label' }, { source: 1, weight: 0.8 }],
    relaxed: [{ source: 0, weight: 0.2 }],
  } } }, ['left', 'right', 'unused']);
  assert.deepEqual(mapping.evaluate('vrm1_expressions', { happy: 0.5, relaxed: 0.25 }), [0.45, 0.4, 0]);
  assert.deepEqual(mapping.evaluate('vrm1_expressions', { happy: 2, relaxed: 1 }), [1, 0.8, 0]);
  assert.deepEqual(mapping.evaluate('vrm1_expressions', { happy: NaN }), [0, 0, 0]);
  assert.deepEqual(mapping.evaluate('unknown', {}), [0, 0, 0]);
  assert.equal(warn.mock.calls.length, 2);
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


test('advisory required hints warn and do not block loading', async (t) => {
  const warn = t.mock.method(console, 'warn', () => {});
  const { KHRNodeVisibilityHintLoaderPlugin } = await import('../src/khr-character/node-visibility-hint/KHRNodeVisibilityHintLoaderPlugin.ts');
  const { KHRMeshPrimitiveVisibilityHintLoaderPlugin } = await import('../src/khr-character/mesh-primitive-visibility-hint/KHRMeshPrimitiveVisibilityHintLoaderPlugin.ts');
  const { KHRNodeCameraHintLoaderPlugin } = await import('../src/khr-character/camera-hint/KHRNodeCameraHintLoaderPlugin.ts');
  for (const [name, Plugin] of [
    ['KHR_node_visibility_hint', KHRNodeVisibilityHintLoaderPlugin],
    ['KHR_mesh_primitive_visibility_hint', KHRMeshPrimitiveVisibilityHintLoaderPlugin],
    ['KHR_node_camera_hint', KHRNodeCameraHintLoaderPlugin],
  ]) {
    const parser = { json: { extensionsUsed: [name], extensionsRequired: [name], nodes: [], meshes: [] } };
    await assert.doesNotReject(async () => new Plugin(parser)._import({ parser, scenes: [] }));
  }
  assert.equal(warn.mock.calls.length, 3);
});


test('mapping loader retains valid contributions when one entry is malformed', async (t) => {
  const warn = t.mock.method(console, 'warn', () => {});
  const { KHRCharacterExpressionMappingLoaderPlugin } = await import('../src/khr-character/expression-mapping/KHRCharacterExpressionMappingLoaderPlugin.ts');
  const json = {
    extensionsUsed: ['KHR_character', 'KHR_character_expression', 'KHR_character_expression_mapping'],
    extensions: {
      KHR_character: {}, KHR_character_expression: { expressions: [null, { name: 'smile' }] },
      KHR_character_expression_mapping: { expressionSetMappings: { vrm1_expressions: {
        happy: [{ source: 999, weight: 1 }, { source: 0, weight: 1 }, { source: 1, weight: 0.5 }],
      } } },
    },
  };
  const gltf = { userData: {} };
  await new KHRCharacterExpressionMappingLoaderPlugin({ json }).afterRoot(gltf);
  const mapping = gltf.userData.khrCharacterExpressionMapping;
  assert.ok(mapping);
  assert.deepEqual(mapping.evaluate('vrm1_expressions', { happy: 1 }), [0, 0.5]);
  assert.ok(warn.mock.calls.length > 0);
});

test('skeleton loader retains valid roles when another association is malformed', async (t) => {
  const warn = t.mock.method(console, 'warn', () => {});
  const { KHRCharacterSkeletonLoaderPlugin } = await import('../src/khr-character/skeleton/KHRCharacterSkeletonLoaderPlugin.ts');
  const node = new Object3D();
  const parser = { json: {
    extensionsUsed: ['KHR_character', 'KHR_character_skeleton_mapping'],
    extensions: { KHR_character: {}, KHR_character_skeleton_mapping: { skeletalRigMappings: {
      vrm1_humanoid: { hips: { node: 0 }, head: null },
    } } }, nodes: [{}],
  }, getDependency: async () => node };
  const mapping = await new KHRCharacterSkeletonLoaderPlugin(parser)._import({ parser });
  assert.equal(mapping.skeletalRigMappings.get('vrm1_humanoid').get('hips'), node);
  assert.equal(mapping.skeletalRigMappings.get('vrm1_humanoid').has('head'), false);
  assert.ok(warn.mock.calls.length > 0);
});

test('node visibility loader skips malformed hints and keeps valid hints', (t) => {
  const warn = t.mock.method(console, 'warn', () => {});
  return import('../src/khr-character/node-visibility-hint/KHRNodeVisibilityHintLoaderPlugin.ts').then(({ KHRNodeVisibilityHintLoaderPlugin }) => {
    const root = new Object3D(), child = new Object3D(); root.add(child);
    const parser = { json: {
      extensionsUsed: ['KHR_node_visibility_hint'], nodes: [
        { extensions: { KHR_node_visibility_hint: { roles: [] } } },
        { extensions: { KHR_node_visibility_hint: { roles: ['third_person'] } } },
      ],
    }, associations: new Map([[root, { nodes: 0 }], [child, { nodes: 1 }]]) };
    const hints = new KHRNodeVisibilityHintLoaderPlugin(parser)._import({ parser, scenes: [root] });
    assert.equal(hints.items.length, 1);
    assert.equal(hints.items[0].node, child);
    assert.ok(warn.mock.calls.length > 0);
  });
});

test('unusable optional mapping is skipped while required mapping can reject', async (t) => {
  const warn = t.mock.method(console, 'warn', () => {});
  const { KHRCharacterExpressionMappingLoaderPlugin } = await import('../src/khr-character/expression-mapping/KHRCharacterExpressionMappingLoaderPlugin.ts');
  const json = {
    extensionsUsed: ['KHR_character', 'KHR_character_expression', 'KHR_character_expression_mapping'],
    extensions: { KHR_character: {}, KHR_character_expression: { expressions: [{ name: 'smile' }] }, KHR_character_expression_mapping: { expressionSetMappings: {} } },
  };
  const gltf = { userData: {} };
  const plugin = new KHRCharacterExpressionMappingLoaderPlugin({ json });
  await assert.doesNotReject(plugin.afterRoot(gltf));
  assert.equal(gltf.userData.khrCharacterExpressionMapping, undefined);
  json.extensionsRequired = ['KHR_character_expression_mapping'];
  await assert.rejects(plugin.afterRoot(gltf), /Required expression mapping/);
  assert.ok(warn.mock.calls.length > 0);
});
