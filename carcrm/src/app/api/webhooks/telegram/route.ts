import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { touchChannelEvent } from '@/lib/channelStatus';

// Incoming updates from the Telegram BOT (registered via admin settings -> "Активувати вебхук").
// Bot chats are stored as platform TELEGRAM_BOT and replied to via Bot API,
// unlike MTProto account chats (platform TELEGRAM).
export async function POST(req: Request) {
  try {
    const [tokenRow, secretRow] = await Promise.all([
      prisma.siteContent.findUnique({ where: { key: 'telegram_bot_token' } }),
      prisma.siteContent.findUnique({ where: { key: 'telegram_webhook_secret' } }),
    ]);

    const botToken = tokenRow?.value || process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return NextResponse.json({ ok: true, disabled: true });
    }

    // Verify the secret token we registered with setWebhook
    if (secretRow?.value) {
      const header = req.headers.get('x-telegram-bot-api-secret-token');
      if (header !== secretRow.value) {
        return new NextResponse('Forbidden', { status: 403 });
      }
    }

    const body = await req.json();

    // Check if it's a standard Telegram message
    if (body.message && body.message.text) {
      touchChannelEvent('telegram_last_event_at');
      const chatId = body.message.chat.id.toString();
      const text = body.message.text;
      const firstName = body.message.from?.first_name || 'Anonymous';
      const lastName = body.message.from?.last_name || '';
      const clientName = `${firstName} ${lastName}`.trim();

      // Find or create ChatRoom
      let chatRoom = await prisma.chatRoom.findFirst({
        where: { externalId: chatId, platform: 'TELEGRAM_BOT' }
      });

      if (!chatRoom) {
        chatRoom = await prisma.chatRoom.create({
          data: {
            platform: 'TELEGRAM_BOT',
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

      await prisma.chatRoom.update({
        where: { id: chatRoom.id },
        data: { updatedAt: new Date() }
      });
    }

    // Telegram requires a 200 OK response immediately
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Telegram Webhook Error:', error);
    return NextResponse.json({ ok: true }); // Still return 200 to prevent retries
  }
}
