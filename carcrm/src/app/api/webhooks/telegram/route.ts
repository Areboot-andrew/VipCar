import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// This endpoint receives messages from Telegram
export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Check if it's a standard Telegram message
    if (body.message && body.message.text) {
      const chatId = body.message.chat.id.toString();
      const text = body.message.text;
      const firstName = body.message.from?.first_name || 'Anonymous';
      const lastName = body.message.from?.last_name || '';
      const clientName = `${firstName} ${lastName}`.trim();

      // Find or create ChatRoom
      let chatRoom = await prisma.chatRoom.findFirst({
        where: { externalId: chatId, platform: 'TELEGRAM' }
      });

      if (!chatRoom) {
        chatRoom = await prisma.chatRoom.create({
          data: {
            platform: 'TELEGRAM',
            externalId: chatId,
            clientName: clientName
          }
        });
      }

      // Save incoming message
      await prisma.message.create({
        data: {
          chatRoomId: chatRoom.id,
          content: text,
          isFromAdmin: false
        }
      });
    }

    // Telegram requires a 200 OK response immediately
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Telegram Webhook Error:', error);
    return NextResponse.json({ ok: true }); // Still return 200 to prevent retries
  }
}
