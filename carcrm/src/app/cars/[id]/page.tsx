import type { Metadata } from 'next';
import { prisma } from "@/lib/prisma";
import CarDetailsClient from './CarDetailsClient';

export const dynamic = 'force-dynamic';

async function getCar(id: string) {
  try {
    return await prisma.car.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      include: {
        media: { where: { active: true }, orderBy: [{ isCover: 'desc' }, { order: 'asc' }] },
        reviews: true,
      },
    });
  } catch {
    return null;
  }
}

export async function generateMetadata(props: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const params = await props.params;
  const car = await getCar(params.id);

  if (!car) {
    return {
      title: 'Автомобіль не знайдено',
    };
  }

  const cover = car.media.find((item) => item.isCover) || car.media[0];
  const title = car.seoTitle || `${car.make} ${car.model} ${car.year} - VIP трансфер`;
  const description = car.seoDescription || `${car.make} ${car.model}: ${car.capacity} місць, ${car.luggageCapacity} валіз, ${car.fuelType}. Преміальний трансфер з водієм.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      images: cover?.url ? [{ url: cover.url, alt: cover.alt || `${car.make} ${car.model}` }] : undefined,
    },
  };
}

export default async function CarDetailsPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const car = await getCar(params.id);

  return (
    <>
      {car && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Car',
              name: `${car.make} ${car.model}`,
              brand: car.make,
              model: car.model,
              vehicleModelDate: car.year,
              seatingCapacity: car.capacity,
              fuelType: car.fuelType,
              image: car.media.map((item) => item.url),
              description: car.seoDescription || car.description?.replace(/<[^>]+>/g, ''),
            }),
          }}
        />
      )}
      <CarDetailsClient />
    </>
  );
}
