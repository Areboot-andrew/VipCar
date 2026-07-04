import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Fetch all chats and their messages
export async function GET() {
  try {
    getTelegramClient().catch(() => {});

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
      const client = await getTelegramClient();
      if (client) {
        await client.sendMessage(chatRoom.externalId, { message: content });
      }
    } else if (chatRoom.platform === 'MESSENGER' && chatRoom.externalId) {
      // Forward to Facebook Messenger via Graph API
      const tokenSetting = await prisma.siteContent.findUnique({ where: { key: 'facebook_page_token' } });
      if (tokenSetting?.value) {
        await fetch(`https://graph.facebook.com/v20.0/me/messages?access_token=${tokenSetting.value}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipient: { id: chatRoom.externalId },
            message: { text: content },
            messaging_type: 'RESPONSE'
          })
        });
      }
    } else if (chatRoom.platform === 'WHATSAPP' && chatRoom.externalId) {
      const [tokenSetting, phoneIdSetting] = await Promise.all([
        prisma.siteContent.findUnique({ where: { key: 'whatsapp_access_token' } }),
        prisma.siteContent.findUnique({ where: { key: 'whatsapp_phone_number_id' } }),
      ]);
      if (tokenSetting?.value && phoneIdSetting?.value) {
        await fetch(`https://graph.facebook.com/v20.0/${phoneIdSetting.value}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${tokenSetting.value}`,
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: chatRoom.externalId,
            type: 'text',
            text: { body: content },
          }),
        });
      }
    }

    return NextResponse.json(message);
  } catch (error) {
    console.error('Chat POST Error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}

async function getTelegramClient() {
  const { getTelegramClient } = await import('@/lib/telegramClient');
  return getTelegramClient();
}
