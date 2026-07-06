import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { publishPreset, type PostPreset } from '@/lib/socialPublish';

// POST { presetId } — admin publishes one preset right now (manual "Опублікувати зараз").
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { presetId } = await req.json();
    const row = await prisma.siteContent.findUnique({ where: { key: 'marketing_post_presets' } });
    const presets: PostPreset[] = row?.value ? JSON.parse(row.value) : [];
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) return NextResponse.json({ error: 'Пресет не знайдено' }, { status: 404 });

    const result = await publishPreset(preset);
    return NextResponse.json(result);
  } catch (error) {
    console.error('publish error:', error);
    return NextResponse.json({ error: 'Не вдалося опублікувати' }, { status: 500 });
  }
}
