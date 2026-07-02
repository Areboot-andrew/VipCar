import { NextResponse } from 'next/server';
import { getTelegramClient } from '@/lib/telegramClient';

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

    return NextResponse.json({ phoneCodeHash: result.phoneCodeHash });
  } catch (error: any) {
    console.error('SendCode Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to send code' }, { status: 500 });
  }
}
