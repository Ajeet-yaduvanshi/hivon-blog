/**
 * Generate a URL-friendly slug from a title
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Generate a unique slug by appending a timestamp if needed
 */
export function generateUniqueSlug(title: string): string {
  const base = generateSlug(title);
  const timestamp = Date.now().toString(36);
  return `${base}-${timestamp}`;
}
