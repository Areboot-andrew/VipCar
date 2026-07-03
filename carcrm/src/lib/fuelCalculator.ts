export type FuelPrice = {
  country: string;
  fuelType: string;
  priceEur: number;
};

export type FuelCalculationParams = {
  totalDistance: number;
  fuelConsumption: number; // L/100km
  fuelTankVolume: number; // L
  fuelType: string;
  routeCountries: string[]; // e.g. ['Україна', 'Польща', 'Німеччина']
  globalFuelPrices: FuelPrice[];
};

export type FuelCalculationResult = {
  totalFuelCostEur: number;
  totalLitersNeeded: number;
  refuels: {
    country: string;
    liters: number;
    pricePerLiter: number;
    costEur: number;
  }[];
};

export function calculateSmartFuelCost(params: FuelCalculationParams): FuelCalculationResult {
  const { totalDistance, fuelConsumption, fuelTankVolume, fuelType, routeCountries, globalFuelPrices } = params;

  // Total fuel needed
  const totalLitersNeeded = (totalDistance / 100) * fuelConsumption;
  
  if (totalLitersNeeded <= 0 || routeCountries.length === 0) {
    return { totalFuelCostEur: 0, totalLitersNeeded: 0, refuels: [] };
  }

  // Filter prices for the route countries and specific fuel type
  const availablePrices = routeCountries
    .map(country => {
      const priceRecord = globalFuelPrices.find(p => p.country === country && p.fuelType === fuelType);
      return {
        country,
        priceEur: priceRecord ? priceRecord.priceEur : 1.6 // fallback to 1.6 if not found
      };
    })
    .sort((a, b) => a.priceEur - b.priceEur); // Sort cheapest first!

  // Safe tank volume (-20% margin)
  const safeTankVolume = fuelTankVolume * 0.8;
  
  let remainingLitersToFill = totalLitersNeeded;
  const refuels = [];
  let totalFuelCostEur = 0;

  for (const priceOption of availablePrices) {
    if (remainingLitersToFill <= 0) break;

    // The maximum we can logically buy in one country for the trip. 
    // Wait, realistically, if we pass through a cheap country, we can buy at most 1 full tank.
    // If it's the ONLY country, we buy everything there.
    // Let's assume you can buy a max of 1 full tank in each transit country, 
    // EXCEPT the origin/longest country where maybe you can buy more?
    // Actually, to keep it simple and favorable as requested: we assume we buy a full tank in the cheapest country.
    // If total distance is huge, maybe they buy multiple tanks. 
    // Let's cap at 1 safe tank per transit country, but the LAST country in the sorted list (most expensive) 
    // takes the rest of the required fuel (meaning they are forced to buy there).
    // Or simpler: just buy 1 full tank in the cheapest, 1 in the next, etc., until filled. 
    // If we run out of countries before filling the quota, the most expensive country covers the rest.
    
    // How much to buy here?
    // If it's the most expensive country in our list, we MUST buy whatever is left here.
    const isMostExpensive = priceOption === availablePrices[availablePrices.length - 1];
    const litersToBuyHere = isMostExpensive 
      ? remainingLitersToFill 
      : Math.min(safeTankVolume, remainingLitersToFill);

    const costHere = litersToBuyHere * priceOption.priceEur;
    
    refuels.push({
      country: priceOption.country,
      liters: litersToBuyHere,
      pricePerLiter: priceOption.priceEur,
      costEur: costHere
    });

    totalFuelCostEur += costHere;
    remainingLitersToFill -= litersToBuyHere;
  }

  return {
    totalFuelCostEur,
    totalLitersNeeded,
    refuels
  };
}
