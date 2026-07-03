/**
 * Linguistic interceptor: "IN namesto AMPAK".
 * Detects the forbidden word "ampak" (any case) as a standalone word.
 */

// Word-boundary regex, case-insensitive, unicode aware.
const AMPAK_REGEX = /\bampak\b/iu;

export function containsAmpak(text: string): boolean {
  return AMPAK_REGEX.test(text);
}

/** Returns text with every "ampak" swapped for "in", preserving simple casing. */
export function fixAmpak(text: string): string {
  return text.replace(/\bampak\b/giu, (match) => {
    if (match === match.toUpperCase()) return "IN";
    if (match[0] === match[0].toUpperCase()) return "In";
    return "in";
  });
}
