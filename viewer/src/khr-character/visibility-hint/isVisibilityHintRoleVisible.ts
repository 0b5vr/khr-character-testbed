/** The viewer recognizes first/third-person roles; callers may supply several applicable roles. */
export function isVisibilityHintRoleVisible(roles: readonly string[], view: string | ReadonlySet<string>): boolean {
  const applicable = typeof view === 'string'
    ? new Set([view === 'first_person' ? 'first_person' : 'third_person']) : view;
  const recognized = roles.filter(role => role === 'always' || role === 'first_person' || role === 'third_person');
  return recognized.length === 0 || recognized.some(role => role === 'always' || applicable.has(role));
}

export function validateVisibilityRoles(roles: unknown): asserts roles is string[] {
  if (!Array.isArray(roles) || !roles.length || roles.some(r => typeof r !== 'string' || !r.length) || new Set(roles).size !== roles.length) {
    throw new Error('Visibility roles must be a nonempty array of distinct nonempty strings');
  }
}
