/**
 * Set of common stop words to filter out from keyword extraction
 */
export const STOP_WORDS = new Set([
  "a",
  "about",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "how",
  "in",
  "is",
  "it",
  "of",
  "on",
  "or",
  "that",
  "the",
  "this",
  "to",
  "was",
  "what",
  "when",
  "where",
  "who",
  "will",
  "with",
  "i",
  "your",
  "you",
  "can",
  "find",
  "my",
  "any",
  "just",
  "some",
]);

/**
 * Extracts keywords from a given text string
 * @param text - The input text to extract keywords from
 * @returns Array of unique keywords (lowercase, filtered)
 */
export const extractKeywords = (text: string): string[] => {
  const words = text
    .toLowerCase()
    .replace(/[^\w\s#]/g, "") // Allow '#' for existing tags
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word));

  return [...new Set(words)]; // Return unique keywords
};
