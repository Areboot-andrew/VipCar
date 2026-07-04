import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { notifyAdminTelegram } from '@/lib/telegramNotify';

export async function POST(request: Request) {
  try {
    const { name, phone, email, message } = await request.json();

    const feedback = await prisma.feedback.create({
      data: { name, phone, email, message }
    });

    // Сповіщення адміну в Telegram (токен і chat id — з налаштувань CRM, env як fallback)
    notifyAdminTelegram(
      `Нове запитання з сайту (Форма зв'язку)!\n\nІм'я: ${name}\nТелефон: ${phone}\nEmail: ${email}\nПовідомлення: ${message}`
    ).catch(() => {});

    return NextResponse.json(feedback);
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const messages = await prisma.feedback.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(messages);
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
