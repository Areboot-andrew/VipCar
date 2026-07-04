import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// POST { origin } — registers /api/webhooks/telegram as the bot webhook.
// A secret token is generated and verified on every incoming update.
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const origin = String(body.origin || '').replace(/\/+$/, '');
    if (!origin.startsWith('https://')) {
      return NextResponse.json({ error: 'Потрібен публічний https-домен. Telegram не приймає http або localhost.' }, { status: 400 });
    }

    const tokenRow = await prisma.siteContent.findUnique({ where: { key: 'telegram_bot_token' } });
    const botToken = tokenRow?.value || process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return NextResponse.json({ error: 'Спочатку збережи Bot Token у налаштуваннях.' }, { status: 400 });
    }

    const secret = randomUUID().replace(/-/g, '');
    const webhookUrl = `${origin}/api/webhooks/telegram`;

    const res = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: webhookUrl,
        secret_token: secret,
        allowed_updates: ['message'],
      }),
    });
    const data = await res.json();
    if (!data.ok) {
      return NextResponse.json({ error: `Telegram відхилив вебхук: ${data.description || 'невідома помилка'}` }, { status: 400 });
    }

    await prisma.siteContent.upsert({
      where: { key: 'telegram_webhook_secret' },
      update: { value: secret },
      create: { key: 'telegram_webhook_secret', value: secret },
    });

    return NextResponse.json({ ok: true, webhookUrl });
  } catch (error) {
    console.error('set-webhook error:', error);
    return NextResponse.json({ error: 'Не вдалося активувати вебхук.' }, { status: 500 });
  }
}
