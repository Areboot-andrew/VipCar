import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST: Add media to car
export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const { url, mediaType, type, role, title, alt, caption, isCover } = await request.json();
    const resolvedType = type || mediaType || 'image';
    const car = await prisma.car.findFirst({ where: { OR: [{ id: params.id }, { slug: params.id }] }, include: { media: true } });
    if (!car) return NextResponse.json({ error: 'Car not found' }, { status: 404 });

    if (isCover) {
      await prisma.carMedia.updateMany({
        where: { carId: car.id },
        data: { isCover: false },
      });
    }

    const media = await prisma.carMedia.create({
      data: {
        carId: car.id,
        url,
        type: resolvedType,
        role: role || (isCover ? 'cover' : 'gallery'),
        title: title || null,
        alt: alt || `${car.make} ${car.model}`,
        caption: caption || null,
        isCover: Boolean(isCover),
        order: car.media.length,
      },
    });

    if (resolvedType === 'image' && !car.images.includes(url)) {
      await prisma.car.update({
        where: { id: car.id },
        data: { images: { push: url } }
      });
    } else if (resolvedType === 'video' && !car.videos.includes(url)) {
      await prisma.car.update({
        where: { id: car.id },
        data: { videos: { push: url } }
      });
    }

    return NextResponse.json(media);
  } catch (error) {
    console.error('Media add error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function PATCH(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const { items } = await request.json();
    const car = await prisma.car.findFirst({ where: { OR: [{ id: params.id }, { slug: params.id }] } });
    if (!car) return NextResponse.json({ error: 'Car not found' }, { status: 404 });
    if (!Array.isArray(items)) return NextResponse.json({ error: 'Items required' }, { status: 400 });

    const cover = items.find((item: any) => item.isCover);
    await prisma.$transaction([
      ...(cover ? [prisma.carMedia.updateMany({ where: { carId: car.id }, data: { isCover: false } })] : []),
      ...items.map((item: any, index: number) =>
        prisma.carMedia.update({
          where: { id: item.id },
          data: {
            role: item.role || 'gallery',
            title: item.title || null,
            alt: item.alt || null,
            caption: item.caption || null,
            order: Number.isFinite(Number(item.order)) ? Number(item.order) : index,
            isCover: Boolean(item.isCover),
            active: item.active !== false,
          },
        })
      ),
    ]);

    const media = await prisma.carMedia.findMany({ where: { carId: car.id }, orderBy: [{ isCover: 'desc' }, { order: 'asc' }] });
    return NextResponse.json(media);
  } catch (error) {
    console.error('Media update error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

// DELETE: Remove media from car
export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const { url, mediaType, mediaId } = await request.json();
    const car = await prisma.car.findFirst({ where: { OR: [{ id: params.id }, { slug: params.id }] } });
    if (!car) return NextResponse.json({ error: 'Car not found' }, { status: 404 });

    if (mediaId) {
      await prisma.carMedia.deleteMany({ where: { id: mediaId, carId: car.id } });
    } else if (url) {
      await prisma.carMedia.deleteMany({ where: { carId: car.id, url } });
    }

    if (mediaType === 'image') {
      await prisma.car.update({
        where: { id: car.id },
        data: { images: { set: car.images.filter(i => i !== url) } }
      });
    } else if (mediaType === 'video') {
      await prisma.car.update({
        where: { id: car.id },
        data: { videos: { set: car.videos.filter(v => v !== url) } }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Media delete error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
