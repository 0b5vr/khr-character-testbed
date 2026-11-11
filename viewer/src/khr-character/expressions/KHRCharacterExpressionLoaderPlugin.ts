import * as THREE from 'three';
import type { GLTF, GLTFLoaderPlugin, GLTFParser } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { GLTF as Schema } from '@gltf-transform/core';
import type { KHRCharacterExpression as ExpressionSchema } from '../../../../schematypes/KHRCharacterExpression.ts';
import type { KHRCharacterExpressionSuppression } from '../../../../schematypes/KHRCharacterExpressionSuppression.ts';
import { KHRCharacterExpressionManager } from './KHRCharacterExpressionManager.ts';
import { KHRCharacterExpression } from './KHRCharacterExpression.ts';
import { createExpressionSampler, type ExpressionResponse } from './expressionResponse.ts';
import { getExpressionTarget, validateKHRCharacterExpressionChannelTargets } from './validateKHRCharacterExpressionChannelTargets.ts';

const textureSlots: Record<string, string> = {
  'pbrMetallicRoughness/baseColorTexture': 'map', 'pbrMetallicRoughness/metallicRoughnessTexture': 'metalnessMap',
  normalTexture: 'normalMap', occlusionTexture: 'aoMap', emissiveTexture: 'emissiveMap',
  'extensions/KHR_materials_clearcoat/clearcoatTexture': 'clearcoatMap',
  'extensions/KHR_materials_clearcoat/clearcoatRoughnessTexture': 'clearcoatRoughnessMap',
  'extensions/KHR_materials_clearcoat/clearcoatNormalTexture': 'clearcoatNormalMap',
  'extensions/KHR_materials_transmission/transmissionTexture': 'transmissionMap',
  'extensions/KHR_materials_volume/thicknessTexture': 'thicknessMap',
  'extensions/KHR_materials_sheen/sheenColorTexture': 'sheenColorMap',
  'extensions/KHR_materials_sheen/sheenRoughnessTexture': 'sheenRoughnessMap',
  'extensions/KHR_materials_specular/specularTexture': 'specularIntensityMap',
  'extensions/KHR_materials_specular/specularColorTexture': 'specularColorMap',
  'extensions/KHR_materials_iridescence/iridescenceTexture': 'iridescenceMap',
  'extensions/KHR_materials_iridescence/iridescenceThicknessTexture': 'iridescenceThicknessMap',
  'extensions/KHR_materials_anisotropy/anisotropyTexture': 'anisotropyMap',
};

export class KHRCharacterExpressionLoaderPlugin implements GLTFLoaderPlugin {
  private readonly _textures = new Map<string, THREE.Texture>();
  public readonly parser: GLTFParser;
  public get name(): string { return 'KHR_character_expression'; }
  constructor(parser: GLTFParser) { this.parser = parser; }
  async afterRoot(gltf: GLTF): Promise<void> { gltf.userData.khrCharacterExpressionManager = await this._import(gltf); }

  async _import(gltf: GLTF): Promise<KHRCharacterExpressionManager | null> {
    const json = this.parser.json as Schema.IGLTF;
    if (!json.extensionsUsed?.includes(this.name)) return null;
    const extension = json.extensions?.[this.name] as ExpressionSchema | undefined;
    if (!extension?.expressions?.length || !json.extensions?.KHR_character || !json.extensionsUsed.includes('KHR_character')) throw new Error('Missing character/expression dependency');
    const names = extension.expressions.map((e) => e.name);
    if (names.some((name) => typeof name !== 'string' || !name.length) || new Set(names).size !== names.length) throw new Error('Expression names must be nonempty and unique');
    const manager = new KHRCharacterExpressionManager(gltf);
    for (const entry of extension.expressions) {
      const listed = validateKHRCharacterExpressionChannelTargets(entry, json);
      const animation = json.animations![entry.animation];
      const expression = new KHRCharacterExpression(entry.name);
      const curves = new Map<number, { times: number[]; sampler: Schema.IAnimationSampler }>();
      // Every referenced sampler contributes to duration, including unsupported/unlisted channels.
      for (const channel of animation.channels) {
        const sampler = animation.samplers[channel.sampler];
        if (!sampler) throw new Error('Missing expression sampler');
        if (!curves.has(channel.sampler)) {
          const definition = json.accessors?.[sampler.input];
          const accessor = await this.parser.getDependency('accessor', sampler.input) as THREE.BufferAttribute;
          const times = Array.from({ length: accessor.count }, (_, i) => accessor.getX(i));
          if (definition?.type !== 'SCALAR' || definition.componentType !== 5126 || !definition.min || !definition.max || times.length < 2 || times.some((t, i) => !Number.isFinite(t) || t < 0 || (i > 0 && t <= times[i - 1]))) throw new Error('Invalid decoded expression input times');
          expression.duration = Math.max(expression.duration, times.at(-1)!);
          curves.set(channel.sampler, { times, sampler });
        }
      }
      for (const i of listed) {
        const channel = animation.channels[i];
        const pointer = (channel.target.path as string) === 'pointer';
        if (pointer && !json.extensionsUsed.includes('KHR_animation_pointer')) throw new Error('Undeclared KHR_animation_pointer');
        const binding = await this._binding(getExpressionTarget(channel.target), json);
        if (!binding) continue; // A material extension on the target path is unsupported.
        const { times, sampler } = curves.get(channel.sampler)!;
        const output = await this.parser.getDependency('accessor', sampler.output) as THREE.BufferAttribute;
        const size = binding.component == null ? binding.base.length : 1;
        const definition = json.accessors?.[sampler.output];
        const morph = /\/weights(?:\/\d+)?$/.test(getExpressionTarget(channel.target));
        if (definition?.componentType !== 5126 || definition.type !== (morph || size === 1 ? 'SCALAR' : `VEC${size}`)) throw new Error('Invalid expression output accessor type');
        const values: number[] = [];
        for (let j = 0; j < output.count; j++) for (let k = 0; k < output.itemSize; k++) values.push(output.getComponent(j, k));
        if (binding.quaternion) {
          const cubic = sampler.interpolation === 'CUBICSPLINE';
          for (let key = 0; key < times.length; key++) {
            const start = (key * (cubic ? 3 : 1) + (cubic ? 1 : 0)) * 4;
            const length = Math.hypot(...values.slice(start, start + 4));
            if (Math.abs(length - 1) > 1e-4) throw new Error('Invalid non-unit quaternion key');
          }
        }
        const sample = createExpressionSampler(times, values, size, sampler.interpolation ?? 'LINEAR', binding.quaternion);
        expression.responses.push({ ...binding, sample, neutral: sample(0) });
      }
      const suppression = entry.extensions?.KHR_character_expression_suppression as KHRCharacterExpressionSuppression | undefined;
      if (suppression) {
        if (!json.extensionsUsed.includes('KHR_character_expression_suppression') || !suppression.suppressions?.length) throw new Error('Invalid suppression declaration');
        expression.suppressions = suppression.suppressions.map((rule) => {
          if (!Number.isInteger(rule.target) || !names[rule.target]) throw new Error('Invalid suppression target');
          for (const v of [rule.amount, rule.threshold]) if (v != null && (!Number.isFinite(v) || v < 0 || v > 1)) throw new Error('Invalid suppression parameter');
          if (rule.type != null && rule.type !== 'blend' && rule.type !== 'block' && !/^[A-Z0-9]+_[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/.test(rule.type)) throw new Error('Invalid custom suppression type');
          return { target: names[rule.target], type: rule.type, amount: rule.amount, threshold: rule.threshold };
        });
      }
      manager.registerExpression(expression);
    }
    return manager;
  }

  private async _binding(path: string, json: Schema.IGLTF): Promise<Omit<ExpressionResponse, 'sample' | 'neutral'> | null> {
    const nodeTarget = /^\/nodes\/(\d+)\/(translation|rotation|scale|weights)(?:\/(\d+))?$/.exec(path);
    if (nodeTarget) {
      const index = Number(nodeTarget[1]), prop = nodeTarget[2], def = json.nodes![index];
      const object = await this.parser.getDependency('node', index) as THREE.Object3D;
      const component = nodeTarget[3] == null ? undefined : Number(nodeTarget[3]);
      if (prop === 'weights') {
        const mesh = json.meshes![def.mesh!], count = mesh.primitives[0].targets!.length;
        const base = [...(def.weights ?? mesh.weights ?? new Array(count).fill(0))];
        const meshes: THREE.Mesh[] = [];
        const visit = (o: THREE.Object3D) => {
          const association = this.parser.associations.get(o);
          if (o !== object && association?.nodes != null && association.nodes !== index) return;
          if ((o as THREE.Mesh).morphTargetInfluences) meshes.push(o as THREE.Mesh);
          for (const child of o.children) visit(child);
        };
        visit(object);
        return { key: `/nodes/${index}/weights`, base, component, quaternion: false, write: (v) => { for (const m of meshes) m.morphTargetInfluences!.splice(0, count, ...v); } };
      }
      const defaults = prop === 'rotation' ? [0, 0, 0, 1] : prop === 'scale' ? [1, 1, 1] : [0, 0, 0];
      const base = [...(def[prop as 'translation' | 'rotation' | 'scale'] ?? defaults)];
      const value = prop === 'rotation' ? object.quaternion : prop === 'scale' ? object.scale : object.position;
      return { key: `/nodes/${index}/${prop}`, base, quaternion: prop === 'rotation', write: (v) => { value.fromArray(v); } };
    }
    const textureTarget = /^\/materials\/(\d+)\/(.+)\/extensions\/KHR_texture_transform\/(offset|scale|rotation)$/.exec(path);
    if (!textureTarget) return null;
    const [, materialIndex, slot, prop] = textureTarget;
    const materialExtension = /^extensions\/([^/]+)\//.exec(slot)?.[1];
    if (materialExtension && !json.extensionsUsed?.includes(materialExtension)) throw new Error(`Undeclared material extension ${materialExtension}`);
    const textureSlot = textureSlots[slot];
    if (!textureSlot) return null;
    if (!json.extensionsUsed?.includes('KHR_texture_transform')) throw new Error('Undeclared KHR_texture_transform');
    const material = await this.parser.getDependency('material', Number(materialIndex));
    const textureInfoPath = path.slice(0, path.lastIndexOf('/'));
    let texture = this._textures.get(textureInfoPath);
    if (!texture) {
      const source = material[textureSlot] as THREE.Texture | undefined;
      if (!source) throw new Error(`Cannot resolve supported texture target ${path}`);
      // Distinct authored textureInfo objects remain distinct mutable targets even
      // when GLTFLoader deduplicates their equal texture transforms.
      texture = source.clone();
      const variants = new Set<any>([material]);
      for (const [candidate, association] of this.parser.associations) {
        if (association.materials === Number(materialIndex)) variants.add(candidate);
      }
      for (const variant of variants) {
        variant[textureSlot] = texture;
        if (slot === 'pbrMetallicRoughness/metallicRoughnessTexture') variant.roughnessMap = texture;
      }
      this._textures.set(textureInfoPath, texture);
    }
    const authored: any = slot.split('/').reduce((o: any, key) => o?.[key], json.materials![Number(materialIndex)]);
    const transform = authored.extensions.KHR_texture_transform;
    const base: number[] = prop === 'rotation' ? [transform.rotation ?? 0] : [...(transform[prop] ?? (prop === 'scale' ? [1, 1] : [0, 0]))];
    return { key: path, base, quaternion: false, write: (v) => {
      if (prop === 'rotation') texture.rotation = v[0];
      else (prop === 'scale' ? texture.repeat : texture.offset).fromArray(v);
      texture.updateMatrix();
    } };
  }
}
