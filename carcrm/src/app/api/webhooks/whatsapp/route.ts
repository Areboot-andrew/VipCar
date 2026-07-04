import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');
    const [enabledRecord, verifyTokenRecord] = await Promise.all([
      prisma.siteContent.findUnique({ where: { key: 'whatsapp_enabled' } }),
      prisma.siteContent.findUnique({ where: { key: 'whatsapp_verify_token' } }),
    ]);

    if (enabledRecord?.value === 'true' && mode === 'subscribe' && token && token === verifyTokenRecord?.value) {
      return new NextResponse(challenge, { status: 200 });
    }

    return new NextResponse('Forbidden', { status: 403 });
  } catch {
    return new NextResponse('Error', { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const enabledRecord = await prisma.siteContent.findUnique({ where: { key: 'whatsapp_enabled' } });
    if (enabledRecord?.value !== 'true') {
      return new NextResponse('DISABLED', { status: 200 });
    }

    const body = await req.json();
    const entries = Array.isArray(body.entry) ? body.entry : [];

    for (const entry of entries) {
      const changes = Array.isArray(entry.changes) ? entry.changes : [];
      for (const change of changes) {
        const value = change.value || {};
        const contacts = Array.isArray(value.contacts) ? value.contacts : [];
        const messages = Array.isArray(value.messages) ? value.messages : [];

        for (const message of messages) {
          const from = message.from;
          const text = message.text?.body;
          if (!from || !text) continue;

          const contact = contacts.find((item: any) => item.wa_id === from);
          const clientName = contact?.profile?.name || from;

          let chatRoom = await prisma.chatRoom.findFirst({
            where: { platform: 'WHATSAPP', externalId: from },
          });

          if (!chatRoom) {
            chatRoom = await prisma.chatRoom.create({
              data: {
                platform: 'WHATSAPP',
                externalId: from,
                clientName,
                clientPhone: from,
              },
            });
          }

          await prisma.message.create({
            data: {
              chatRoomId: chatRoom.id,
              content: text,
              isFromAdmin: false,
            },
          });

          await prisma.chatRoom.update({
            where: { id: chatRoom.id },
            data: { updatedAt: new Date() },
          });
        }
      }
    }

    return new NextResponse('EVENT_RECEIVED', { status: 200 });
  } catch (error) {
    console.error('WhatsApp Webhook Error:', error);
    return new NextResponse('Error', { status: 500 });
  }
}
