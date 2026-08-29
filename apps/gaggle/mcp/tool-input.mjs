export const MAX_MICROBE_NAME_LENGTH = 120;

const MICROBE_ALIASES = new Map([
  ["e coli", "escherichia coli"],
]);

function normalizedMicrobeKey(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function parseMicrobeName(value) {
  if (typeof value !== "string") return null;
  const name = value.trim();
  if (!name || name.length > MAX_MICROBE_NAME_LENGTH) return null;
  return name;
}

/** Resolve only exact species, exact genera, and explicit unambiguous aliases. */
export function findMicrobeMatch(abundance, value) {
  const parsed = parseMicrobeName(value);
  if (!parsed || !Array.isArray(abundance)) return null;

  const requestedKey = normalizedMicrobeKey(parsed);
  const targetKey = MICROBE_ALIASES.get(requestedKey) ?? requestedKey;
  const targetIsGenus = !targetKey.includes(" ");

  return abundance.find((entry) => {
    const speciesKey = normalizedMicrobeKey(String(entry?.species ?? ""));
    if (!speciesKey) return false;
    if (speciesKey === targetKey) return true;
    return targetIsGenus && speciesKey.split(" ")[0] === targetKey;
  }) ?? null;
}
