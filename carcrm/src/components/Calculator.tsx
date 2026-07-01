'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useJsApiLoader, Autocomplete } from '@react-google-maps/api';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

type Car = { 
  id: string; 
  make: string; 
  model: string; 
  baseRate: number;
  fuelType: string;
  fuelConsumptionCity: number;
  fuelConsumptionHighway: number;
};

const libraries: "places"[] = ["places"];

export default function Calculator({ cars, cmsSettings }: { cars: Car[], cmsSettings?: Record<string, string> }) {
  const [distance, setDistance] = useState(100);
  const [distanceCity, setDistanceCity] = useState(50);
  const [distanceHighway, setDistanceHighway] = useState(50);
  const [durationMins, setDurationMins] = useState(0); 
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

  const [origin, setOrigin] = useState<string>('');
  const [destination, setDestination] = useState<string>('');

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

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });

  const originRef = useRef<HTMLInputElement>(null);
  const destinationRef = useRef<HTMLInputElement>(null);

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

  const calculateRoute = async () => {
    if (!originRef.current?.value || !destinationRef.current?.value) return;
    setOrigin(originRef.current.value);
    setDestination(destinationRef.current.value);
    
    // eslint-disable-next-line no-undef
    const directionsService = new google.maps.DirectionsService();
    try {
      const results = await directionsService.route({
        origin: originRef.current.value,
        destination: destinationRef.current.value,
        // eslint-disable-next-line no-undef
        travelMode: google.maps.TravelMode.DRIVING,
      });
      const route = results.routes[0].legs[0];
      const distMeters = route.distance?.value || 0;
      const durationSeconds = route.duration?.value || 0;
      
      let dCity = 0;
      let dHighway = 0;
      route.steps.forEach((step: any) => {
        const stepDist = step.distance?.value || 0; // meters
        const stepDur = step.duration?.value || 1; // seconds
        const speedKmh = (stepDist / 1000) / (stepDur / 3600);
        if (speedKmh > 70) {
          dHighway += stepDist;
        } else {
          dCity += stepDist;
        }
      });

      setDistanceCity(Math.ceil(dCity / 1000));
      setDistanceHighway(Math.ceil(dHighway / 1000));
      setDistance(Math.ceil(distMeters / 1000));
      setDurationMins(Math.ceil(durationSeconds / 60));
    } catch (error) {
      console.error("Помилка розрахунку маршруту:", error);
    }
  };

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

  const handleManualDistanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDist = Number(e.target.value);
    if (distance > 0) {
      const ratio = newDist / distance;
      setDistanceCity(distanceCity * ratio);
      setDistanceHighway(distanceHighway * ratio);
    } else {
      setDistanceCity(newDist * 0.5);
      setDistanceHighway(newDist * 0.5);
    }
    setDistance(newDist);
  };

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
          routeFrom: origin || originRef.current?.value || 'Не вказано',
          routeTo: destination || destinationRef.current?.value || 'Не вказано',
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
                      <input ref={originRef} type="text" className="w-full bg-[#353536]/30 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-[#e4e2e3] focus:border-[#e9c349] outline-none" placeholder="Введіть адресу або місто" onChange={e => setOrigin(e.target.value)} />
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
                      <input ref={destinationRef} type="text" className="w-full bg-[#353536]/30 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-[#e4e2e3] focus:border-[#e9c349] outline-none" placeholder="Введіть адресу або місто" onChange={e => setDestination(e.target.value)} />
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
                  <input type="range" min="1" max="2000" value={distance} onChange={handleManualDistanceChange} className="w-full mb-2" />
                </div>
                <div className="text-right">
                  <span className="text-4xl font-display-lg text-[#e9c349]" id="distance-display">{distance} км</span>
                  {durationMins > 0 && (
                    <div className="text-sm text-[#c7c6ca] mt-2">В дорозі: ~{Math.floor(durationMins/60)}г {durationMins%60}хв</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Passenger & Luggage Options */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10 border-t border-white/10 pt-8">
          <div className="bg-[#353536]/30 border border-white/10 rounded-xl p-4">
            <label className="block text-xs text-[#c7c6ca] mb-1 font-label-caps uppercase">Пасажири</label>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10 border-t border-white/10 pt-8">
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
              <button 
                onClick={() => setIsModalOpen(true)}
                className="gold-button font-button text-[14px] px-12 py-6 rounded-2xl hover:scale-[0.98] transition-all text-lg shadow-[0_10px_30px_rgba(212,175,55,0.2)] uppercase tracking-wider font-semibold"
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
          <div className="bg-[#1a1a1b] border border-[#e9c349]/20 rounded-3xl p-8 max-w-2xl w-full shadow-2xl relative my-8">
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
                    <label className="block text-sm text-[#e9c349] mb-3 font-bold uppercase tracking-widest">Бажаний час прибуття (Куди) *</label>
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
