import type { GLTF, GLTFLoaderPlugin, GLTFParser } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { KHRCharacterExpressionMapping as MappingSchema } from '../../../../schematypes/KHRCharacterExpressionMapping.ts';
import { KHRCharacterExpressionMapping } from './KHRCharacterExpressionMapping.ts';

export class KHRCharacterExpressionMappingLoaderPlugin implements GLTFLoaderPlugin {
  readonly name = 'KHR_character_expression_mapping';
  readonly parser: GLTFParser;
  constructor(parser: GLTFParser) { this.parser = parser; }
  async afterRoot(gltf: GLTF): Promise<void> {
    const json = this.parser.json;
    if (!json.extensionsUsed?.includes(this.name)) return;
    for (const dependency of ['KHR_character', 'KHR_character_expression', this.name]) {
      if (!json.extensionsUsed.includes(dependency) || !json.extensions?.[dependency]) throw new Error(`Missing ${dependency} dependency`);
    }
    const definition = json.extensions[this.name] as MappingSchema;
    const names = json.extensions.KHR_character_expression.expressions.map((entry: { name: string }) => entry.name);
    gltf.userData.khrCharacterExpressionMapping = new KHRCharacterExpressionMapping(definition, names);
  }
}
