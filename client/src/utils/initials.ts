/** First letter of first name + first letter of last name (or first + last char if one word). */
export function nameInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '?';
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  if (trimmed.length === 1) return trimmed[0].toUpperCase();
  return (trimmed[0] + trimmed[trimmed.length - 1]).toUpperCase();
}
