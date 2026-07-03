import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const data: {
      telegramId?: string | null;
      salaryPerKm?: number;
      licenseNum?: string;
      status?: string;
    } = {};

    if (body.telegramId !== undefined) data.telegramId = body.telegramId || null;
    if (body.salaryPerKm !== undefined) data.salaryPerKm = Number(body.salaryPerKm);
    if (body.licenseNum !== undefined) data.licenseNum = String(body.licenseNum || "NEW_DRIVER");
    if (body.status !== undefined) data.status = String(body.status || "ACTIVE");

    const driver = await prisma.driver.upsert({
      where: { userId: id },
      update: data,
      create: {
        userId: id,
        licenseNum: data.licenseNum || "NEW_DRIVER",
        salaryPerKm: data.salaryPerKm ?? 0.15,
        telegramId: data.telegramId,
        status: data.status || "ACTIVE",
      },
    });

    return NextResponse.json(driver);
  } catch (error) {
    console.error("Failed to update driver:", error);
    return NextResponse.json({ error: "Failed to update driver" }, { status: 500 });
  }
}
