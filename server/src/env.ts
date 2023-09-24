export function env(prop: string) {
  const value = Bun.env[prop];
  if (value == null) throw new Error(`Missing ENV var: ${prop}`);

  return value;
}