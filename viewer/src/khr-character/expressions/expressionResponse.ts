import * as THREE from 'three';

export interface ExpressionResponse {
  /** Canonical identity of the whole property, including individual morph weights. */
  key: string;
  base: number[];
  neutral: number[];
  component?: number;
  quaternion: boolean;
  sample(time: number): number[];
  write(value: number[]): void;
}

/** The host uses additive scale and ordered quaternion deltas; zero drivers restore authored state. */
export function applyExpressionResponses(entries: { responses: ExpressionResponse[]; time: number; active: boolean }[]): void {
  const aggregates = new Map<string, { response: ExpressionResponse; value: number[] }>();
  // Include inactive targets to clear our previous host-applied result without accumulating state.
  for (const entry of entries) for (const r of entry.responses) {
    if (!aggregates.has(r.key)) aggregates.set(r.key, { response: r, value: [...r.base] });
  }
  for (const entry of entries) {
    if (!entry.active) continue;
    for (const r of entry.responses) {
      const aggregate = aggregates.get(r.key)!;
      const sample = r.sample(entry.time);
      if (r.quaternion) {
        const delta = new THREE.Quaternion().fromArray(r.neutral).invert().multiply(new THREE.Quaternion().fromArray(sample));
        aggregate.value = new THREE.Quaternion().fromArray(aggregate.value).multiply(delta).normalize().toArray();
      } else {
        for (let j = 0; j < sample.length; j++) {
          const k = r.component ?? j;
          aggregate.value[k] += sample[j] - r.neutral[j];
        }
      }
    }
  }
  for (const { response, value } of aggregates.values()) response.write(value);
}

/** Ordinary glTF interpolation, endpoint clamping, and quaternion normalization. */
export function createExpressionSampler(times: number[], values: number[], size: number, interpolation: string, quaternion = false): (time: number) => number[] {
  if (!['LINEAR', 'STEP', 'CUBICSPLINE'].includes(interpolation)) throw new Error(`Unsupported interpolation ${interpolation}`);
  const cubic = interpolation === 'CUBICSPLINE';
  if (values.length !== times.length * size * (cubic ? 3 : 1) || !values.every(Number.isFinite)) throw new Error('Invalid expression output accessor');
  const value = (i: number) => values.slice((i * (cubic ? 3 : 1) + (cubic ? 1 : 0)) * size, (i * (cubic ? 3 : 1) + (cubic ? 1 : 0) + 1) * size);
  const normalized = (v: number[]) => quaternion ? new THREE.Quaternion().fromArray(v).normalize().toArray() : v;
  return (time) => {
    if (time <= times[0]) return normalized(value(0));
    if (time >= times.at(-1)!) return normalized(value(times.length - 1));
    let i = 0;
    while (times[i + 1] <= time) i++;
    const a = value(i), b = value(i + 1), dt = times[i + 1] - times[i], t = (time - times[i]) / dt;
    if (interpolation === 'STEP') return normalized(a);
    if (cubic) return normalized(a.map((x, j) => (2*t*t*t - 3*t*t + 1)*x + (t*t*t - 2*t*t + t)*dt*values[(i*3 + 2)*size+j] + (-2*t*t*t + 3*t*t)*b[j] + (t*t*t-t*t)*dt*values[((i+1)*3)*size+j]));
    if (quaternion) return new THREE.Quaternion().fromArray(a).slerp(new THREE.Quaternion().fromArray(b), t).normalize().toArray();
    return a.map((x, j) => x + (b[j] - x)*t);
  };
}
