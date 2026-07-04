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

    // Forward to the external messenger and report delivery honestly:
    // deliveryError=true means the message is saved in CRM but did NOT reach the client.
    let deliveryError: string | null = null;

    if (chatRoom.platform === 'TELEGRAM' && chatRoom.externalId) {
      const enabledSetting = await prisma.siteContent.findUnique({ where: { key: 'telegram_enabled' } });
      if (enabledSetting?.value !== 'true') {
        deliveryError = 'Telegram вимкнено в налаштуваннях.';
      } else {
        try {
          const client = await getTelegramClient();
          if (!client) {
            deliveryError = 'Telegram не підключено (немає сесії).';
          } else {
            await client.sendMessage(chatRoom.externalId, { message: content });
          }
        } catch (err) {
          console.error('Telegram send error:', err);
          deliveryError = 'Telegram не зміг надіслати повідомлення.';
        }
      }
    } else if (chatRoom.platform === 'TELEGRAM_BOT' && chatRoom.externalId) {
      // Chats that came through the bot webhook are answered via Bot API
      const tokenRow = await prisma.siteContent.findUnique({ where: { key: 'telegram_bot_token' } });
      const botToken = tokenRow?.value || process.env.TELEGRAM_BOT_TOKEN;
      if (!botToken) {
        deliveryError = 'Не заповнений Bot Token у налаштуваннях.';
      } else {
        const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatRoom.externalId, text: content }),
        });
        if (!res.ok) {
          console.error('Telegram bot send error:', await res.text());
          deliveryError = 'Telegram-бот не зміг надіслати повідомлення.';
        }
      }
    } else if (chatRoom.platform === 'MESSENGER' && chatRoom.externalId) {
      // Forward to Facebook Messenger via Graph API
      const [enabledSetting, tokenSetting] = await Promise.all([
        prisma.siteContent.findUnique({ where: { key: 'facebook_enabled' } }),
        prisma.siteContent.findUnique({ where: { key: 'facebook_page_token' } }),
      ]);
      if (enabledSetting?.value === 'true' && tokenSetting?.value) {
        const res = await fetch(`https://graph.facebook.com/v20.0/me/messages?access_token=${tokenSetting.value}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipient: { id: chatRoom.externalId },
            message: { text: content },
            messaging_type: 'RESPONSE'
          })
        });
        if (!res.ok) {
          console.error('Messenger send error:', await res.text());
          deliveryError = 'Messenger відхилив повідомлення (перевір Page Access Token).';
        }
      } else {
        deliveryError = 'Messenger вимкнено або немає Page Access Token.';
      }
    } else if (chatRoom.platform === 'WHATSAPP' && chatRoom.externalId) {
      const [enabledSetting, tokenSetting, phoneIdSetting] = await Promise.all([
        prisma.siteContent.findUnique({ where: { key: 'whatsapp_enabled' } }),
        prisma.siteContent.findUnique({ where: { key: 'whatsapp_access_token' } }),
        prisma.siteContent.findUnique({ where: { key: 'whatsapp_phone_number_id' } }),
      ]);
      if (enabledSetting?.value === 'true' && tokenSetting?.value && phoneIdSetting?.value) {
        const res = await fetch(`https://graph.facebook.com/v20.0/${phoneIdSetting.value}/messages`, {
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
        if (!res.ok) {
          console.error('WhatsApp send error:', await res.text());
          deliveryError = 'WhatsApp відхилив повідомлення (24-годинне вікно або токен).';
        }
      } else {
        deliveryError = 'WhatsApp вимкнено або не заповнені токен/Phone Number ID.';
      }
    }

    return NextResponse.json({ ...message, deliveryError });
  } catch (error) {
    console.error('Chat POST Error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}

async function getTelegramClient() {
  const { getTelegramClient } = await import('@/lib/telegramClient');
  return getTelegramClient();
}
