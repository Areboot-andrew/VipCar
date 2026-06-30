import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST: Add media to car
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { url, mediaType } = await request.json();
    const car = await prisma.car.findUnique({ where: { id: params.id } });
    if (!car) return NextResponse.json({ error: 'Car not found' }, { status: 404 });

    if (mediaType === 'image') {
      await prisma.car.update({
        where: { id: params.id },
        data: { images: { push: url } }
      });
    } else if (mediaType === 'video') {
      await prisma.car.update({
        where: { id: params.id },
        data: { videos: { push: url } }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Media add error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

// DELETE: Remove media from car
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { url, mediaType } = await request.json();
    const car = await prisma.car.findUnique({ where: { id: params.id } });
    if (!car) return NextResponse.json({ error: 'Car not found' }, { status: 404 });

    if (mediaType === 'image') {
      await prisma.car.update({
        where: { id: params.id },
        data: { images: { set: car.images.filter(i => i !== url) } }
      });
    } else if (mediaType === 'video') {
      await prisma.car.update({
        where: { id: params.id },
        data: { videos: { set: car.videos.filter(v => v !== url) } }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Media delete error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
