import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { NewMessage } from 'telegram/events';
import { prisma } from './prisma';

// Hardcoded default API keys for testing if user doesn't have them
// Usually these should be obtained from my.telegram.org
const DEFAULT_API_ID = 2040;
const DEFAULT_API_HASH = 'b18441a1ff607e10a989891a5462e627';

// Global singleton to preserve client across hot-reloads in dev
declare global {
  var tgClient: TelegramClient | undefined;
}

export const getTelegramClient = async (forceReconnect = false): Promise<TelegramClient | null> => {
  if (!forceReconnect && global.tgClient && global.tgClient.connected) {
    return global.tgClient;
  }

  try {
    // Get session and keys from DB
    const sessionRecord = await prisma.siteContent.findUnique({ where: { key: 'telegram_string_session' } });
    const apiIdRecord = await prisma.siteContent.findUnique({ where: { key: 'telegram_api_id' } });
    const apiHashRecord = await prisma.siteContent.findUnique({ where: { key: 'telegram_api_hash' } });

    const sessionString = sessionRecord?.value || '';
    const apiId = apiIdRecord?.value ? parseInt(apiIdRecord.value) : DEFAULT_API_ID;
    const apiHash = apiHashRecord?.value || DEFAULT_API_HASH;

    const stringSession = new StringSession(sessionString);
    
    const client = new TelegramClient(stringSession, apiId, apiHash, {
      connectionRetries: 5,
    });

    if (sessionString) {
      await client.connect();
      
      // Add event listener for incoming messages
      client.addEventHandler(async (event: any) => {
        const message = event.message;
        if (!message || message.out) return; // Ignore our own messages

        // We only care about private chats for this CRM (or all if user wants)
        if (message.isPrivate) {
          const chatId = message.peerId.userId.toString();
          const text = message.text;
          const sender = await message.getSender();
          const clientName = sender ? `${sender.firstName || ''} ${sender.lastName || ''}`.trim() : 'Anonymous';
          
          let chatRoom = await prisma.chatRoom.findFirst({
            where: { externalId: chatId, platform: 'TELEGRAM' }
          });

          if (!chatRoom) {
            chatRoom = await prisma.chatRoom.create({
              data: {
                platform: 'TELEGRAM',
                externalId: chatId,
                clientName: clientName || 'New Client'
              }
            });
          }

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
      }, new NewMessage({}));

      global.tgClient = client;
      console.log('Telegram MTProto connected successfully.');
      return client;
    } else {
      // Return unconnected client for auth flow
      return client;
    }
  } catch (err) {
    console.error('Failed to initialize Telegram client:', err);
    return null;
  }
};
