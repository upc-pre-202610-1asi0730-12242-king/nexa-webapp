export function formatAddress(...parts) {
  const seen = new Set();

  return parts
    .flatMap(part => String(part || '').split(','))
    .map(part => part.trim())
    .filter(part => {
      if (!part) return false;
      const key = part.toLocaleLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .join(', ');
}
