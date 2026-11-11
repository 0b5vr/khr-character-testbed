import type { KHRCharacterExpressionMapping as MappingSchema } from '../../../../schematypes/KHRCharacterExpressionMapping.ts';

/** External inputs -> native drivers. Host chooses a set and arbitrates other driver sources. */
export class KHRCharacterExpressionMapping {
  public readonly mappingSets: MappingSchema['expressionSetMappings'];
  public readonly nativeNames: readonly string[];

  constructor(definition: MappingSchema, nativeNames: readonly string[]) {
    this.mappingSets = structuredClone(definition.expressionSetMappings);
    this.nativeNames = [...nativeNames];
    const entries = Object.entries(this.mappingSets);
    if (!entries.length) throw new Error('Expression mapping sets must not be empty');
    for (const [id, set] of entries) {
      if (!id.length || !Object.keys(set).length) throw new Error('Invalid expression mapping set');
      for (const [key, contributions] of Object.entries(set)) {
        if (!key.length || !Array.isArray(contributions) || !contributions.length) throw new Error('Invalid expression mapping input');
        for (const entry of contributions) {
          if (!Number.isInteger(entry.source) || entry.source < 0 || entry.source >= nativeNames.length || !Number.isFinite(entry.weight) || entry.weight < 0 || entry.weight > 1) {
            throw new Error('Invalid expression mapping source or weight');
          }
        }
      }
    }
  }

  public evaluate(setId: string, inputs: Readonly<Record<string, number>>): number[] {
    const set = this.mappingSets[setId];
    if (!Object.hasOwn(this.mappingSets, setId)) throw new Error(`Unknown expression mapping set: ${setId}`);
    for (const value of Object.values(inputs)) if (!Number.isFinite(value)) throw new Error('Expression inputs must be finite');
    const output = this.nativeNames.map(() => 0);
    for (const [key, contributions] of Object.entries(set)) {
      const value = Object.hasOwn(inputs, key) ? Math.min(1, Math.max(0, inputs[key])) : 0;
      for (const entry of contributions) output[entry.source] += value * entry.weight;
    }
    return output.map(value => Math.min(1, value));
  }
}
