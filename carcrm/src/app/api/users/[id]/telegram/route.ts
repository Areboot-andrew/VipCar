import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";


export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const driver = await prisma.driver.update({
      where: { userId: id },
      data: { telegramId: body.telegramId },
    });

    return NextResponse.json(driver);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update telegram id" }, { status: 500 });
  }
}
