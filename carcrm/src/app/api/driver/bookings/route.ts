import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";


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
      where: { driverId, status: { not: 'CANCELLED' } },
      include: {
        car: { select: { make: true, model: true, plateNumber: true } },
        client: { select: { name: true, phone: true } },
        invoice: { select: { paidAmount: true } },
      },
      orderBy: { dateStart: "asc" }
    });

    // Driver's pay for a trip = the salary already computed on the booking
    // (km + hours + overnight). Fall back to km-rate only for legacy rows.
    const payFor = (b: (typeof bookings)[number]) =>
      b.driverSalary != null
        ? Number(b.driverSalary)
        : (b.distance + (b.deliveryDistance || 0)) * user.driver!.salaryPerKm;

    const completed = bookings.filter((b) => b.status === "COMPLETED");
    const upcoming = bookings.filter((b) => b.status === "PENDING" || b.status === "CONFIRMED");

    const stats = {
      total: bookings.length,
      completed: completed.length,
      upcoming: upcoming.length,
      salaryPerKm: user.driver.salaryPerKm,
      totalEarned: completed.reduce((acc, b) => acc + payFor(b), 0),
      pendingEarnings: upcoming.reduce((acc, b) => acc + payFor(b), 0),
    };

    // Enrich each booking with the driver's pay and how much to collect from the client
    const enriched = bookings.map((b) => ({
      ...b,
      driverPay: Math.round(payFor(b)),
      collectFromClient: Math.max(0, Math.round(Number(b.price || 0) - Number(b.invoice?.paidAmount || 0))),
    }));

    // Never expose the password hash / internal fields to the client
    const safeUser = { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role };

    return NextResponse.json({ bookings: enriched, stats, user: safeUser });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch driver bookings" }, { status: 500 });
  }
}
