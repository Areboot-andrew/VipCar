'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import DatePicker from 'react-datepicker';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';

const MapDisplay = dynamic(() => import('./MapDisplay'), { ssr: false });
import 'react-datepicker/dist/react-datepicker.css';

type Car = { 
  id: string; 
  make: string; 
  model: string; 
  comfortClass?: string;
  luggageCapacity?: number;
  largeLuggageCapacity?: number;
  allowsChildren?: boolean;
  allowsAnimals?: boolean;
  childSeatFee?: number;
  animalFee?: number;
  meetAndGreetFee?: number;
  baseRate: number;
  fuelType: string;
  fuelConsumptionCity: number;
  fuelConsumptionHighway: number;
  capacity: number;
  year: number;
  images: string[];
};

import { calculateTripPricing, type TripPricingResult } from '../lib/pricingEngine';

export default function Calculator({ cars, cmsSettings, siteSettings, globalFuelPrices = [] }: { cars: any[], cmsSettings?: Record<string, string>, siteSettings?: any, globalFuelPrices?: any[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { status: authStatus } = useSession();
  const initCarId = searchParams.get('carId') || (cars[0]?.id || '');
  const initPromo = searchParams.get('promo') ? parseFloat(searchParams.get('promo')!) : 0;
  const initPromotionId = searchParams.get('promotionId') || null;
  const initPromoCode = searchParams.get('promoCode') || '';
  const [personalDiscountPercent, setPersonalDiscountPercent] = useState(0);

  const [distance, setDistance] = useState(0);
  const [distanceCity, setDistanceCity] = useState(0);
  const [distanceHighway, setDistanceHighway] = useState(0);
  const [durationMins, setDurationMins] = useState(0);
  const [selectedCarId, setSelectedCarId] = useState<string>(initCarId);
  const [discountPercent, setDiscountPercent] = useState(initPromo);
  const [discountCode, setDiscountCode] = useState(initPromoCode);
  const [price, setPrice] = useState(0);
  const [expenseSnapshot, setExpenseSnapshot] = useState({
    fuelCost: 0,
    driverSalary: 0,
    amortization: 0,
    deliveryCost: 0,
    deliveryDistance: 0,
    deliveryDurationMins: 0,
    timeCost: 0,
    hotelCost: 0,
    surcharges: 0,
    netProfit: 0,
    billableHours: 0,
    customsWaitHours: 0,
    manualWaitingHours: 0,
    trafficBufferPercent: 10,
    prepBufferMins: 30,
    totalExpenseDistance: 0,
    pricingSnapshot: {} as Record<string, unknown>,
  });

  const fuelPricePetrol = siteSettings?.fuelPricePetrol || 1.6;
  const fuelPriceDiesel = siteSettings?.fuelPriceDiesel || 1.5;

  // Fallbacks for older things that aren't per-car yet
  const amortizationRate = parseFloat(cmsSettings?.['amortization_rate'] || '0.05');
  const marginRate = parseFloat(cmsSettings?.['margin_rate'] || '0.2');
  const deliveryRate = parseFloat(cmsSettings?.['pricing_delivery_rate'] || '1.1');
  const deliveryBaseFee = parseFloat(cmsSettings?.['pricing_delivery_base_fee'] || '20');
  const defaultCustomsWaitHours = parseFloat(cmsSettings?.['pricing_customs_wait_hours'] || '1.5');
  const manualWaitingHours = parseFloat(cmsSettings?.['pricing_manual_waiting_hours'] || '0');
  const prepBufferMins = parseInt(cmsSettings?.['pricing_prep_buffer_mins'] || '30', 10);
  const trafficBufferPercent = parseFloat(cmsSettings?.['pricing_traffic_buffer_percent'] || '10');
  const timeRatePerHour = parseFloat(cmsSettings?.['pricing_time_rate_per_hour'] || '0');
  const hotelAfterHours = parseFloat(cmsSettings?.['pricing_hotel_after_hours'] || '10');
  const hotelCostPerNight = parseFloat(cmsSettings?.['pricing_hotel_cost_per_night'] || '90');
  const minMarginPercent = parseFloat(cmsSettings?.['pricing_min_margin_percent'] || '0.25');
  const baseLocationLat = parseFloat(cmsSettings?.['base_location_lat'] || '49.8397');
  const baseLocationLng = parseFloat(cmsSettings?.['base_location_lng'] || '24.0297');
  const weekendCoeff = parseFloat(cmsSettings?.['weekend_coefficient'] || '1.2');

  const [passengers, setPassengers] = useState('1');
  const [children, setChildren] = useState('0');
  const [childSeats, setChildSeats] = useState('0');
  const [luggage, setLuggage] = useState('Немає');
  const [petsCount, setPetsCount] = useState('0');
  const [meetAndGreet, setMeetAndGreet] = useState(false);
  const [meetAndGreetText, setMeetAndGreetText] = useState('');

  const [originSearch, setOriginSearch] = useState('');
  const [originResults, setOriginResults] = useState<any[]>([]);
  const [originObj, setOriginObj] = useState<{lat: number, lng: number, display_name: string, address?: any} | null>(null);

  const [destSearch, setDestSearch] = useState('');
  const [destResults, setDestResults] = useState<any[]>([]);
  const [destObj, setDestObj] = useState<{lat: number, lng: number, display_name: string, address?: any} | null>(null);

  const [routeGeometry, setRouteGeometry] = useState<any>(null);

  // Modal & Booking state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bookingData, setBookingData] = useState({
    name: '', phone: '', email: '', password: ''
  });
  // Server-verified price for the modal ("what you see is what you pay")
  const [serverQuote, setServerQuote] = useState<{ price: number; depositAmount: number; discountPercent: number } | null>(null);
  
  const [arrivalDate, setArrivalDate] = useState<Date | null>(null);
  const [pickupTime, setPickupTime] = useState<Date | null>(null);
  const [arrivalPickerOpen, setArrivalPickerOpen] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [vehicleAvailability, setVehicleAvailability] = useState<Record<string, boolean>>({});
  const [checkingVehicleAvailability, setCheckingVehicleAvailability] = useState(false);
  const [vehicleClass, setVehicleClass] = useState('all');

  const requiredCapacity = Number(passengers) + Number(children);
  const selectedCar = cars.find(c => c.id === selectedCarId);
  const classOrder = ['VIP', 'Business', 'Premium', 'Executive'];
  const luggageRequired = luggage.startsWith('Великий') ? 3 : luggage.startsWith('Середній') ? 2 : luggage.startsWith('Малий') ? 1 : 0;
  const routeCountries = getRouteCountries();
  const routeCountryKey = routeCountries.join('|');
  const detectedCrossBorder = routeCountries.length > 1;
  const hasTripBasics = Boolean(originObj && destObj && durationMins > 0 && arrivalDate);
  // Availability of the selected car, derived from the batch check below (single source of truth)
  const availabilityStatus: 'idle' | 'checking' | 'available' | 'unavailable' =
    !hasTripBasics || !selectedCarId ? 'idle'
    : checkingVehicleAvailability ? 'checking'
    : vehicleAvailability[selectedCarId] === true ? 'available'
    : vehicleAvailability[selectedCarId] === false ? 'unavailable'
    : 'idle';
  const availableClasses = Array.from(new Set(cars.map((car) => car.comfortClass || 'Premium')))
    .sort((a, b) => {
      const ai = classOrder.indexOf(a);
      const bi = classOrder.indexOf(b);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi) || a.localeCompare(b, 'uk');
    });
  const carMeetsCriteria = (car: any) => {
    if (vehicleClass !== 'all' && (car.comfortClass || 'Premium') !== vehicleClass) return false;
    if (car.capacity < requiredCapacity) return false;
    if (Number(car.luggageCapacity || 0) < luggageRequired) return false;
    if ((Number(children) > 0 || Number(childSeats) > 0) && car.allowsChildren === false) return false;
    if (Number(petsCount) > 0 && car.allowsAnimals === false) return false;
    return true;
  };
  const getCarCover = (car: any) => {
    const media = Array.isArray(car.media) ? car.media : [];
    return media.find((item: any) => item.isCover) || media[0] || (car.images?.[0] ? { type: 'image', url: car.images[0], alt: `${car.make} ${car.model}` } : null);
  };
  const filteredCars = cars
    .filter(carMeetsCriteria)
    .filter((car) => !hasTripBasics || vehicleAvailability[car.id] === true)
    .sort((a, b) => {
      const classDiff = (classOrder.indexOf(a.comfortClass || 'Premium') === -1 ? 99 : classOrder.indexOf(a.comfortClass || 'Premium')) -
        (classOrder.indexOf(b.comfortClass || 'Premium') === -1 ? 99 : classOrder.indexOf(b.comfortClass || 'Premium'));
      if (classDiff !== 0) return classDiff;
      return Number(a.baseRate || 0) - Number(b.baseRate || 0);
    });

  useEffect(() => {
    const currentCar = cars.find(c => c.id === selectedCarId);
    const currentIsUsable = currentCar && carMeetsCriteria(currentCar) && (!hasTripBasics || vehicleAvailability[currentCar.id] === true);
    if (!currentIsUsable) {
      const firstFitCar = filteredCars[0];
      setSelectedCarId(firstFitCar?.id || '');
    }
  }, [requiredCapacity, luggage, children, childSeats, petsCount, vehicleClass, selectedCarId, cars, hasTripBasics, vehicleAvailability]);

  const searchNominatim = async (query: string, setter: (res: any[]) => void) => {
    if (query.length < 3) { setter([]); return; }
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1&accept-language=uk`);
      const data = await res.json();
      setter(data);
    } catch (e) { console.error(e); }
  };

  // Live promo-code check against the DB (codes are managed in admin -> Empty Legs).
  useEffect(() => {
    const codeValue = discountCode.trim();
    // Empty-leg promo from the URL keeps its own percent from the banner link.
    if (codeValue.startsWith('auto-empty-')) return;
    if (!codeValue) {
      setDiscountPercent(initPromotionId ? initPromo : 0);
      return;
    }
    const timer = setTimeout(() => {
      fetch(`/api/promotions/resolve-code?code=${encodeURIComponent(codeValue)}&carId=${encodeURIComponent(selectedCarId)}`)
        .then(res => res.json())
        .then(data => setDiscountPercent(Number(data?.percent || 0)))
        .catch(() => setDiscountPercent(0));
    }, 400);
    return () => clearTimeout(timer);
  }, [discountCode, selectedCarId]);

  // The modal shows the server-verified price (same engine that creates the booking).
  useEffect(() => {
    if (!isModalOpen || !originObj || !destObj || !arrivalDate || !selectedCarId) {
      setServerQuote(null);
      return;
    }
    let active = true;
    fetch('/api/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        carId: selectedCarId,
        routeFrom: originObj.display_name,
        routeTo: destObj.display_name,
        routeCountries,
        distance,
        distanceCity,
        distanceHighway,
        durationMins,
        originLat: originObj.lat,
        originLng: originObj.lng,
        destinationLat: destObj.lat,
        destinationLng: destObj.lng,
        arrivalDate: arrivalDate.toISOString(),
        passengers: Number(passengers),
        children: Number(children),
        childSeats: Number(childSeats),
        petsCount: Number(petsCount),
        meetAndGreet,
        promotionId: initPromotionId,
        promoCode: discountCode || null,
      }),
    })
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (active && data && typeof data.price === 'number') {
          setServerQuote({ price: data.price, depositAmount: Number(data.depositAmount || 0), discountPercent: Number(data.discountPercent || 0) });
        }
      })
      .catch(() => {});
    return () => { active = false; };
  }, [isModalOpen, meetAndGreet, selectedCarId, arrivalDate, distance, discountCode]);

  // Logged-in client: load personal discount ("ваша ціна") and prefill contacts.
  useEffect(() => {
    if (authStatus !== 'authenticated') {
      setPersonalDiscountPercent(0);
      return;
    }
    let active = true;
    fetch('/api/user/me')
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (!active || !data) return;
        setPersonalDiscountPercent(Number(data.personalDiscountPercent || 0));
        setBookingData(prev => ({
          ...prev,
          name: prev.name || data.name || '',
          email: prev.email || data.email || '',
          phone: prev.phone || data.phone || '',
        }));
      })
      .catch(() => {});
    return () => { active = false; };
  }, [authStatus]);

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

  function getRouteCountries() {
    const countries: string[] = [];
    if (originObj?.address?.country) countries.push(originObj.address.country);
    if (destObj?.address?.country && destObj.address.country !== originObj?.address?.country) {
      countries.push(destObj.address.country);
    }
    return countries;
  }

  // The client gets the better of the promo discount and their personal loyalty discount.
  const effectiveDiscount = Math.max(discountPercent, personalDiscountPercent);

  const getCarForPricing = (car: any) => ({
    ...car,
    baseLat: car.baseLat ?? baseLocationLat,
    baseLng: car.baseLng ?? baseLocationLng,
  });

  const getPricingForCar = (car: any): TripPricingResult => calculateTripPricing({
    car: getCarForPricing(car),
    distance,
    distanceCity,
    distanceHighway,
    durationMins,
    routeCountries,
    origin: originObj ? { lat: originObj.lat, lng: originObj.lng } : null,
    arrivalDate,
    crossBorder: detectedCrossBorder,
    meetAndGreet,
    passengers: Number(passengers),
    children: Number(children),
    childSeats: Number(childSeats),
    petsCount: Number(petsCount),
    withDriver: true,
    discountPercent: effectiveDiscount,
    globalFuelPrices,
    settings: {
      fuelPricePetrol,
      fuelPriceDiesel,
      amortizationRate,
      marginRate,
      deliveryRate,
      deliveryBaseFee,
      defaultCustomsWaitHours,
      manualWaitingHours,
      prepBufferMins,
      trafficBufferPercent,
      timeRatePerHour,
      hotelAfterHours,
      hotelCostPerNight,
      minMarginPercent,
      weekendCoeff,
    },
  });

  const calculatePriceForCar = (car: any) => {
    if (distance === 0) return 0;
    return getPricingForCar(car).price;
  };

  useEffect(() => {
    const selectedCar = cars.find(c => c.id === selectedCarId);
    if (!selectedCar) return;

    const pricing = getPricingForCar(selectedCar);
    setPrice(pricing.price);
    setPickupTime(pricing.pickupAt);
    
    setExpenseSnapshot({
      fuelCost: pricing.fuelCost,
      driverSalary: pricing.driverSalary,
      amortization: pricing.amortization,
      deliveryCost: pricing.deliveryCost,
      deliveryDistance: pricing.deliveryDistance,
      deliveryDurationMins: pricing.deliveryDurationMins,
      timeCost: pricing.timeCost,
      hotelCost: pricing.hotelCost,
      surcharges: pricing.surcharges,
      netProfit: pricing.netProfit,
      billableHours: pricing.billableHours,
      customsWaitHours: pricing.customsWaitHours,
      manualWaitingHours: pricing.manualWaitingHours,
      trafficBufferPercent: pricing.trafficBufferPercent,
      prepBufferMins: pricing.prepBufferMins,
      totalExpenseDistance: pricing.totalExpenseDistance,
      pricingSnapshot: pricing.pricingSnapshot,
    });
  }, [distanceCity, distanceHighway, distance, durationMins, selectedCarId, detectedCrossBorder, arrivalDate, discountPercent, personalDiscountPercent, cars, fuelPricePetrol, fuelPriceDiesel, weekendCoeff, children, childSeats, petsCount, meetAndGreet, passengers, originObj, destObj, routeCountryKey, baseLocationLat, baseLocationLng, amortizationRate, deliveryRate, deliveryBaseFee, defaultCustomsWaitHours, manualWaitingHours, prepBufferMins, trafficBufferPercent, timeRatePerHour, hotelAfterHours, hotelCostPerNight, minMarginPercent, marginRate, globalFuelPrices]);

  useEffect(() => {
    if (!hasTripBasics || !arrivalDate) {
      setVehicleAvailability({});
      setCheckingVehicleAvailability(false);
      return;
    }

    const candidateChecks = cars
      .filter(carMeetsCriteria)
      .map((car) => {
        const pricing = getPricingForCar(car);
        if (!pricing.pickupAt) return null;
        return {
          carId: car.id,
          dateStart: pricing.pickupAt.toISOString(),
          dateEnd: arrivalDate.toISOString(),
          carDispatchAt: pricing.carDispatchAt?.toISOString(),
          returnToBaseAt: pricing.returnToBaseAt?.toISOString(),
        };
      })
      .filter(Boolean);

    if (candidateChecks.length === 0) {
      setVehicleAvailability({});
      setCheckingVehicleAvailability(false);
      return;
    }

    let active = true;
    setCheckingVehicleAvailability(true);
    fetch('/api/cars/availability', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checks: candidateChecks }),
    })
      .then(res => res.json())
      .then(data => {
        if (!active) return;
        setVehicleAvailability(data.results || {});
        setCheckingVehicleAvailability(false);
      })
      .catch(error => {
        console.error(error);
        if (active) {
          setVehicleAvailability({});
          setCheckingVehicleAvailability(false);
        }
      });

    return () => {
      active = false;
    };
  }, [hasTripBasics, arrivalDate, durationMins, selectedCarId, vehicleClass, passengers, children, childSeats, luggage, petsCount, detectedCrossBorder, routeCountryKey, cars]);

  // manual distance change removed because the map auto-calculates it
  // (availability of the selected car is derived from the batch check above)

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (availabilityStatus === 'unavailable' || !pickupTime || !arrivalDate) return;

    const serviceNote = meetAndGreet
      ? `Зустріч з табличкою та допомога з багажем${meetAndGreetText.trim() ? `: ${meetAndGreetText.trim()}` : ''}`
      : '';

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
          distanceCity,
          distanceHighway,
          price,
          dateStart: pickupTime.toISOString(),
          dateEnd: arrivalDate.toISOString(),
          carId: selectedCarId,
          originLat: originObj?.lat,
          originLng: originObj?.lng,
          destinationLat: destObj?.lat,
          destinationLng: destObj?.lng,
          passengers: Number(passengers),
          children: Number(children),
          childSeats: Number(childSeats),
          luggage: luggage,
          animals: Number(petsCount) > 0,
          petsCount: Number(petsCount),
          meetAndGreet,
          notes: serviceNote || null,
          promoCode: discountCode || null,
          promotionId: initPromotionId,
          discountPercent,
          desiredArrivalAt: arrivalDate.toISOString(),
          routeDurationMins: durationMins,
          routeCountries,
        })
      });
      if (res.ok) {
        setSubmitSuccess(true);
        // Log the client in with the credentials they just used and send them to their cabinet.
        try {
          const login = await signIn('credentials', {
            email: bookingData.email,
            password: bookingData.password,
            redirect: false,
          });
          if (login?.ok) {
            setTimeout(() => router.push('/profile'), 1600);
            return;
          }
        } catch (loginErr) {
          console.error(loginErr);
        }
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
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 md:gap-10 relative z-10">
          <div className="lg:col-span-2 space-y-6 md:space-y-8">
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
                    className="w-full bg-[#353536]/30 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-[#e4e2e3] focus:border-[#e9c349] outline-none" 
                    placeholder="Місто, вулиця, буд."
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
                          setOriginObj({ lat: parseFloat(r.lat), lng: parseFloat(r.lon), display_name: r.display_name, address: r.address });
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
                    className="w-full bg-[#353536]/30 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-[#e4e2e3] focus:border-[#e9c349] outline-none" 
                    placeholder="Місто, вулиця, буд."
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
                          setDestObj({ lat: parseFloat(r.lat), lng: parseFloat(r.lon), display_name: r.display_name, address: r.address });
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
          
          <div className="lg:col-span-3 flex flex-col h-full justify-end mt-4 lg:mt-0">
            <div className="bg-[#353536]/30 border border-white/10 rounded-2xl relative flex flex-col h-full min-h-[350px]">
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

        {/* Arrival Date */}
        <div className={`relative border-t border-white/10 pt-6 md:pt-8 ${arrivalPickerOpen ? 'z-50' : 'z-10'}`}>
          <div className="grid gap-4 rounded-2xl border border-white/10 bg-[#353536]/30 p-5 md:grid-cols-[1fr_1.2fr] md:items-center">
            <div>
              <h3 className="font-headline-md text-2xl text-[#e4e2e3] flex items-center gap-3">
                <span className="material-symbols-outlined text-[#e9c349]">event_available</span> Час прибуття
              </h3>
              <p className="mt-2 text-sm leading-6 text-[#c7c6ca]">
                Клієнт задає бажаний час прибуття, а система рахує подачу авто, виїзд з бази і доступність машин.
              </p>
            </div>
            <div>
              <label className="block text-xs text-[#c7c6ca] mb-2 font-label-caps uppercase">Бажане прибуття *</label>
              <DatePicker
                selected={arrivalDate}
                onChange={(date: Date | null) => setArrivalDate(date)}
                onCalendarOpen={() => setArrivalPickerOpen(true)}
                onCalendarClose={() => setArrivalPickerOpen(false)}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={30}
                dateFormat="d MMMM yyyy, HH:mm"
                minDate={new Date()}
                className="w-full rounded-xl border border-white/10 bg-[#080818] px-4 py-3 text-white outline-none focus:border-[#e9c349]"
                wrapperClassName="block w-full"
                popperClassName="booking-datepicker-popper"
                calendarClassName="booking-datepicker-calendar"
                popperPlacement="bottom-start"
                placeholderText="Оберіть дату і час"
              />
              {detectedCrossBorder && (
                <div className="mt-3 rounded-xl border border-[#e9c349]/25 bg-[#e9c349]/10 px-4 py-3 text-sm text-[#e4e2e3]">
                  <span className="font-bold text-[#e9c349]">Міжнародний маршрут:</span> митниця і прикордонний час врахуються автоматично.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Passenger & Luggage Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 relative z-10 border-t border-white/10 pt-6 md:pt-8">
          <div className="bg-[#353536]/30 border border-white/10 rounded-xl p-4">
            <label className="block text-xs text-[#c7c6ca] mb-1 font-label-caps uppercase">Дорослі</label>
            <select className="w-full bg-transparent text-white outline-none" value={passengers} onChange={e => setPassengers(e.target.value)}>
              {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n} className="bg-[#1a1a1b]">{n}</option>)}
            </select>
          </div>
          <div className="bg-[#353536]/30 border border-white/10 rounded-xl p-4">
            <label className="block text-xs text-[#c7c6ca] mb-1 font-label-caps uppercase">Діти</label>
            <select className="w-full bg-transparent text-white outline-none" value={children} onChange={e => setChildren(e.target.value)}>
              {[0,1,2,3,4].map(n => <option key={n} value={n} className="bg-[#1a1a1b]">{n}</option>)}
            </select>
          </div>
          <div className="bg-[#353536]/30 border border-white/10 rounded-xl p-4">
            <label className="block text-xs text-[#c7c6ca] mb-1 font-label-caps uppercase">Дитячі крісла (+{selectedCar?.childSeatFee || 15}€)</label>
            <select className="w-full bg-transparent text-white outline-none" value={childSeats} onChange={e => setChildSeats(e.target.value)}>
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
            <label className="block text-xs text-[#c7c6ca] mb-1 font-label-caps uppercase">Тварини (+{selectedCar?.animalFee || 30}€)</label>
            <select className="w-full bg-transparent text-white outline-none" value={petsCount} onChange={e => setPetsCount(e.target.value)}>
              {[0,1,2,3].map(n => <option key={n} value={n} className="bg-[#1a1a1b]">{n}</option>)}
            </select>
          </div>
        </div>

        {/* Route state and promo */}
        <div className="relative z-10 border-t border-white/10 pt-6 md:pt-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {detectedCrossBorder && (
              <div className="rounded-xl border border-[#e9c349]/30 bg-[#e9c349]/10 p-4">
              <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined mt-0.5 text-[#e9c349]">public</span>
                <div>
                    <div className="font-bold text-white">Маршрут включає перетин кордону</div>
                    <div className="mt-1 text-sm text-[#c7c6ca]">Час митниці і міжнародну логіку враховано автоматично.</div>
                </div>
              </div>
            </div>
            )}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input type="text" placeholder="Промокод" value={discountCode} onChange={(e) => setDiscountCode(e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#353536]/30 px-4 py-3 text-[#e4e2e3] outline-none focus:border-[#e9c349] sm:w-[220px]" />
              {discountPercent > 0 && <span className="text-[#e9c349] text-sm">-{discountPercent}% Активовано!</span>}
              {personalDiscountPercent > 0 && <span className="text-[#e9c349] text-sm font-bold">Ваша знижка -{personalDiscountPercent}%</span>}
            </div>
          </div>
        </div>

        {/* Vehicle Selection Row */}
        <div className="space-y-6 relative z-10 border-t border-white/10 pt-6 md:pt-8 animate-fade-in">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h3 className="font-headline-md text-2xl text-[#e4e2e3] flex items-center gap-3">
                <span className="material-symbols-outlined text-[#e9c349]">diamond</span> Доступні автомобілі
              </h3>
              <p className="mt-2 text-sm text-[#8a8a93]">
                Показуємо тільки авто, які відповідають пасажирам, багажу, опціям і не зайняті на розрахований час.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setVehicleClass('all')} className={`rounded-xl border px-4 py-2 text-sm font-bold transition-colors ${vehicleClass === 'all' ? 'border-[#e9c349] bg-[#e9c349] text-black' : 'border-white/10 bg-white/5 text-[#c7c6ca] hover:text-white'}`}>
                Усі
              </button>
              {availableClasses.map((className) => (
                <button key={className} type="button" onClick={() => setVehicleClass(className)} className={`rounded-xl border px-4 py-2 text-sm font-bold transition-colors ${vehicleClass === className ? 'border-[#e9c349] bg-[#e9c349] text-black' : 'border-white/10 bg-white/5 text-[#c7c6ca] hover:text-white'}`}>
                  {className}
                </button>
              ))}
            </div>
          </div>

          {!hasTripBasics ? (
            <div className="rounded-2xl border border-dashed border-white/15 bg-[#353536]/20 p-6 text-center text-[#c7c6ca]">
              Вкажіть маршрут і бажаний час прибуття, тоді система покаже доступні авто під ваші критерії.
            </div>
          ) : checkingVehicleAvailability ? (
            <div className="rounded-2xl border border-white/10 bg-[#353536]/20 p-6 text-center text-[#c7c6ca]">
              <span className="material-symbols-outlined mr-2 align-middle text-[#e9c349]">sync</span>
              Перевіряємо зайнятість автопарку на цей час...
            </div>
          ) : filteredCars.length === 0 ? (
            <div className="rounded-2xl border border-[#e9c349]/20 bg-[#e9c349]/10 p-6 text-center">
              <div className="font-bold text-white">Немає доступних авто під ці умови</div>
              <p className="m-0 mt-2 text-sm text-[#c7c6ca]">Спробуйте інший клас, менше багажу або інший час прибуття.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {filteredCars.map(car => {
                const priceForCar = calculatePriceForCar(car);
                const cover = getCarCover(car);
                const optionChips = [
                  car.allowsChildren ? 'Діти' : null,
                  car.allowsAnimals ? 'Тварини' : null,
                  Number(car.childSeatFee || 0) > 0 ? 'Крісла' : null,
                  Number(car.meetAndGreetFee || 0) > 0 ? 'Зустріч + багаж' : null,
                ].filter(Boolean);
                return (
                <label key={car.id} className="cursor-pointer group">
                  <input type="radio" name="service_class" value={car.id} checked={selectedCarId === car.id} onChange={() => setSelectedCarId(car.id)} className="peer sr-only" />
                  <div className="glass-panel grid h-full min-h-[320px] grid-cols-1 gap-4 overflow-hidden rounded-2xl border border-white/10 p-4 transition-all peer-checked:border-[#e9c349] peer-checked:bg-[#e9c349]/5 peer-checked:shadow-[0_0_20px_rgba(233,195,73,0.15)] group-hover:border-white/30 sm:grid-cols-[150px_minmax(0,1fr)] md:p-5">
                    
                    <div className="relative h-40 w-full overflow-hidden rounded-xl bg-[#1b1b1c] sm:h-full sm:min-h-[210px]">
                      {cover ? (
                        cover.type === 'video' ? (
                          <video src={cover.url} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" muted loop playsInline />
                        ) : (
                          <img src={cover.url} alt={cover.alt || car.model} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        )
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="material-symbols-outlined text-[#46474a] text-4xl">directions_car</span>
                        </div>
                      )}
                      {selectedCarId === car.id && (
                        <span className="material-symbols-outlined absolute right-3 top-3 rounded-full bg-[#080818]/80 text-3xl text-[#e9c349] drop-shadow-[0_0_8px_rgba(233,195,73,0.5)] backdrop-blur">check_circle</span>
                      )}
                    </div>

                    <div className="flex min-w-0 flex-col">
                      <div className="min-w-0">
                        <span className="block break-words font-headline-md text-xl leading-tight text-white md:text-2xl">{car.make}</span>
                        <span className="mt-1 block break-words text-sm font-bold leading-snug text-[#e9c349]">{car.model}</span>
                        <span className="mt-3 inline-flex max-w-full whitespace-normal break-words rounded-full border border-[#e9c349]/25 bg-[#e9c349]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#e9c349]">{car.comfortClass || 'Premium'}</span>
                      </div>
                      
                      <div className="mt-auto space-y-3 pt-4">
                        <div className="flex flex-wrap gap-2 border-t border-white/10 pt-4 text-xs font-bold uppercase tracking-widest text-[#c7c6ca]">
                          <div className="inline-flex items-center gap-1 rounded-lg bg-white/[0.04] px-2.5 py-2" title="Пасажирських місць">
                            <span className="material-symbols-outlined text-lg">person</span> {car.capacity}
                          </div>
                          <div className="inline-flex items-center gap-1 rounded-lg bg-white/[0.04] px-2.5 py-2" title="Валіз">
                            <span className="material-symbols-outlined text-lg">business_center</span> {car.luggageCapacity || 0}
                          </div>
                          <div className="inline-flex items-center gap-1 rounded-lg bg-white/[0.04] px-2.5 py-2" title="Рік випуску">
                            <span className="material-symbols-outlined text-lg">calendar_month</span> {car.year}
                          </div>
                        </div>

                        {optionChips.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {optionChips.map((chip) => (
                              <span key={chip} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-bold text-[#c7c6ca]">
                                {chip}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="flex flex-col gap-1 rounded-xl border border-white/10 bg-[#080818]/60 p-3 sm:flex-row sm:items-end sm:justify-between">
                          <span className="text-[10px] text-[#c7c6ca] uppercase tracking-widest">Орієнтовно</span>
                          <span className={`text-2xl leading-none font-display-lg ${selectedCarId === car.id ? 'text-[#e9c349]' : 'text-white'}`}>
                            € {priceForCar}
                          </span>
                        </div>
                      </div>
                    </div>

                  </div>
                </label>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom Row */}
        <div className="pt-6 md:pt-8 border-t border-white/10 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8 bg-[#353536]/30 p-6 md:p-8 rounded-2xl border border-white/5 backdrop-blur-sm">
            <div className="flex-1 text-center md:text-left">
              <h4 className="font-label-caps text-[12px] text-[#c7c6ca] mb-2 uppercase tracking-widest">
                {personalDiscountPercent > 0 && hasTripBasics ? 'Ваша ціна' : 'Орієнтовна вартість'}
              </h4>
              <div className="relative inline-block">
                <div className="text-5xl md:text-7xl font-display-lg text-white tracking-tight drop-shadow-2xl">
                  € {selectedCar && hasTripBasics ? price : 0}
                </div>
              </div>
              {personalDiscountPercent > 0 && hasTripBasics && (
                <div className="mt-2 text-sm font-bold text-[#e9c349]">Персональна знижка -{personalDiscountPercent}% вже врахована</div>
              )}
            </div>
            <div className="w-full md:w-auto">
              <button 
                onClick={() => setIsModalOpen(true)}
                disabled={!selectedCar || !hasTripBasics || availabilityStatus === 'unavailable'}
                className="gold-button font-button text-[14px] px-6 py-4 md:px-12 md:py-6 rounded-2xl hover:scale-[0.98] transition-all md:text-lg shadow-[0_10px_30px_rgba(212,175,55,0.2)] uppercase tracking-wider font-semibold w-full md:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
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
                <p className="text-[#c7c6ca]">Ми зв'яжемося з вами найближчим часом для підтвердження. Відкриваємо ваш особистий кабінет...</p>
              </div>
            ) : (
              <>
                <h3 className="text-2xl font-headline-md text-white mb-2">Деталі поїздки та Авторизація</h3>
                <p className="text-[#c7c6ca] text-sm mb-6">Будь ласка, заповніть всі деталі для завершення бронювання.</p>
                <form onSubmit={handleBookingSubmit} className="space-y-6">
                  
                  {/* Trip Summary */}
                  <div className="bg-[#080818] p-5 rounded-xl border border-white/5">
                    <div className="mb-4 flex items-start justify-between gap-4">
                      <div>
                        <div className="text-sm font-bold uppercase tracking-widest text-[#e9c349]">Підтвердження маршруту</div>
                        <div className="mt-2 text-white">{selectedCar?.make} {selectedCar?.model}</div>
                        <div className="text-sm text-[#c7c6ca]">{selectedCar?.comfortClass || 'Premium'} • {requiredCapacity} пас. • {luggage}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs uppercase tracking-widest text-[#8a8a93]">Ціна</div>
                        <div className="text-2xl font-display-lg text-[#e9c349]">€ {serverQuote?.price ?? price}</div>
                        {serverQuote && serverQuote.depositAmount > 0 && (
                          <div className="mt-1 text-xs text-[#c7c6ca]">завдаток € {serverQuote.depositAmount}</div>
                        )}
                        {serverQuote && serverQuote.discountPercent > 0 && (
                          <div className="text-xs font-bold text-[#e9c349]">зі знижкою −{serverQuote.discountPercent}%</div>
                        )}
                      </div>
                    </div>

                    {pickupTime && arrivalDate && (
                      <div className="grid gap-2 text-sm">
                        <div className="flex justify-between gap-4">
                          <span className="text-[#c7c6ca]">Бажане прибуття:</span>
                          <span className="text-right font-bold text-white">{arrivalDate.toLocaleString('uk-UA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-[#c7c6ca]">Час подачі авто:</span>
                          <span className="text-right font-bold text-white">{pickupTime.toLocaleString('uk-UA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-[#c7c6ca]">Виїзд авто з бази:</span>
                          <span className="text-right font-bold text-white">
                            {new Date(pickupTime.getTime() - (expenseSnapshot.deliveryDurationMins + expenseSnapshot.prepBufferMins) * 60000).toLocaleString('uk-UA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2">
                            <span className="block text-[#8a8a93]">Митниця</span>
                            <strong className="text-[#e9c349]">{expenseSnapshot.customsWaitHours} год</strong>
                          </div>
                          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2">
                            <span className="block text-[#8a8a93]">Робочий час</span>
                            <strong className="text-[#e9c349]">{expenseSnapshot.billableHours} год</strong>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <label className="flex cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        checked={meetAndGreet}
                        onChange={(e) => {
                          setMeetAndGreet(e.target.checked);
                          if (!e.target.checked) setMeetAndGreetText('');
                        }}
                        className="mt-1 h-5 w-5 rounded border-gray-300 text-[#e9c349] focus:ring-[#e9c349]"
                      />
                      <span>
                        <span className="block font-bold text-white">
                          Зустріч з табличкою та допомога з багажем (+{selectedCar?.meetAndGreetFee || 20}€)
                        </span>
                        <span className="mt-1 block text-sm text-[#c7c6ca]">
                          Водій зустріне клієнта у точці прибуття і допоможе з валізами.
                        </span>
                      </span>
                    </label>
                    {meetAndGreet && (
                      <div className="mt-4">
                        <label className="mb-2 block text-xs font-label-caps uppercase tracking-widest text-[#8a8a93]">Текст на табличці</label>
                        <input
                          type="text"
                          value={meetAndGreetText}
                          onChange={(e) => setMeetAndGreetText(e.target.value)}
                          placeholder="Наприклад: Mr. Smith"
                          className="w-full rounded-xl border border-white/10 bg-[#080818] px-4 py-3 text-white outline-none focus:border-[#e9c349]/60"
                        />
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
