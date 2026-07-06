import { NextResponse } from 'next/server';
import { getTelegramClient } from '@/lib/telegramClient';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { phoneNumber } = await req.json();
    if (!phoneNumber) return NextResponse.json({ error: 'Phone required' }, { status: 400 });

    const client = await getTelegramClient(true);
    if (!client) return NextResponse.json({ error: 'Client init failed' }, { status: 500 });

    const result = await client.sendCode(
      {
        apiId: client.apiId,
        apiHash: client.apiHash,
      },
      phoneNumber
    );

    // Persist the connection's session (auth key) so verifyCode continues the
    // SAME connection — otherwise the phoneCodeHash is invalid on a fresh client.
    try {
      const partialSession = String(client.session.save());
      if (partialSession) {
        await prisma.siteContent.upsert({
          where: { key: 'telegram_string_session' },
          update: { value: partialSession },
          create: { key: 'telegram_string_session', value: partialSession },
        });
      }
    } catch (e) {
      console.error('Failed to persist Telegram pre-auth session:', e);
    }

    return NextResponse.json({ phoneCodeHash: result.phoneCodeHash });
  } catch (error: any) {
    console.error('SendCode Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to send code' }, { status: 500 });
  }
}
