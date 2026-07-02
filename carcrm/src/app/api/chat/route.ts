import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Fetch all chats and their messages
export async function GET() {
  try {
    const chats = await prisma.chatRoom.findMany({
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });
    return NextResponse.json(chats);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch chats' }, { status: 500 });
  }
}

// Send a message from Admin to a Chat
export async function POST(req: Request) {
  try {
    const { chatRoomId, content } = await req.json();

    const chatRoom = await prisma.chatRoom.findUnique({
      where: { id: chatRoomId }
    });

    if (!chatRoom) return NextResponse.json({ error: 'Chat not found' }, { status: 404 });

    // Save to DB
    const message = await prisma.message.create({
      data: {
        chatRoomId,
        content,
        isFromAdmin: true
      }
    });

    // Update ChatRoom timestamp
    await prisma.chatRoom.update({
      where: { id: chatRoomId },
      data: { updatedAt: new Date() }
    });

    // If it's a Telegram chat, forward via MTProto
    if (chatRoom.platform === 'TELEGRAM' && chatRoom.externalId) {
      const { getTelegramClient } = await import('@/lib/telegramClient');
      const client = await getTelegramClient();
      if (client) {
        await client.sendMessage(chatRoom.externalId, { message: content });
      }
    }

    return NextResponse.json(message);
  } catch (error) {
    console.error('Chat POST Error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
