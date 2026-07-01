import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const prisma = new PrismaClient();

export async function GET(request: Request, { params }: { params: Promise<{ bookingId: string }> }) {
  try {
    const { bookingId } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ensure chat room exists for this booking
    let chatRoom = await prisma.chatRoom.findUnique({
      where: { bookingId }
    });

    if (!chatRoom) {
      chatRoom = await prisma.chatRoom.create({
        data: { bookingId }
      });
    }

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

    let chatRoom = await prisma.chatRoom.findUnique({
      where: { bookingId }
    });

    if (!chatRoom) {
      chatRoom = await prisma.chatRoom.create({
        data: { bookingId }
      });
    }

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

    return NextResponse.json(message);
  } catch (error) {
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
