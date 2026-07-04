import { NextResponse } from 'next/server';
import { getTelegramClient } from '@/lib/telegramClient';
import { prisma } from "@/lib/prisma";


export async function POST(req: Request) {
  try {
    const { phoneNumber, phoneCodeHash, code, password } = await req.json();
    if (!phoneNumber || !phoneCodeHash || !code) return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });

    const client = await getTelegramClient(true);
    if (!client) return NextResponse.json({ error: 'Client init failed' }, { status: 500 });

    await client.invoke(new (require('telegram/tl/api').Api.auth.SignIn)({
      phoneNumber,
      phoneCodeHash,
      phoneCode: code,
    })).catch(async (err: any) => {
      if (err.message.includes('SESSION_PASSWORD_NEEDED')) {
        if (!password) throw new Error('2FA Password required');
        await client.invoke(new (require('telegram/tl/api').Api.auth.CheckPassword)({
          password: password,
        }));
      } else {
        throw err;
      }
    });

    const sessionString = client.session.save() as unknown as string;

    await prisma.siteContent.upsert({
      where: { key: 'telegram_string_session' },
      update: { value: sessionString },
      create: { key: 'telegram_string_session', value: sessionString }
    });

    // Start background listener
    await getTelegramClient(false);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('VerifyCode Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to verify code' }, { status: 500 });
  }
}
