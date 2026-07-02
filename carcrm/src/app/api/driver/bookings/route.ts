import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { driver: true }
    });

    if (!user || !user.driver) {
      return NextResponse.json({ error: "Not a driver" }, { status: 403 });
    }

    const driverId = user.driver.id;

    const bookings = await prisma.booking.findMany({
      where: { driverId },
      include: { car: true, client: true },
      orderBy: { dateStart: "asc" }
    });

    const totalEarned = bookings
      .filter(b => b.status === "COMPLETED")
      .reduce((acc, b) => acc + (b.distance + (b.deliveryDistance || 0)) * user.driver!.salaryPerKm, 0);

    const stats = {
      total: bookings.length,
      completed: bookings.filter(b => b.status === "COMPLETED").length,
      salaryPerKm: user.driver.salaryPerKm,
      totalEarned
    };

    return NextResponse.json({ bookings, stats, user });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch driver bookings" }, { status: 500 });
  }
}
