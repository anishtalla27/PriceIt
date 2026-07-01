export const PRODUCT_NAME_MAX_LENGTH = 40;

export function normalizeProductName(name: string): string {
  return name.replace(/\s+/g, " ").trim();
}

export function limitProductName(name: string): string {
  const normalized = normalizeProductName(name);
  if (normalized.length <= PRODUCT_NAME_MAX_LENGTH) return normalized;

  const wordBoundary = normalized.lastIndexOf(" ", PRODUCT_NAME_MAX_LENGTH - 3);
  const cutAt = wordBoundary >= 20 ? wordBoundary : PRODUCT_NAME_MAX_LENGTH - 3;
  return `${normalized.slice(0, cutAt).trim()}...`;
}
