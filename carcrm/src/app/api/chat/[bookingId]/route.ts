import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Chat room for a booking always carries the client's name/phone,
// so the admin sees who they are talking to instead of "Анонім".
async function ensureBookingChatRoom(bookingId: string) {
  const existing = await prisma.chatRoom.findUnique({ where: { bookingId } });
  if (existing) return existing;
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { client: { select: { name: true, phone: true } } },
  });
  return prisma.chatRoom.create({
    data: {
      bookingId,
      platform: 'WEB',
      clientName: booking?.client?.name || null,
      clientPhone: booking?.client?.phone || null,
    },
  });
}

export async function GET(request: Request, { params }: { params: Promise<{ bookingId: string }> }) {
  try {
    const { bookingId } = await params;
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const chatRoom = await ensureBookingChatRoom(bookingId);

    const messages = await prisma.message.findMany({
      where: { chatRoomId: chatRoom.id },
      include: {
        sender: {
          select: { id: true, name: true, role: true }
        }
      },
      orderBy: { createdAt: "asc" }
    });

    return NextResponse.json(messages);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ bookingId: string }> }) {
  try {
    const { bookingId } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const body = await request.json();
    const { content, imageUrl } = body;

    const chatRoom = await ensureBookingChatRoom(bookingId);

    const message = await prisma.message.create({
      data: {
        chatRoomId: chatRoom.id,
        senderId: user.id,
        content: content || null,
        imageUrl: imageUrl || null,
      },
      include: {
        sender: {
          select: { id: true, name: true, role: true }
        }
      }
    });

    await prisma.chatRoom.update({ where: { id: chatRoom.id }, data: { updatedAt: new Date() } });

    return NextResponse.json(message);
  } catch (error) {
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
