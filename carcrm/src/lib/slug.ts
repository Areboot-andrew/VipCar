export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9а-яіїєґ]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
}

export function carSlug(make: string, model: string, year?: number | string) {
  return slugify([make, model, year].filter(Boolean).join(' '));
}
