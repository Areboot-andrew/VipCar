// Runs once when the Next.js server boots.
// Starts the Telegram MTProto listener immediately, so incoming client
// messages are captured even before anyone opens the admin chat page.
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      const { getTelegramClient } = await import('./lib/telegramClient');
      getTelegramClient().catch((err) => console.error('Telegram bootstrap failed:', err));
    } catch (err) {
      console.error('Instrumentation error:', err);
    }
  }
}
