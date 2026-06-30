'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useJsApiLoader, Autocomplete, DirectionsService } from '@react-google-maps/api';

type Car = {
  id: string;
  make: string;
  model: string;
  baseRate: number;
};

const libraries: "places"[] = ["places"];

export default function Calculator({ cars }: { cars: Car[] }) {
  const [distance, setDistance] = useState(100);
  const [selectedCarId, setSelectedCarId] = useState<string>(cars[0]?.id || '');
  const [crossBorder, setCrossBorder] = useState(false);
  const [isWeekend, setIsWeekend] = useState(false);
  const [price, setPrice] = useState(0);

  // Google Maps State
  const [origin, setOrigin] = useState<string>('');
  const [destination, setDestination] = useState<string>('');
  const [directionsResponse, setDirectionsResponse] = useState<google.maps.DirectionsResult | null>(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });

  const originRef = useRef<HTMLInputElement>(null);
  const destinationRef = useRef<HTMLInputElement>(null);

  const calculateRoute = async () => {
    if (!originRef.current?.value || !destinationRef.current?.value) return;
    
    // eslint-disable-next-line no-undef
    const directionsService = new google.maps.DirectionsService();
    try {
      const results = await directionsService.route({
        origin: originRef.current.value,
        destination: destinationRef.current.value,
        // eslint-disable-next-line no-undef
        travelMode: google.maps.TravelMode.DRIVING,
      });
      setDirectionsResponse(results);
      const distMeters = results.routes[0].legs[0].distance?.value || 0;
      setDistance(Math.ceil(distMeters / 1000));
    } catch (error) {
      console.error("Помилка розрахунку маршруту:", error);
    }
  };

  useEffect(() => {
    const selectedCar = cars.find(c => c.id === selectedCarId);
    if (!selectedCar) return;

    // Logic for calculating price
    let currentPrice = distance * selectedCar.baseRate;
    if (crossBorder) currentPrice += 150;
    if (isWeekend) currentPrice *= 1.10;

    setPrice(Math.round(currentPrice));
  }, [distance, selectedCarId, crossBorder, isWeekend, cars]);

  return (
    <section className="max-w-[1280px] mx-auto px-6 md:px-[64px] mb-[80px]" id="calculator">
      <h2 className="font-headline-lg text-[48px] leading-[56px] font-semibold text-[#e4e2e3] mb-[48px] text-center">
        Розрахунок вартості преміум-поїздки
      </h2>
      <div className="glass-panel p-8 md:p-12 rounded-3xl max-w-5xl mx-auto border border-white/10 shadow-2xl relative overflow-hidden flex flex-col gap-12">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#e9c349]/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#e9c349]/5 rounded-full blur-3xl pointer-events-none"></div>
        
        {/* Route Selection and Distance Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
          <div className="space-y-8">
            <h3 className="font-headline-md text-2xl text-[#e4e2e3] flex items-center gap-3">
              <span className="material-symbols-outlined text-[#e9c349]">route</span> Маршрут поїздки
            </h3>
            <div className="space-y-6">
              <div className="relative group">
                <label className="block font-label-caps text-[12px] uppercase text-[#c7c6ca] mb-2 ml-1">Звідки</label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-4 text-[#e9c349]/60">my_location</span>
                  {isLoaded ? (
                    <Autocomplete onPlaceChanged={calculateRoute}>
                      <input ref={originRef} type="text" className="w-full bg-[#353536]/30 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-[#e4e2e3] focus:border-[#e9c349] outline-none" placeholder="Введіть адресу або місто" />
                    </Autocomplete>
                  ) : (
                    <input type="text" className="w-full bg-[#353536]/30 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-[#e4e2e3] focus:border-[#e9c349] outline-none" placeholder="Завантаження карт..." disabled />
                  )}
                </div>
              </div>
              <div className="relative group">
                <label className="block font-label-caps text-[12px] uppercase text-[#c7c6ca] mb-2 ml-1">Куди</label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-4 text-[#e9c349]/60">location_on</span>
                  {isLoaded ? (
                    <Autocomplete onPlaceChanged={calculateRoute}>
                      <input ref={destinationRef} type="text" className="w-full bg-[#353536]/30 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-[#e4e2e3] focus:border-[#e9c349] outline-none" placeholder="Введіть адресу або місто" />
                    </Autocomplete>
                  ) : (
                    <input type="text" className="w-full bg-[#353536]/30 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-[#e4e2e3] focus:border-[#e9c349] outline-none" placeholder="Завантаження карт..." disabled />
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col h-full justify-end">
            <div className="bg-[#e9c349]/5 border border-[#e9c349]/20 rounded-2xl p-8 space-y-6 relative overflow-hidden flex flex-col justify-center h-full">
              <div className="absolute top-0 right-0 p-3">
                <span className="material-symbols-outlined text-[#e9c349]/20 text-5xl">auto_mode</span>
              </div>
              <div className="flex justify-between items-end relative z-10">
                <div>
                  <span className="block font-label-caps text-[10px] text-[#e9c349] uppercase tracking-widest mb-2">Відстань (км)</span>
                  {/* Fallback manual slider if maps fails or API key missing */}
                  <input type="range" min="1" max="2000" value={distance} onChange={(e) => setDistance(Number(e.target.value))} className="w-full mb-2" />
                </div>
                <div className="text-right">
                  <span className="text-4xl font-display-lg text-[#e9c349]" id="distance-display">{distance} км</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Options Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10 border-t border-white/10 pt-8">
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={crossBorder} onChange={(e) => setCrossBorder(e.target.checked)} className="w-5 h-5 rounded border-gray-300 text-[#e9c349] focus:ring-[#e9c349]" />
              <span className="text-[#e4e2e3] font-body-md">Перетин кордону (міжнародний рейс)</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={isWeekend} onChange={(e) => setIsWeekend(e.target.checked)} className="w-5 h-5 rounded border-gray-300 text-[#e9c349] focus:ring-[#e9c349]" />
              <span className="text-[#e4e2e3] font-body-md">Поїздка у вихідний день (+10%)</span>
            </label>
          </div>
        </div>

        {/* Vehicle Selection Row */}
        <div className="space-y-6 relative z-10">
          <h3 className="font-headline-md text-2xl text-[#e4e2e3] flex items-center gap-3">
            <span className="material-symbols-outlined text-[#e9c349]">diamond</span> Клас обслуговування (Авто)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {cars.map(car => (
              <label key={car.id} className="cursor-pointer">
                <input type="radio" name="service_class" value={car.id} checked={selectedCarId === car.id} onChange={() => setSelectedCarId(car.id)} className="peer sr-only" />
                <div className="glass-panel px-6 py-6 rounded-xl border border-white/10 peer-checked:border-[#e9c349] peer-checked:bg-[#e9c349]/10 transition-all flex items-center justify-between h-full">
                  <div className="text-left">
                    <span className="block font-headline-md text-xl mb-1 text-white">{car.make}</span>
                    <span className="text-sm text-[#c7c6ca]">{car.model}</span>
                  </div>
                  <span className={`material-symbols-outlined text-3xl ${selectedCarId === car.id ? 'text-[#e9c349]' : 'text-[#c7c6ca]'}`}>check_circle</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Bottom Row */}
        <div className="pt-8 border-t border-white/10 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 bg-[#353536]/30 p-8 rounded-2xl border border-white/5 backdrop-blur-sm">
            <div className="flex-1 text-center md:text-left">
              <h4 className="font-label-caps text-[12px] text-[#c7c6ca] mb-2 uppercase tracking-widest">Орієнтовна вартість</h4>
              <div className="relative inline-block">
                <div className="text-6xl md:text-7xl font-display-lg text-white tracking-tight drop-shadow-2xl">
                  € {price}
                </div>
              </div>
            </div>
            <div className="w-full md:w-auto">
              <button className="gold-button font-button text-[14px] px-12 py-6 rounded-2xl hover:scale-[0.98] transition-all text-lg shadow-[0_10px_30px_rgba(212,175,55,0.2)] uppercase tracking-wider font-semibold">
                Продовжити бронювання
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
