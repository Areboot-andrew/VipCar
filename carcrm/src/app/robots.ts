import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

async function siteUrl() {
  try {
    const row = await prisma.siteContent.findUnique({ where: { key: 'site_url' } });
    return (row?.value || 'https://first-line-transfer.com').replace(/\/+$/, '');
  } catch {
    return 'https://first-line-transfer.com';
  }
}

export default async function robots(): Promise<MetadataRoute.Robots> {
  const base = await siteUrl();
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Private/authenticated areas must stay out of search
      disallow: ['/admin', '/driver', '/profile', '/api', '/login', '/register', '/invoice'],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
