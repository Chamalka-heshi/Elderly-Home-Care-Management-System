export const parseChecklist = (description: string, maxItems: number) => {
  const raw = String(description ?? '').trim();
  if (!raw) return { items: [] as string[], fallback: '' };

  // Split by newlines, commas, or sentence-like periods.
  const parts = raw
    .split(/\n|,|(?:\.\s+)|(?:\.\s*$)/g)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.replace(/^[-•\u2022]+/, '').trim())
    .filter(Boolean);

  // If it doesn't meaningfully split, treat it as a paragraph fallback.
  const unique = Array.from(new Set(parts));
  if (unique.length < 2) return { items: [] as string[], fallback: raw };

  return { items: unique.slice(0, maxItems), fallback: '' };
};

