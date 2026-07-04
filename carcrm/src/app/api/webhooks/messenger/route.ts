import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Meta Webhook Verification
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    const [enabledRecord, verifyTokenRecord] = await Promise.all([
      prisma.siteContent.findUnique({ where: { key: 'facebook_enabled' } }),
      prisma.siteContent.findUnique({ where: { key: 'facebook_verify_token' } }),
    ]);
    const VERIFY_TOKEN = verifyTokenRecord?.value;

    if (mode && token) {
      if (enabledRecord?.value === 'true' && mode === 'subscribe' && token === VERIFY_TOKEN) {
        return new NextResponse(challenge, { status: 200 });
      } else {
        return new NextResponse('Forbidden', { status: 403 });
      }
    }
    return new NextResponse('Bad Request', { status: 400 });
  } catch (error) {
    return new NextResponse('Error', { status: 500 });
  }
}

// Receive messages from Facebook Messenger
export async function POST(req: Request) {
  try {
    const enabledRecord = await prisma.siteContent.findUnique({ where: { key: 'facebook_enabled' } });
    if (enabledRecord?.value !== 'true') {
      return new NextResponse('DISABLED', { status: 200 });
    }

    const body = await req.json();

    if (body.object === 'page') {
      for (const entry of body.entry) {
        for (const webhook_event of entry.messaging) {
          const senderPsid = webhook_event.sender.id; // External ID
          
          if (webhook_event.message && !webhook_event.message.is_echo) {
            const text = webhook_event.message.text;

            // Find or create ChatRoom
            let chatRoom = await prisma.chatRoom.findFirst({
              where: { externalId: senderPsid, platform: 'MESSENGER' }
            });

            if (!chatRoom) {
              // Try to fetch user profile from FB Graph API if we have page token
              let clientName = 'Facebook Client';
              const pageTokenRecord = await prisma.siteContent.findUnique({ where: { key: 'facebook_page_token' } });
              if (pageTokenRecord?.value) {
                try {
                  const fbRes = await fetch(`https://graph.facebook.com/${senderPsid}?fields=first_name,last_name&access_token=${pageTokenRecord.value}`);
                  const fbData = await fbRes.json();
                  if (fbData.first_name) clientName = `${fbData.first_name} ${fbData.last_name || ''}`.trim();
                } catch(e) {}
              }

              chatRoom = await prisma.chatRoom.create({
                data: {
                  platform: 'MESSENGER',
                  externalId: senderPsid,
                  clientName: clientName
                }
              });
            }

            // Save incoming message
            if (text) {
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
          }
        }
      }
      return new NextResponse('EVENT_RECEIVED', { status: 200 });
    } else {
      return new NextResponse('Not Found', { status: 404 });
    }
  } catch (error) {
    console.error('FB Webhook Error:', error);
    return new NextResponse('Error', { status: 500 });
  }
}
