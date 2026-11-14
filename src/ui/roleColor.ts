// Presentation-only remap of role colours (src/state/roles.ts is not a UI file): the v1.2 palette has no cyan.
const REMAP: Record<string, string> = { '#3DD6F5': '#CBD5E1' };

export function roleColor(c: string): string {
  return REMAP[c.toUpperCase()] ?? c;
}
