import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Sleep utility to respect Nominatim API rate limits (1 req/sec)
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function geocode(city: string) {
  if (!city) return null;
  await sleep(1000); // Nominatim requirement
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}&limit=1`;
    const res = await fetch(url, { headers: { 'User-Agent': 'CarCRM-App/1.0' } });
    const data = await res.json();
    if (data && data.length > 0) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch (e) {
    console.error(`Geocode error for ${city}:`, e);
  }
  return null;
}

async function getDistance(lat1: number, lng1: number, lat2: number, lng2: number) {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${lng1},${lat1};${lng2},${lat2}?overview=false`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.routes && data.routes.length > 0) {
      return Math.ceil(data.routes[0].distance / 1000);
    }
  } catch (e) {
    console.error('OSRM distance error:', e);
  }
  return 0;
}

/**
 * Recalculates the route chain for a specific car.
 * It orders all bookings chronologically and updates `carStartLocation`,
 * `expenseDeliveryDistance`, `totalExpenseDistance` and recalculates `driverSalary`.
 */
export async function recalculateChain(carId: string) {
  console.log(`Recalculating chain for car: ${carId}`);
  
  const bookings = await prisma.booking.findMany({
    where: { carId, status: { notIn: ['CANCELLED'] } },
    orderBy: { dateStart: 'asc' },
    include: { car: true, driver: true }
  });
  
  if (!bookings.length) return;
  
  // Start from car's base city, or fallback to Lviv
  let currentLoc = bookings[0].car.baseCity || "Львів";
  let previousEndDate = new Date(0); // Epoch

  for (const b of bookings) {
    // If the gap between previous booking and this one is more than 24 hours,
    // we assume the car returned to base.
    const gapHours = (b.dateStart.getTime() - previousEndDate.getTime()) / (1000 * 60 * 60);
    if (gapHours > 24) {
      currentLoc = b.car.baseCity || "Львів";
    }

    let expenseDeliveryDistance = 0;
    
    // Only calculate if the cities differ to save API calls
    if (currentLoc.toLowerCase().trim() !== b.routeFrom.toLowerCase().trim()) {
       const loc1 = await geocode(currentLoc);
       const loc2 = await geocode(b.routeFrom);
       
       if (loc1 && loc2) {
         expenseDeliveryDistance = await getDistance(loc1.lat, loc1.lng, loc2.lat, loc2.lng);
         expenseDeliveryDistance = Math.ceil(expenseDeliveryDistance * 1.3); // Road factor roughly
       }
    }
    
    const totalExpenseDistance = expenseDeliveryDistance + b.distance;
    
    let newDriverSalary = b.driverSalary;
    if (b.driverId && b.driver) {
       newDriverSalary = totalExpenseDistance * b.driver.salaryPerKm;
    } else {
       // Just update to default estimate if no driver assigned
       newDriverSalary = totalExpenseDistance * 0.15;
    }
    
    await prisma.booking.update({
      where: { id: b.id },
      data: {
         carStartLocation: currentLoc,
         expenseDeliveryDistance,
         totalExpenseDistance,
         driverSalary: newDriverSalary
      }
    });
    
    // Move the car to the dropoff location
    currentLoc = b.routeTo;
    previousEndDate = b.dateEnd;
  }
  
  console.log(`Chain recalculated for car ${carId}.`);
}
