import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";


export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Ensure role is a valid enum value
    const newRole = body.role as Role;

    const user = await prisma.user.update({
      where: { id },
      data: { role: newRole },
    });

    if (newRole === "DRIVER") {
      // Check if driver record exists
      const existingDriver = await prisma.driver.findUnique({
        where: { userId: id }
      });
      
      if (!existingDriver) {
        await prisma.driver.create({
          data: { userId: id, salaryPerKm: 0.15, salaryPerHour: 12, licenseNum: 'NEW_DRIVER' } // default
        });
      }
    }

    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update role" }, { status: 500 });
  }
}
