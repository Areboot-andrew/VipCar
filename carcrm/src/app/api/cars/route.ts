import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
import { carSlug } from '@/lib/slug';


export async function GET() {
  try {
    const cars = await prisma.car.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        reviews: true,
        media: { where: { active: true }, orderBy: [{ isCover: 'desc' }, { order: 'asc' }] },
        defaultDriver: { include: { user: true } },
      }
    });
    return NextResponse.json(cars);
  } catch (error) {
    console.error('Error fetching cars:', error);
    return NextResponse.json({ error: 'Failed to fetch cars' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      make, model, year, capacity, luggageCapacity, largeLuggageCapacity, baseRate, fuelType, 
      fuelConsumptionCity, fuelConsumptionHighway, fuelTankVolume, status, 
      comfortClass, bodyType, luggageNote, images, videos, description, features, pageBlocks, baseCity, baseLat, baseLng,
      includedPassengers, pricePerPerson, crossBorderFee, meetAndGreetFee, animalFee, childSeatFee,
      amortizationPerKm, deliveryBaseFee, allowsChildren, allowsAnimals,
      seoTitle, seoDescription, defaultDriverId, slug
    } = body;

    const generatedSlug = slug || carSlug(make, model, year);

    const car = await prisma.car.create({
      data: {
        slug: generatedSlug,
        make,
        model,
        year: parseInt(year),
        capacity: parseInt(capacity),
        luggageCapacity: luggageCapacity ? parseInt(luggageCapacity) : 2,
        largeLuggageCapacity: largeLuggageCapacity ? parseInt(largeLuggageCapacity) : 1,
        baseRate: parseFloat(baseRate),
        fuelType,
        fuelConsumptionCity: parseFloat(fuelConsumptionCity),
        fuelConsumptionHighway: parseFloat(fuelConsumptionHighway),
        fuelTankVolume: fuelTankVolume ? parseFloat(fuelTankVolume) : 60.0,
        comfortClass: comfortClass || 'Premium',
        bodyType: bodyType || null,
        luggageNote: luggageNote || null,
        
        includedPassengers: includedPassengers ? parseInt(includedPassengers) : 1,
        pricePerPerson: pricePerPerson ? parseFloat(pricePerPerson) : 10.0,
        crossBorderFee: crossBorderFee ? parseFloat(crossBorderFee) : 150.0,
        meetAndGreetFee: meetAndGreetFee ? parseFloat(meetAndGreetFee) : 20.0,
        animalFee: animalFee ? parseFloat(animalFee) : 30.0,
        childSeatFee: childSeatFee ? parseFloat(childSeatFee) : 15.0,
        amortizationPerKm: amortizationPerKm ? parseFloat(amortizationPerKm) : 0.08,
        deliveryBaseFee: deliveryBaseFee ? parseFloat(deliveryBaseFee) : 0.0,
        allowsChildren: allowsChildren !== false,
        allowsAnimals: allowsAnimals !== false,
        
        status: status || 'AVAILABLE',
        images: images || [],
        videos: videos || [],
        description: description || null,
        features: features || null,
        pageBlocks: pageBlocks || '[]',
        seoTitle: seoTitle || `${make} ${model} ${year} - VIP transfer`,
        seoDescription: seoDescription || null,
        baseCity: baseCity || 'Львів',
        baseLat: baseLat ? parseFloat(baseLat) : null,
        baseLng: baseLng ? parseFloat(baseLng) : null,
        defaultDriverId: defaultDriverId || null,
      },
      include: { media: true, reviews: true, defaultDriver: { include: { user: true } } },
    });

    return NextResponse.json(car, { status: 201 });
  } catch (error) {
    console.error('Error creating car:', error);
    return NextResponse.json({ error: 'Failed to create car' }, { status: 500 });
  }
}
