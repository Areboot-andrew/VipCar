'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import DatePicker from 'react-datepicker';

const MapDisplay = dynamic(() => import('./MapDisplay'), { ssr: false });
import 'react-datepicker/dist/react-datepicker.css';

type Car = { 
  id: string; 
  make: string; 
  model: string; 
  baseRate: number;
  fuelType: string;
  fuelConsumptionCity: number;
  fuelConsumptionHighway: number;
  capacity: number;
};


export default function Calculator({ cars, cmsSettings }: { cars: Car[], cmsSettings?: Record<string, string> }) {
  const [distance, setDistance] = useState(100);
  const [distanceCity, setDistanceCity] = useState(50);
  const [distanceHighway, setDistanceHighway] = useState(50);
  const [durationMins, setDurationMins] = useState(0); 
  const [directionsResponse, setDirectionsResponse] = useState<any>(null);
  const [selectedCarId, setSelectedCarId] = useState<string>(cars[0]?.id || '');
  const [crossBorder, setCrossBorder] = useState(false);
  const [isWeekend, setIsWeekend] = useState(false);
  const [withDriver, setWithDriver] = useState(true);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [discountCode, setDiscountCode] = useState('');
  const [price, setPrice] = useState(0);

  const fuelPriceUah = parseFloat(cmsSettings?.['fuel_price_uah'] || '60');
  const eurToUahRate = parseFloat(cmsSettings?.['eur_to_uah_rate'] || '42.5');
  const weekendCoeff = parseFloat(cmsSettings?.['weekend_coefficient'] || '1.2');
  
  const childSeatFee = parseFloat(cmsSettings?.['child_seat_fee'] || '15');
  const animalFee = parseFloat(cmsSettings?.['animal_fee'] || '20');
  const meetAndGreetFee = parseFloat(cmsSettings?.['meet_and_greet_fee'] || '15');
  const luggageMedFee = parseFloat(cmsSettings?.['luggage_medium_fee'] || '10');
  const luggageLargeFee = parseFloat(cmsSettings?.['luggage_large_fee'] || '20');

  const [passengers, setPassengers] = useState('1');
  const [children, setChildren] = useState('0');
  const [luggage, setLuggage] = useState('Немає');
  const [animals, setAnimals] = useState('Ні');
  const [meetAndGreet, setMeetAndGreet] = useState(false);

  const [originSearch, setOriginSearch] = useState('');
  const [originResults, setOriginResults] = useState<any[]>([]);
  const [originObj, setOriginObj] = useState<{lat: number, lng: number, display_name: string} | null>(null);

  const [destSearch, setDestSearch] = useState('');
  const [destResults, setDestResults] = useState<any[]>([]);
  const [destObj, setDestObj] = useState<{lat: number, lng: number, display_name: string} | null>(null);

  const [routeGeometry, setRouteGeometry] = useState<any>(null);

  // Modal & Booking state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bookingData, setBookingData] = useState({ 
    name: '', phone: '', email: '', password: ''
  });
  
  const [arrivalDate, setArrivalDate] = useState<Date | null>(null);
  const [pickupTime, setPickupTime] = useState<Date | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [availabilityStatus, setAvailabilityStatus] = useState<'idle'|'checking'|'available'|'unavailable'>('idle');

  const [excludeIntervals, setExcludeIntervals] = useState<{start: Date, end: Date}[]>([]);

  const requiredCapacity = Number(passengers) + Number(children) * 1.5;

  useEffect(() => {
    const currentCar = cars.find(c => c.id === selectedCarId);
    if (currentCar && currentCar.capacity < requiredCapacity) {
      const firstFitCar = cars.find(c => c.capacity >= requiredCapacity);
      if (firstFitCar) setSelectedCarId(firstFitCar.id);
      else setSelectedCarId('');
    }
  }, [requiredCapacity, selectedCarId, cars]);

  // Fetch booked dates for visual calendar
  useEffect(() => {
    if (!selectedCarId) return;
    fetch(`/api/cars/${selectedCarId}/booked-dates`)
      .then(res => res.json())
      .then((data: any[]) => {
        if (Array.isArray(data)) {
          setExcludeIntervals(data.map(d => ({
            start: new Date(d.dateStart),
            end: new Date(d.dateEnd)
          })));
        }
      })
      .catch(console.error);
  }, [selectedCarId]);

  const searchNominatim = async (query: string, setter: (res: any[]) => void) => {
    if (query.length < 3) { setter([]); return; }
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`);
      const data = await res.json();
      setter(data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (originObj && destObj) {
      const fetchRoute = async () => {
        try {
          const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${originObj.lng},${originObj.lat};${destObj.lng},${destObj.lat}?overview=full&geometries=geojson`);
          const data = await res.json();
          if (data.routes && data.routes.length > 0) {
            const route = data.routes[0];
            setRouteGeometry(route.geometry);
            const distMeters = route.distance;
            const durationSeconds = route.duration;
            setDistance(Math.ceil(distMeters / 1000));
            setDurationMins(Math.ceil(durationSeconds / 60));
            setDistanceHighway(Math.ceil((distMeters * 0.7) / 1000));
            setDistanceCity(Math.ceil((distMeters * 0.3) / 1000));
          }
        } catch (e) { console.error(e); }
      };
      fetchRoute();
    }
  }, [originObj, destObj]);

  useEffect(() => {
    const selectedCar = cars.find(c => c.id === selectedCarId);
    if (!selectedCar) return;

    const litersCity = (distanceCity / 100) * selectedCar.fuelConsumptionCity;
    const litersHighway = (distanceHighway / 100) * selectedCar.fuelConsumptionHighway;
    const totalLiters = litersCity + litersHighway;
    const fuelCostUah = totalLiters * fuelPriceUah;
    const fuelCostEur = fuelCostUah / eurToUahRate;

    const baseCostEur = distance * selectedCar.baseRate;

    let currentPrice = fuelCostEur + baseCostEur;
    if (crossBorder) currentPrice += 150;
    
    if (meetAndGreet) currentPrice += meetAndGreetFee;
    currentPrice += parseInt(children) * childSeatFee;
    if (animals === 'Так') currentPrice += animalFee;
    
    if (luggage === 'Середній (1-2 валізи)') currentPrice += luggageMedFee;
    else if (luggage === 'Великий (3+ валіз)') currentPrice += luggageLargeFee;
    
    let isWeekendReal = false;
    if (arrivalDate) {
      const day = arrivalDate.getDay();
      if (day === 0 || day === 6) isWeekendReal = true;
    }
    if (isWeekendReal || isWeekend) {
      currentPrice *= weekendCoeff;
    }

    if (discountPercent > 0) {
      currentPrice *= (1 - discountPercent / 100);
    }
    
    setPrice(Math.round(currentPrice));
  }, [distanceCity, distanceHighway, distance, selectedCarId, crossBorder, isWeekend, arrivalDate, withDriver, discountPercent, cars, fuelPriceUah, eurToUahRate, weekendCoeff, children, luggage, animals, meetAndGreet, childSeatFee, animalFee, meetAndGreetFee, luggageMedFee, luggageLargeFee]);

  // manual distance change removed because the map auto-calculates it

  // Calculate pickup time and double-check availability on backend
  useEffect(() => {
    if (!arrivalDate || durationMins === 0) return;
    
    const bufferMins = crossBorder ? 60 : 30;
    const totalSubtractMins = durationMins + bufferMins;
    
    const calculatedPickup = new Date(arrivalDate.getTime() - totalSubtractMins * 60000);
    setPickupTime(calculatedPickup);

    const checkAvailability = async () => {
      setAvailabilityStatus('checking');
      try {
        const res = await fetch('/api/cars/availability', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            carId: selectedCarId,
            dateStart: calculatedPickup.toISOString(),
            dateEnd: arrivalDate.toISOString(),
          })
        });
        const data = await res.json();
        setAvailabilityStatus(data.available ? 'available' : 'unavailable');
      } catch (err) {
        console.error(err);
        setAvailabilityStatus('idle');
      }
    };

    checkAvailability();
  }, [arrivalDate, durationMins, crossBorder, selectedCarId]);

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (availabilityStatus === 'unavailable' || !pickupTime || !arrivalDate) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: bookingData.name,
          phone: bookingData.phone,
          email: bookingData.email,
          password: bookingData.password,
          routeFrom: originObj?.display_name || originSearch || 'Не вказано',
          routeTo: destObj?.display_name || destSearch || 'Не вказано',
          distance,
          price,
          dateStart: pickupTime.toISOString(),
          dateEnd: arrivalDate.toISOString(),
          carId: selectedCarId,
          passengers: Number(passengers),
          children: Number(children),
          luggage: luggage,
          animals: animals === 'Так'
        })
      });
      if (res.ok) {
        setSubmitSuccess(true);
        setTimeout(() => { setIsModalOpen(false); setSubmitSuccess(false); }, 3000);
      }
    } catch (err) {
      console.error(err);
    }
    setIsSubmitting(false);
  };

  return (
    <section className="max-w-[1280px] mx-auto px-4 sm:px-6 md:px-[64px] mb-[80px]" id="calculator">
      <h2 className="font-headline-lg text-[32px] md:text-[48px] leading-tight md:leading-[56px] font-semibold text-[#e4e2e3] mb-8 md:mb-[48px] text-center">
        Розрахунок вартості преміум-поїздки
      </h2>
      <div className="glass-panel p-5 sm:p-8 md:p-12 rounded-3xl max-w-5xl mx-auto border border-white/10 shadow-2xl relative overflow-hidden flex flex-col gap-8 md:gap-12">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#e9c349]/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#e9c349]/5 rounded-full blur-3xl pointer-events-none"></div>
        
        {/* Route Selection and Distance Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 relative z-10">
          <div className="space-y-6 md:space-y-8">
            <h3 className="font-headline-md text-2xl text-[#e4e2e3] flex items-center gap-3">
              <span className="material-symbols-outlined text-[#e9c349]">route</span> Маршрут поїздки
            </h3>
            <div className="space-y-6">
              <div className="relative group z-30">
                <label className="block font-label-caps text-[12px] uppercase text-[#c7c6ca] mb-2 ml-1">Звідки</label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-4 text-[#e9c349]/60">my_location</span>
                  <input 
                    type="text" 
                    className="w-full bg-[#353536]/30 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-[#e4e2e3] focus:border-[#e9c349] outline-none" 
                    placeholder="Введіть адресу або місто" 
                    value={originSearch}
                    onChange={e => {
                      setOriginSearch(e.target.value);
                      setOriginObj(null);
                      searchNominatim(e.target.value, setOriginResults);
                    }} 
                  />
                  {originResults.length > 0 && !originObj && (
                    <div className="absolute top-full left-0 w-full mt-2 bg-[#1b1b1c] border border-white/10 rounded-xl shadow-2xl z-40 max-h-60 overflow-y-auto">
                      {originResults.map(r => (
                        <div key={r.place_id} className="p-3 hover:bg-white/5 cursor-pointer text-sm text-[#c7c6ca] border-b border-white/5 last:border-0" onClick={() => {
                          setOriginObj({ lat: parseFloat(r.lat), lng: parseFloat(r.lon), display_name: r.display_name });
                          setOriginSearch(r.display_name);
                          setOriginResults([]);
                        }}>
                          {r.display_name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="relative group z-20">
                <label className="block font-label-caps text-[12px] uppercase text-[#c7c6ca] mb-2 ml-1">Куди</label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-4 text-[#e9c349]/60">location_on</span>
                  <input 
                    type="text" 
                    className="w-full bg-[#353536]/30 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-[#e4e2e3] focus:border-[#e9c349] outline-none" 
                    placeholder="Введіть адресу або місто" 
                    value={destSearch}
                    onChange={e => {
                      setDestSearch(e.target.value);
                      setDestObj(null);
                      searchNominatim(e.target.value, setDestResults);
                    }} 
                  />
                  {destResults.length > 0 && !destObj && (
                    <div className="absolute top-full left-0 w-full mt-2 bg-[#1b1b1c] border border-white/10 rounded-xl shadow-2xl z-40 max-h-60 overflow-y-auto">
                      {destResults.map(r => (
                        <div key={r.place_id} className="p-3 hover:bg-white/5 cursor-pointer text-sm text-[#c7c6ca] border-b border-white/5 last:border-0" onClick={() => {
                          setDestObj({ lat: parseFloat(r.lat), lng: parseFloat(r.lon), display_name: r.display_name });
                          setDestSearch(r.display_name);
                          setDestResults([]);
                        }}>
                          {r.display_name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col h-full justify-end mt-4 md:mt-0">
            <div className="bg-[#353536]/30 border border-white/10 rounded-2xl relative flex flex-col h-full min-h-[300px]">
              <MapDisplay routeGeometry={routeGeometry} origin={originObj} destination={destObj} />
              
              {distance > 0 && (
                <div className="absolute top-4 right-4 bg-[#080818]/90 backdrop-blur-md border border-[#e9c349]/30 rounded-xl p-4 shadow-xl">
                  <div className="text-right">
                    <span className="text-3xl font-display-lg text-[#e9c349]">{distance} км</span>
                    {durationMins > 0 && (
                      <div className="text-sm text-[#c7c6ca] mt-1">~{Math.floor(durationMins/60)}г {durationMins%60}хв</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Passenger & Luggage Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 relative z-10 border-t border-white/10 pt-6 md:pt-8">
          <div className="bg-[#353536]/30 border border-white/10 rounded-xl p-4">
            <label className="block text-xs text-[#c7c6ca] mb-1 font-label-caps uppercase">Дорослі</label>
            <select className="w-full bg-transparent text-white outline-none" value={passengers} onChange={e => setPassengers(e.target.value)}>
              {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n} className="bg-[#1a1a1b]">{n}</option>)}
            </select>
          </div>
          <div className="bg-[#353536]/30 border border-white/10 rounded-xl p-4">
            <label className="block text-xs text-[#c7c6ca] mb-1 font-label-caps uppercase">Діти (+{childSeatFee}€)</label>
            <select className="w-full bg-transparent text-white outline-none" value={children} onChange={e => setChildren(e.target.value)}>
              {[0,1,2,3,4].map(n => <option key={n} value={n} className="bg-[#1a1a1b]">{n}</option>)}
            </select>
          </div>
          <div className="bg-[#353536]/30 border border-white/10 rounded-xl p-4">
            <label className="block text-xs text-[#c7c6ca] mb-1 font-label-caps uppercase">Багаж</label>
            <select className="w-full bg-transparent text-white outline-none" value={luggage} onChange={e => setLuggage(e.target.value)}>
              {['Немає', 'Малий (Ручна поклажа)', 'Середній (1-2 валізи)', 'Великий (3+ валіз)'].map(o => <option key={o} value={o} className="bg-[#1a1a1b]">{o}</option>)}
            </select>
          </div>
          <div className="bg-[#353536]/30 border border-white/10 rounded-xl p-4">
            <label className="block text-xs text-[#c7c6ca] mb-1 font-label-caps uppercase">Тварини (+{animalFee}€)</label>
            <select className="w-full bg-transparent text-white outline-none" value={animals} onChange={e => setAnimals(e.target.value)}>
              {['Ні', 'Так'].map(o => <option key={o} value={o} className="bg-[#1a1a1b]">{o}</option>)}
            </select>
          </div>
        </div>

        {/* Options Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 relative z-10 border-t border-white/10 pt-6 md:pt-8">
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={crossBorder} onChange={(e) => setCrossBorder(e.target.checked)} className="w-5 h-5 rounded border-gray-300 text-[#e9c349] focus:ring-[#e9c349]" />
              <span className="text-[#e4e2e3] font-body-md">Перетин кордону (міжнародний рейс)</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={isWeekend} onChange={(e) => setIsWeekend(e.target.checked)} className="w-5 h-5 rounded border-gray-300 text-[#e9c349] focus:ring-[#e9c349]" />
              <span className="text-[#e4e2e3] font-body-md">Поїздка у вихідний день (+{Math.round((weekendCoeff - 1) * 100)}%)</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={meetAndGreet} onChange={(e) => setMeetAndGreet(e.target.checked)} className="w-5 h-5 rounded border-gray-300 text-[#e9c349] focus:ring-[#e9c349]" />
              <span className="text-[#e4e2e3] font-body-md">Зустріч з табличкою (+{meetAndGreetFee}€)</span>
            </label>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input type="text" placeholder="Промокод" value={discountCode} onChange={(e) => {
                setDiscountCode(e.target.value);
                if (e.target.value.toLowerCase() === 'vip10') setDiscountPercent(10);
                else setDiscountPercent(0);
              }} className="bg-[#353536]/30 border border-white/10 rounded-xl px-4 py-2 text-[#e4e2e3] focus:border-[#e9c349] outline-none w-full max-w-[200px]" />
              {discountPercent > 0 && <span className="text-[#e9c349] text-sm">-{discountPercent}% Активовано!</span>}
            </div>
          </div>
        </div>

        {/* Vehicle Selection Row */}
        <div className="space-y-6 relative z-10 border-t border-white/10 pt-6 md:pt-8">
          <h3 className="font-headline-md text-2xl text-[#e4e2e3] flex items-center gap-3">
            <span className="material-symbols-outlined text-[#e9c349]">diamond</span> Клас обслуговування (Авто)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {cars.map(car => {
              const doesFit = car.capacity >= requiredCapacity;
              return (
              <label key={car.id} className={`cursor-pointer ${!doesFit ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}>
                <input type="radio" name="service_class" value={car.id} checked={selectedCarId === car.id} onChange={() => { if(doesFit) setSelectedCarId(car.id) }} disabled={!doesFit} className="peer sr-only" />
                <div className="glass-panel px-6 py-6 rounded-xl border border-white/10 peer-checked:border-[#e9c349] peer-checked:bg-[#e9c349]/10 transition-all flex items-center justify-between h-full relative">
                  <div className="text-left">
                    <span className="block font-headline-md text-xl mb-1 text-white">{car.make}</span>
                    <span className="text-sm text-[#c7c6ca]">{car.model} • до {car.capacity} місць</span>
                  </div>
                  {!doesFit ? (
                    <span className="text-[10px] uppercase bg-red-500/20 border border-red-500/30 text-red-400 px-2 py-1 rounded absolute top-2 right-2">Не вмістить</span>
                  ) : (
                    <span className={`material-symbols-outlined text-3xl ${selectedCarId === car.id ? 'text-[#e9c349]' : 'text-[#c7c6ca]'}`}>check_circle</span>
                  )}
                </div>
              </label>
              );
            })}
          </div>
        </div>

        {/* Bottom Row */}
        <div className="pt-6 md:pt-8 border-t border-white/10 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8 bg-[#353536]/30 p-6 md:p-8 rounded-2xl border border-white/5 backdrop-blur-sm">
            <div className="flex-1 text-center md:text-left">
              <h4 className="font-label-caps text-[12px] text-[#c7c6ca] mb-2 uppercase tracking-widest">Орієнтовна вартість</h4>
              <div className="relative inline-block">
                <div className="text-5xl md:text-7xl font-display-lg text-white tracking-tight drop-shadow-2xl">
                  € {price}
                </div>
              </div>
            </div>
            <div className="w-full md:w-auto">
              <button 
                onClick={() => setIsModalOpen(true)}
                className="gold-button font-button text-[14px] px-6 py-4 md:px-12 md:py-6 rounded-2xl hover:scale-[0.98] transition-all md:text-lg shadow-[0_10px_30px_rgba(212,175,55,0.2)] uppercase tracking-wider font-semibold w-full md:w-auto"
              >
                Продовжити бронювання
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#1a1a1b] border border-[#e9c349]/20 rounded-2xl md:rounded-3xl p-5 md:p-8 max-w-2xl w-full shadow-2xl relative my-4 md:my-8 max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-[#c7c6ca] hover:text-white"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            
            {submitSuccess ? (
              <div className="text-center py-10">
                <span className="material-symbols-outlined text-[#e9c349] text-6xl mb-4">check_circle</span>
                <h3 className="text-2xl font-headline-md text-white mb-2">Заявка прийнята!</h3>
                <p className="text-[#c7c6ca]">Ми зв'яжемося з вами найближчим часом для підтвердження. Ваш акаунт створено.</p>
              </div>
            ) : (
              <>
                <h3 className="text-2xl font-headline-md text-white mb-2">Деталі поїздки та Авторизація</h3>
                <p className="text-[#c7c6ca] text-sm mb-6">Будь ласка, заповніть всі деталі для завершення бронювання.</p>
                <form onSubmit={handleBookingSubmit} className="space-y-6">
                  
                  {/* Visual Calendar */}
                  <div className="bg-[#080818] p-5 rounded-xl border border-white/5">
                    <label className="block text-sm text-[#e9c349] mb-3 font-bold uppercase tracking-widest">
                      Бажаний час прибуття {destObj?.display_name ? `в ${destObj.display_name.split(',')[0]}` : (destSearch ? `в ${destSearch.split(',')[0]}` : '')} *
                    </label>
                    <DatePicker
                      selected={arrivalDate}
                      onChange={(date: Date | null) => setArrivalDate(date)}
                      showTimeSelect
                      timeFormat="HH:mm"
                      timeIntervals={30}
                      dateFormat="d MMMM yyyy, HH:mm"
                      excludeDateIntervals={excludeIntervals}
                      minDate={new Date()}
                      className="w-full bg-transparent border-b border-white/20 p-2 text-white focus:border-[#e9c349] outline-none"
                      placeholderText="Оберіть вільну дату та час"
                      required
                    />
                    
                    {pickupTime && (
                      <div className="mt-4 pt-4 border-t border-white/10 relative">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-[#c7c6ca]">Час подачі авто:</span>
                          <span className="text-white font-bold">{pickupTime.toLocaleString('uk-UA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        
                        {availabilityStatus === 'checking' && <div className="text-xs text-blue-400 mt-2 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">sync</span> Перевірка доступності...</div>}
                        {availabilityStatus === 'available' && <div className="text-xs text-green-400 mt-2 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">check_circle</span> Автомобіль доступний</div>}
                        {availabilityStatus === 'unavailable' && <div className="text-xs text-red-400 mt-2 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">cancel</span> Автомобіль зайнятий у розрахований час подачі</div>}
                      </div>
                    )}
                  </div>

                  {/* Contact / Auth */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-[#c7c6ca] mb-1">Ім'я *</label>
                      <input required type="text" className="w-full bg-transparent border-b border-white/20 p-2 text-white focus:border-[#e9c349] outline-none"
                        value={bookingData.name} onChange={e => setBookingData({...bookingData, name: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm text-[#c7c6ca] mb-1">Телефон *</label>
                      <input required type="tel" className="w-full bg-transparent border-b border-white/20 p-2 text-white focus:border-[#e9c349] outline-none"
                        value={bookingData.phone} onChange={e => setBookingData({...bookingData, phone: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm text-[#c7c6ca] mb-1">Email * (Логін)</label>
                      <input required type="email" className="w-full bg-transparent border-b border-white/20 p-2 text-white focus:border-[#e9c349] outline-none"
                        value={bookingData.email} onChange={e => setBookingData({...bookingData, email: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm text-[#c7c6ca] mb-1">Пароль *</label>
                      <input required type="password" minLength={6} className="w-full bg-transparent border-b border-white/20 p-2 text-white focus:border-[#e9c349] outline-none"
                        value={bookingData.password} onChange={e => setBookingData({...bookingData, password: e.target.value})} />
                    </div>
                  </div>
                  
                  <button type="submit" disabled={isSubmitting || availabilityStatus === 'unavailable'} className="w-full gold-button font-bold rounded-lg p-4 mt-6 disabled:opacity-50 disabled:cursor-not-allowed">
                    {isSubmitting ? 'Відправка...' : 'Підтвердити заявку'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
