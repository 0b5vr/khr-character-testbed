/**
 * Clamps a value between 0.0 and 1.0.
 *
 * @param value - The value to clamp.
 * @returns The clamped value.
 */
export function saturate(value: number): number {
  return Math.min(Math.max(value, 0.0), 1.0);
}
