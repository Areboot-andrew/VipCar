import { prisma } from './prisma';

type ChannelKey = 'telegram_last_event_at' | 'messenger_last_event_at' | 'whatsapp_last_event_at';

// Marks a messenger channel as alive: stores the timestamp of the last incoming event.
// Shown in admin settings so the admin can see the integration actually works.
export function touchChannelEvent(key: ChannelKey) {
  const value = new Date().toISOString();
  return prisma.siteContent
    .upsert({ where: { key }, update: { value }, create: { key, value } })
    .catch((err) => console.error(`channel status update failed (${key}):`, err));
}
