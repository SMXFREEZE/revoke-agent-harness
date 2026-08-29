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

/** Resolve exact species/aliases or every row belonging to an exact genus. */
export function resolveMicrobeQuery(abundance, value) {
  const parsed = parseMicrobeName(value);
  if (!parsed || !Array.isArray(abundance)) return null;

  const requestedKey = normalizedMicrobeKey(parsed);
  const targetKey = MICROBE_ALIASES.get(requestedKey) ?? requestedKey;
  const targetIsGenus = !targetKey.includes(" ");
  const matches = abundance.filter((entry) => {
    const speciesKey = normalizedMicrobeKey(String(entry?.species ?? ""));
    if (!speciesKey) return false;
    return targetIsGenus
      ? speciesKey.split(" ")[0] === targetKey
      : speciesKey === targetKey;
  });
  if (!matches.length) return null;

  if (!targetIsGenus) {
    return { scope: "species", label: matches[0].species, taxa: [matches[0]] };
  }

  const genus = String(matches[0].species).trim().split(/\s+/)[0];
  return { scope: "genus", label: genus, taxa: matches };
}
