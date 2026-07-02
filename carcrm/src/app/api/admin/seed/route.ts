import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const allCars = await prisma.car.findMany({
      orderBy: { createdAt: 'asc' }
    });

    if (allCars.length === 0) {
      return NextResponse.json({ message: 'No cars in database.' });
    }

    const carsToKeep = allCars.slice(0, 6);
    const carsToDelete = allCars.slice(6);

    // 1. Delete excess cars
    if (carsToDelete.length > 0) {
      const idsToDelete = carsToDelete.map(c => c.id);
      
      // Delete associated reviews first
      await prisma.carReview.deleteMany({
        where: { carId: { in: idsToDelete } }
      });
      
      await prisma.car.deleteMany({
        where: { id: { in: idsToDelete } }
      });
    }

    // 2. Add sample media and rich data to the kept cars
    const sampleFeatures = [
      { icon: 'star', text: 'Преміум салон' },
      { icon: 'wifi', text: 'Безкоштовний Wi-Fi' },
      { icon: 'ac_unit', text: 'Клімат контроль' },
      { icon: 'person', text: 'Персональний водій' }
    ];

    const sampleDescription = `
      <p>Відчуйте неперевершений комфорт та статус разом із нашими автомобілями преміум-класу. Цей автомобіль створений для тих, хто цінує свій час та бездоганний сервіс.</p>
      <ul>
        <li><strong>Ідеальний стан:</strong> Автомобіль проходить регулярний технічний огляд.</li>
        <li><strong>Професійний водій:</strong> Ввічливий, пунктуальний та знає найкращі маршрути.</li>
        <li><strong>Комфорт:</strong> Вода, серветки та Wi-Fi завжди в салоні.</li>
      </ul>
      <p>Обирайте найкраще для своїх ділових поїздок чи особливих подій!</p>
    `;

    // Sample beautiful images from Unsplash (generic luxury cars)
    const mockImages = [
      'https://images.unsplash.com/photo-1563720223185-11003d516935?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1605515298946-d062f2e9da53?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=1000&auto=format&fit=crop'
    ];

    for (const car of carsToKeep) {
      await prisma.car.update({
        where: { id: car.id },
        data: {
          description: sampleDescription,
          features: JSON.stringify(sampleFeatures),
          images: car.images.length === 0 ? mockImages : car.images, // Add mock images only if empty
        }
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Kept ${carsToKeep.length} cars. Deleted ${carsToDelete.length} cars. Updated kept cars with mock descriptions, features, and images.`
    });

  } catch (error: any) {
    console.error('Seed Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
