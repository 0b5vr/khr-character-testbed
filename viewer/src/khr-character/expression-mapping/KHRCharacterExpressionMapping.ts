import type { KHRCharacterExpressionMapping as MappingSchema } from '../../../../schematypes/KHRCharacterExpressionMapping.ts';

/** External inputs -> native drivers. Host chooses a set and arbitrates other driver sources. */
export class KHRCharacterExpressionMapping {
  public readonly mappingSets: MappingSchema['expressionSetMappings'];
  public readonly nativeNames: readonly string[];

  constructor(definition: MappingSchema, nativeNames: readonly string[]) {
    this.mappingSets = Object.create(null);
    this.nativeNames = [...nativeNames];
    const sets = definition?.expressionSetMappings;
    if (!sets || typeof sets !== 'object' || Array.isArray(sets) || !Object.keys(sets).length) {
      console.warn('Expression mapping sets must not be empty');
      return;
    }
    for (const [id, set] of Object.entries(sets)) {
      if (!id.length || !set || typeof set !== 'object' || Array.isArray(set) || !Object.keys(set).length) {
        console.warn('Invalid expression mapping set. Skipping.');
        continue;
      }
      const validSet: MappingSchema['expressionSetMappings'][string] = Object.create(null);
      for (const [key, contributions] of Object.entries(set)) {
        if (!key.length || !Array.isArray(contributions) || !contributions.length) {
          console.warn('Invalid expression mapping input. Skipping.');
          continue;
        }
        const validEntries = contributions.filter(entry => {
          if (!entry || typeof entry !== 'object' || !Number.isInteger(entry.source) || entry.source < 0 || entry.source >= nativeNames.length || !nativeNames[entry.source] || !Number.isFinite(entry.weight) || entry.weight < 0 || entry.weight > 1) {
            console.warn('Invalid expression mapping source or weight. Skipping.');
            return false;
          }
          return true;
        });
        if (validEntries.length) validSet[key] = structuredClone(validEntries);
      }
      if (Object.keys(validSet).length) this.mappingSets[id] = validSet;
    }
  }

  public evaluate(setId: string, inputs: Readonly<Record<string, number>>): number[] {
    const output = this.nativeNames.map(() => 0);
    if (!Object.hasOwn(this.mappingSets, setId)) {
      console.warn(`Unknown expression mapping set: ${setId}. Ignoring inputs.`);
      return output;
    }
    if (!inputs || typeof inputs !== 'object' || Array.isArray(inputs)) {
      console.warn('Invalid expression inputs. Ignoring inputs.');
      return output;
    }
    const set = this.mappingSets[setId];
    for (const [key, contributions] of Object.entries(set)) {
      const input = Object.hasOwn(inputs, key) ? inputs[key] : 0;
      if (!Number.isFinite(input)) {
        console.warn(`Expression input "${key}" must be finite. Ignoring input.`);
        continue;
      }
      const value = Math.min(1, Math.max(0, input));
      for (const entry of contributions) output[entry.source] += value * entry.weight;
    }
    return output.map(value => Math.min(1, value));
  }
}
