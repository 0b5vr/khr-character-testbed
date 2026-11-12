import type { GLTF, GLTFLoaderPlugin, GLTFParser } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { KHRCharacterExpressionMapping as MappingSchema } from '../../../../schematypes/KHRCharacterExpressionMapping.ts';
import { KHRCharacterExpressionMapping } from './KHRCharacterExpressionMapping.ts';

export class KHRCharacterExpressionMappingLoaderPlugin implements GLTFLoaderPlugin {
  readonly name = 'KHR_character_expression_mapping';
  readonly parser: GLTFParser;
  constructor(parser: GLTFParser) { this.parser = parser; }
  async afterRoot(gltf: GLTF): Promise<void> {
    const json = this.parser.json;
    const required = json.extensionsRequired?.includes(this.name);
    if (!json.extensionsUsed?.includes(this.name) && !required) return;
    for (const dependency of ['KHR_character', 'KHR_character_expression', this.name]) {
      if (!json.extensionsUsed?.includes(dependency) || !json.extensions?.[dependency]) console.warn(`Missing ${dependency} dependency`);
    }
    const definition = json.extensions?.[this.name] as MappingSchema | undefined;
    const expressions = json.extensions?.KHR_character_expression?.expressions;
    if (!definition || typeof definition !== 'object' || Array.isArray(definition) || !Array.isArray(expressions) || !expressions.length) {
      console.warn('Invalid expression mapping or missing native expressions. Skipping mapping.');
      if (required) throw new Error('Required expression mapping is unavailable');
      return;
    }
    const names = expressions.map((entry: { name?: unknown } | null) => {
      if (!entry || typeof entry.name !== 'string' || !entry.name.length) {
        console.warn('Invalid native expression name. Skipping mappings to this entry.');
        return '';
      }
      return entry.name;
    });
    const mapping = new KHRCharacterExpressionMapping(definition, names);
    if (!Object.keys(mapping.mappingSets).length) {
      console.warn('No usable expression mappings. Skipping mapping.');
      if (required) throw new Error('Required expression mapping is unavailable');
      return;
    }
    gltf.userData.khrCharacterExpressionMapping = mapping;
  }
}
