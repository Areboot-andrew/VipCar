import { NextResponse } from "next/server";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

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
          data: { userId: id, salaryRate: 50.0 } // default rate
        });
      }
    }

    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update role" }, { status: 500 });
  }
}
