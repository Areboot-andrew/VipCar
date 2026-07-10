// Runs once when the Next.js server boots (nodejs runtime only).
// Keeps the messenger integrations alive without any external process:
//  - Telegram MTProto listener starts immediately and is re-checked every
//    minute (auto-reconnect if the long-lived connection drops).
//  - Social autoposting runs on an internal timer, so it works even without
//    an external cron pinging /api/marketing/run.
// (Facebook/WhatsApp/Telegram-bot are webhooks — always-on while the server is up.)

declare global {
  var __tgKeepAlive: ReturnType<typeof setInterval> | undefined;
  var __mktScheduler: ReturnType<typeof setInterval> | undefined;
}

export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  try {
    const { getTelegramClient } = await import('./lib/telegramClient');

    // Initial connect
    getTelegramClient().catch((err) => console.error('Telegram bootstrap failed:', err));

    // Keepalive: reconnect the MTProto listener if it dropped (runs once per process)
    if (!global.__tgKeepAlive) {
      global.__tgKeepAlive = setInterval(() => {
        getTelegramClient().catch(() => {});
      }, 60_000);
    }
  } catch (err) {
    console.error('Instrumentation (telegram) error:', err);
  }

  // Internal autoposting scheduler — no external cron needed.
  // runScheduledPosts() is a no-op unless the schedule is enabled and a
  // channel is configured, and it dedups by date|preset|slot, so it is safe
  // to run every few minutes.
  if (!global.__mktScheduler) {
    global.__mktScheduler = setInterval(async () => {
      try {
        const { runScheduledPosts } = await import('./lib/socialPublish');
        await runScheduledPosts();
      } catch (err) {
        console.error('Autoposting tick failed:', err);
      }
    }, 5 * 60_000);
  }
}
