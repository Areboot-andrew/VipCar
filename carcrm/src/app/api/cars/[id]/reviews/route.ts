import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }

    const params = await props.params;
    const body = await request.json();
    const { author, rating, text } = body;
    const userRole = (session.user as any).role;
    const userId = (session.user as any).id;

    if (userRole !== 'ADMIN') {
      // Check if client has a completed booking for this car
      const booking = await prisma.booking.findFirst({
        where: {
          clientId: userId,
          carId: params.id,
          status: 'COMPLETED'
        }
      });

      if (!booking) {
        return NextResponse.json({ error: 'You must complete a booking to leave a review.' }, { status: 403 });
      }
    }

    const review = await prisma.carReview.create({
      data: {
        carId: params.id,
        author: userRole === 'ADMIN' ? author : (session.user.name || author),
        rating: parseInt(rating),
        text,
      }
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const params = await props.params;
    const body = await request.json();
    const { reviewId } = body;

    await prisma.carReview.delete({
      where: { id: reviewId, carId: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting review:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
