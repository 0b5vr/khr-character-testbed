export function isVisibilityHintRoleVisible(role: string, view: string): boolean {
  if (role === 'first_person') {
    return view === 'first_person';
  }

  if (role === 'third_person') {
    return view !== 'first_person';
  }

  // `always` and unrecognized custom roles are always visible
  return true;
}
