import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';


export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ canReview: false, reason: 'unauthenticated' });
    }

    const params = await props.params;
    const carId = params.id;
    const userId = (session.user as any).id;

    // Check if the user has a completed booking for this car
    const booking = await prisma.booking.findFirst({
      where: {
        clientId: userId,
        carId: carId,
        status: 'COMPLETED'
      }
    });

    if (booking) {
      return NextResponse.json({ canReview: true });
    } else {
      return NextResponse.json({ canReview: false, reason: 'not_used' });
    }
  } catch (error) {
    console.error('Error checking review eligibility:', error);
    return NextResponse.json({ canReview: false, reason: 'error' }, { status: 500 });
  }
}
