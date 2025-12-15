// @ts-types="npm:@types/three@0.181.0"
import { Matrix4, Quaternion, Vector3 } from 'npm:three@0.181.2';
import type { Bone } from './Bone.ts';
import type { GLTF } from 'npm:@gltf-transform/core@4.2.1';
import { logVerbose } from './logVerbose.ts';

function extractTRSFromNode(node: GLTF.INode): [
  translation: Vector3,
  rotation: Quaternion,
  scale: Vector3,
] {
  const translation = new Vector3();
  const rotation = new Quaternion();
  const scale = new Vector3(1, 1, 1);

  if (node.matrix != null) {
    const m = new Matrix4().fromArray(node.matrix);
    m.decompose(translation, rotation, scale);
    return [translation, rotation, scale];
  }

  if (node.translation != null) { translation.fromArray(node.translation); }
  if (node.rotation != null) { rotation.fromArray(node.rotation); }
  if (node.scale != null) { scale.fromArray(node.scale); }

  return [translation, rotation, scale];
}

function appendGLTFBone(gltf: GLTF.IGLTF, index: number, parentBone: Bone | null, map: Record<number, Bone>): void {
  if (map[index] != null) {
    throw new Error(`Node #${index} is revisited while building skeleton`);
  }

  const node = gltf.nodes?.[index];
  if (node == null) {
    throw new Error(`Node #${index} is missing`);
  }

  const [ position, rotation, scale ] = extractTRSFromNode(node);
  const bone: Bone = {
    gltfIndex: index,
    name: node.name ?? `node_${index}`,
    position,
    rotation,
    scale,
    worldPosition: parentBone?.worldPosition.clone().add(position.clone().applyQuaternion(parentBone?.rotation)) ?? position.clone(),
    worldRotation: parentBone?.worldRotation.clone().multiply(rotation) ?? rotation.clone(),
    worldScale: parentBone?.worldScale.clone().multiply(scale) ?? scale.clone(),
  };
  map[index] = bone;
  logVerbose(`Collected node #${index} (${bone.name})`);

  for (const childIndex of node.children ?? []) {
    appendGLTFBone(gltf, childIndex, bone, map);
  }
}

export function collectNodeBoneMap(gltf: GLTF.IGLTF): Record<number, Bone> {
  logVerbose('Collecting rest pose');

  const scenes = gltf.scenes;
  const scene = scenes?.[gltf.scene ?? 0];
  const rootNodeIndices = scene?.nodes;
  if (rootNodeIndices == null) {
    throw new Error('Given glTF does not have a default scene with root nodes');
  }

  const map: Record<number, Bone> = {};

  for (const rootNodeIndex of rootNodeIndices) {
    const rootNode = gltf.nodes?.[rootNodeIndex];
    if (rootNode == null) {
      throw new Error(`Node #${rootNodeIndex} is missing`);
    }

    appendGLTFBone(gltf, rootNodeIndex, null, map);
  }

  return map;
}
