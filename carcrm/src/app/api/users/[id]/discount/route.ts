import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const percent = Math.min(90, Math.max(0, Number(body.personalDiscountPercent) || 0));

    const user = await prisma.user.update({
      where: { id },
      data: { personalDiscountPercent: percent },
      select: { id: true, personalDiscountPercent: true },
    });

    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update discount" }, { status: 500 });
  }
}
