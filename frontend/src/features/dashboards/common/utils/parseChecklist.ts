/**
 * Utility to transform semi-structured text descriptions into arrays for UI checklist rendering.
 * Supports splitting by common delimiters (newlines, commas, bullets) to improve data legibility.
 */
export const parseChecklist = (description: string, maxItems: number) => {
  const raw = String(description ?? '').trim();
  if (!raw) return { items: [] as string[], fallback: '' };

  const parts = raw
    .split(/\n|,|(?:\.\s+)|(?:\.\s*$)/g)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.replace(/^[-•\u2022]+/, '').trim())
    .filter(Boolean);

  // If the text is a single coherent block without clear list delimiters, preserve it as a paragraph
  const unique = Array.from(new Set(parts));
  if (unique.length < 2) return { items: [] as string[], fallback: raw };

  return { items: unique.slice(0, maxItems), fallback: '' };
};
