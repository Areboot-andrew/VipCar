import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const AUTO_EMPTY_PREFIX = 'auto-empty-';

function isAuto(id: string) {
  return id.startsWith(AUTO_EMPTY_PREFIX);
}

// PATCH: edit a manual promotion, or store an override for an auto Empty Leg.
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (isAuto(id)) {
      const bookingId = id.slice(AUTO_EMPTY_PREFIX.length);
      const discount = body.discount === '' || body.discount == null ? null : Number(body.discount);
      const active = typeof body.active === 'boolean' ? body.active : undefined;
      const override = await prisma.emptyLegOverride.upsert({
        where: { bookingId },
        update: {
          ...(body.discount !== undefined ? { discount } : {}),
          ...(active !== undefined ? { active } : {}),
        },
        create: {
          bookingId,
          discount,
          active: active ?? true,
        },
      });
      return NextResponse.json(override);
    }

    const data: Record<string, unknown> = {};
    if (body.title !== undefined) data.title = body.title;
    if (body.routeFrom !== undefined) data.routeFrom = body.routeFrom;
    if (body.routeTo !== undefined) data.routeTo = body.routeTo;
    if (body.discount !== undefined) data.discount = Number(body.discount);
    if (body.carId !== undefined) data.carId = body.carId || null;
    if (body.dateStart !== undefined) data.dateStart = body.dateStart ? new Date(body.dateStart) : null;
    if (typeof body.active === 'boolean') data.active = body.active;

    const promo = await prisma.promotion.update({ where: { id }, data });
    return NextResponse.json(promo);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

// DELETE: remove a manual promotion, or hide an auto Empty Leg via an override.
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    if (isAuto(id)) {
      const bookingId = id.slice(AUTO_EMPTY_PREFIX.length);
      await prisma.emptyLegOverride.upsert({
        where: { bookingId },
        update: { active: false },
        create: { bookingId, active: false },
      });
      return NextResponse.json({ hidden: true });
    }

    await prisma.promotion.delete({ where: { id } });
    return NextResponse.json({ deleted: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
