/**
 * Retrieves a nested value from an object using slash-separated path segments.
 *
 * @param obj Root object
 * @param path Slash-separated property path
 * @returns The found value, or `undefined` if any segment is missing
 */
export function dig<T = unknown>(obj: unknown, path: string): T | undefined {
  const parts = path.split('/');
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') {
      return undefined;
    }

    const record = current as Record<string, unknown>;
    current = record[part];
  }
  return current as T | undefined;
}
