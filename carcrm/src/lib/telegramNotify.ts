import { prisma } from './prisma';

// Sends a notification to the admin's Telegram via Bot API.
// Token and chat id are managed in admin settings (SiteContent), with env vars as fallback.
export async function notifyAdminTelegram(text: string): Promise<boolean> {
  try {
    const rows = await prisma.siteContent.findMany({
      where: { key: { in: ['telegram_bot_token', 'telegram_admin_chat_id'] } },
    });
    const map = Object.fromEntries(rows.map((row) => [row.key, row.value]));
    const botToken = map.telegram_bot_token || process.env.TELEGRAM_BOT_TOKEN;
    const chatId = map.telegram_admin_chat_id || process.env.TELEGRAM_CHAT_ID;
    if (!botToken || !chatId) return false;

    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
    if (!res.ok) {
      console.error('Telegram notify failed:', await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error('Telegram notify error:', err);
    return false;
  }
}
