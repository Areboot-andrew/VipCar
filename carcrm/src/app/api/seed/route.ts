import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
import bcrypt from 'bcryptjs';


export async function GET() {
  try {
    // 1. Create or Update SiteSettings
    await prisma.siteSettings.upsert({
      where: { id: 'global' },
      update: { fuelPricePetrol: 1.6, fuelPriceDiesel: 1.5, exchangeRate: 42.5 },
      create: { id: 'global', fuelPricePetrol: 1.6, fuelPriceDiesel: 1.5, exchangeRate: 42.5 }
    });

    // 2. Create a Dummy Driver User and Driver Profile
    let driverUser = await prisma.user.findUnique({ where: { email: 'driver@firstline.com' } });
    if (!driverUser) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      driverUser = await prisma.user.create({
        data: {
          name: 'Олег (Водій VIP)',
          email: 'driver@firstline.com',
          password: hashedPassword,
          role: 'DRIVER'
        }
      });
    }

    let driver = await prisma.driver.findUnique({ where: { userId: driverUser.id } });
    if (!driver) {
      driver = await prisma.driver.create({
        data: {
          userId: driverUser.id,
          licenseNum: 'VAI-123456',
          status: 'ACTIVE',
          salaryPerKm: 0.15,
          bonuses: JSON.stringify([{ type: 'NIGHT_SHIFT', amount: 50 }])
        }
      });
    }

    // 3. Update existing Cars with default coefficients
    await prisma.car.updateMany({
      data: {
        pricePerPerson: 10.0,
        crossBorderFee: 150.0,
        meetAndGreetFee: 20.0,
        animalFee: 30.0,
        childSeatFee: 15.0
      }
    });

    // 4. Create a dummy Empty Leg Promotion if cars exist
    const firstCar = await prisma.car.findFirst();
    if (firstCar) {
      const existingPromo = await prisma.promotion.findFirst({ where: { title: 'Порожній рейс до Львова' } });
      if (!existingPromo) {
        await prisma.promotion.create({
          data: {
            title: 'Порожній рейс до Львова',
            carId: firstCar.id,
            routeFrom: 'Варшава',
            routeTo: 'Львів',
            dateStart: new Date(Date.now() + 86400000 * 3), // 3 days from now
            discount: 30,
            active: true
          }
        });
      }
    }

    return NextResponse.json({ success: true, message: 'Database seeded successfully with new architecture!' });
  } catch (error) {
    console.error('Seeding error:', error);
    return NextResponse.json({ error: 'Failed to seed DB', details: error }, { status: 500 });
  }
}
