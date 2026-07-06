import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { runScheduledPosts } from '@/lib/socialPublish';

// Cron entrypoint. Protect with ?key=<marketing_cron_secret>.
// Point an external scheduler (e.g. cron-job.org, Coolify cron) at this URL
// every ~15 min; it posts at most one due preset per call.
async function handle(req: Request) {
  const url = new URL(req.url);
  const key = url.searchParams.get('key');
  const row = await prisma.siteContent.findUnique({ where: { key: 'marketing_cron_secret' } });
  const secret = row?.value || '';

  if (!secret) {
    return NextResponse.json({ error: 'Спочатку задай секрет автопостингу в Маркетингу.' }, { status: 400 });
  }
  if (key !== secret) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const result = await runScheduledPosts();
  return NextResponse.json(result);
}

export async function GET(req: Request) {
  return handle(req);
}

export async function POST(req: Request) {
  return handle(req);
}
