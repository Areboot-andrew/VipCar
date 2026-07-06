import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let base = 'https://first-line-transfer.com';
  let cars: { slug: string | null; id: string; updatedAt: Date }[] = [];

  try {
    const [urlRow, carRows] = await Promise.all([
      prisma.siteContent.findUnique({ where: { key: 'site_url' } }),
      prisma.car.findMany({ where: { status: 'AVAILABLE' }, select: { slug: true, id: true, updatedAt: true } }),
    ]);
    base = (urlRow?.value || base).replace(/\/+$/, '');
    cars = carRows;
  } catch {
    // DB unavailable at build time — return the static pages only
  }

  const now = new Date();
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${base}/gallery`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
  ];

  const carPages: MetadataRoute.Sitemap = cars.map((car) => ({
    url: `${base}/cars/${car.slug || car.id}`,
    lastModified: car.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  return [...staticPages, ...carPages];
}
