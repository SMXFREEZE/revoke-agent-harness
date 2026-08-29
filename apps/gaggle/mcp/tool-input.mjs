export const MAX_MICROBE_NAME_LENGTH = 120;

export function parseMicrobeName(value) {
  if (typeof value !== "string") return null;
  const name = value.trim();
  if (!name || name.length > MAX_MICROBE_NAME_LENGTH) return null;
  return name;
}
