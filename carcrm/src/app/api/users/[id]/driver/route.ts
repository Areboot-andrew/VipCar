import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";


export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const data: {
      telegramId?: string | null;
      salaryPerKm?: number;
      salaryPerHour?: number;
      dailyAllowance?: number;
      overnightAllowance?: number;
      licenseNum?: string;
      status?: string;
    } = {};

    if (body.telegramId !== undefined) data.telegramId = body.telegramId || null;
    if (body.salaryPerKm !== undefined) data.salaryPerKm = Number(body.salaryPerKm);
    if (body.salaryPerHour !== undefined) data.salaryPerHour = Number(body.salaryPerHour);
    if (body.dailyAllowance !== undefined) data.dailyAllowance = Number(body.dailyAllowance);
    if (body.overnightAllowance !== undefined) data.overnightAllowance = Number(body.overnightAllowance);
    if (body.licenseNum !== undefined) data.licenseNum = String(body.licenseNum || "NEW_DRIVER");
    if (body.status !== undefined) data.status = String(body.status || "ACTIVE");

    const driver = await prisma.driver.upsert({
      where: { userId: id },
      update: data,
      create: {
        userId: id,
        licenseNum: data.licenseNum || "NEW_DRIVER",
        salaryPerKm: data.salaryPerKm ?? 0.15,
        salaryPerHour: data.salaryPerHour ?? 12,
        dailyAllowance: data.dailyAllowance ?? 0,
        overnightAllowance: data.overnightAllowance ?? 90,
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
