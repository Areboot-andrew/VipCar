import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const demoSeedVersion = '2026-07-03-bookings-demo-v2';
const resetDemoCars = process.env.RESET_DEMO_CARS === 'true';
const resetDemoData = process.env.RESET_DEMO_DATA === 'true';
const forceDemoSeed = process.env.FORCE_DEMO_SEED === 'true';
const autoDemoSeed = process.env.AUTO_DEMO_SEED === 'true';
const demoBookingMarker = '[DEMO_BOOKING]';

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9а-яіїєґ]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
}

function carSlug(make: string, model: string, year?: number | string) {
  return slugify([make, model, year].filter(Boolean).join(' '));
}

function addDays(days: number, hour = 10, minutes = 0) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, minutes, 0, 0);
  return date;
}

function addHours(date: Date, hours: number) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function money(value: number) {
  return Math.round(value * 100) / 100;
}

const demoContent: Record<string, string> = {
  brand_name: 'First Line Transfer',
  logo_url: '/logo.png',
  site_meta_title: 'First Line Transfer - VIP трансфери Європою та Україною',
  site_meta_description:
    'Преміальні трансфери з водієм, комфортний автопарк, прозорий розрахунок маршруту, допомога з багажем і сервіс від дверей до дверей.',
  site_meta_keywords:
    'VIP трансфер, преміум трансфер, авто з водієм, трансфер Європа, трансфер Україна, Mercedes S-Class, Mercedes V-Class',
  site_og_title: 'First Line Transfer - преміум трансфер без компромісів',
  site_og_description: 'Авто бізнес- і VIP-класу для міжміських, міжнародних та аеропортових трансферів.',
  schema_description: 'Преміум трансфер на авто VIP-класу з професійним водієм.',
  schema_area_served: 'UA,PL,DE,CZ,AT,HU,SK,RO,MD',

  menu_services: 'Сервіс',
  menu_fleet: 'Автопарк',
  menu_gallery: 'Галерея',
  menu_contact: 'Контакти',
  menu_calculator: 'Бронювання',
  btn_book_now: 'Забронювати',

  hero_title: 'Преміум *трансфер*\nЄвропою та Україною',
  hero_subtitle:
    'Подача точно вчасно, чистий автомобіль, допомога з багажем і спокійна дорога без зайвого шуму.',
  hero_bg_image: 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&q=80&w=1800',
  btn_hero_cta: 'Розрахувати маршрут',

  services_title: 'Сервіс, де все *по поличках*',
  feature_1_icon: 'Clock3',
  feature_1_title: 'Пунктуальність',
  feature_1_desc: 'Плануємо маршрут, подачу і запас часу так, щоб клієнт не нервував.',
  feature_2_icon: 'BriefcaseBusiness',
  feature_2_title: 'Багаж без хаосу',
  feature_2_desc: 'В адмінці вказується місткість авто, а менеджер одразу бачить реальну логіку посадки.',
  feature_3_icon: 'ShieldCheck',
  feature_3_title: 'Конфіденційність',
  feature_3_desc: 'Поїздки, маршрути і комунікація не розкидані по різних місцях.',
  feature_4_icon: 'Sparkles',
  feature_4_title: 'Преміальний досвід',
  feature_4_desc: 'Чистий салон, вода, зарядки, охайний водій і передбачуваний сервіс.',

  gallery_title: 'Галерея *автопарку*',
  gallery_subtitle:
    'Окремі SEO-сторінки авто, фото з ролями, обкладинки, alt-тексти і логічні переходи з головної.',
  gallery_seo_title: 'Галерея автопарку First Line Transfer',
  gallery_seo_description:
    'Фото і відео демо-автопарку First Line Transfer: Mercedes-Benz S-Class, Mercedes-Benz V-Class, BMW 7 Series, Audi A8 L і Mercedes-Benz Sprinter VIP.',

  contact_section_title: 'Підібрати авто під маршрут',
  contact_section_subtitle:
    'Залиште контакти і коротко опишіть маршрут. Менеджер підбере авто, водія, багажну місткість і точну логіку розрахунку.',
  contact_success_title: 'Заявку отримано',
  contact_success_message: "Ми зв'яжемося з вами, уточнимо деталі і підготуємо пропозицію.",
  contact_phone: '+380 67 000 00 00',
  contact_email: 'office@firstlinetransfer.com',
  footer_text:
    'First Line Transfer - преміальні трансфери з водієм, логічним розрахунком маршруту і прозорою адмінкою.',

  empty_legs_title: 'Гарячі *Empty Legs*',
  empty_legs_book_button: 'Забронювати зі знижкою',
};

const demoCars = [
  {
    make: 'Mercedes-Benz',
    model: 'S-Class W223 Long',
    year: 2024,
    capacity: 4,
    luggageCapacity: 3,
    largeLuggageCapacity: 2,
    baseRate: 2.8,
    fuelType: 'Бензин',
    fuelConsumptionCity: 10.8,
    fuelConsumptionHighway: 7.2,
    fuelTankVolume: 76,
    comfortClass: 'Executive Sedan',
    bodyType: 'Sedan',
    baseCity: 'Львів',
    pricePerPerson: 15,
    crossBorderFee: 180,
    meetAndGreetFee: 25,
    animalFee: 40,
    childSeatFee: 20,
    description:
      '<h2>Mercedes-Benz S-Class W223 Long</h2><p>Флагманський седан для VIP-трансферів, ділових зустрічей, аеропортів і міжнародних маршрутів. Тихий салон, мʼяка посадка, преміальний рівень приватності.</p>',
    features: [
      { icon: 'Armchair', text: 'Комфортні задні сидіння' },
      { icon: 'Wifi', text: 'Wi-Fi та зарядки для пасажирів' },
      { icon: 'ShieldCheck', text: 'Конфіденційність і спокійний стиль водіння' },
      { icon: 'BottleWater', text: 'Вода та базовий travel-набір' },
    ],
    seoTitle: 'Mercedes-Benz S-Class W223 Long - VIP трансфер з водієм',
    seoDescription:
      'Mercedes-Benz S-Class W223 Long для VIP-трансферів. 4 пасажири, до 3 валіз, преміальний салон, комфортні міжміські та міжнародні маршрути.',
    media: [
      {
        url: 'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?auto=format&fit=crop&q=80&w=1800',
        role: 'cover',
        alt: 'Mercedes-Benz S-Class W223 Long чорний седан для VIP трансферу',
        caption: 'Флагманський седан для VIP-маршрутів',
      },
      {
        url: 'https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&q=80&w=1800',
        role: 'exterior',
        alt: 'Mercedes-Benz S-Class зовнішній вигляд',
        caption: 'Стриманий преміальний екстерʼєр',
      },
    ],
  },
  {
    make: 'Mercedes-Benz',
    model: 'V-Class VIP',
    year: 2024,
    capacity: 7,
    luggageCapacity: 7,
    largeLuggageCapacity: 5,
    baseRate: 3.2,
    fuelType: 'Дизель',
    fuelConsumptionCity: 12,
    fuelConsumptionHighway: 8.4,
    fuelTankVolume: 70,
    comfortClass: 'VIP Van',
    bodyType: 'Van',
    baseCity: 'Львів',
    pricePerPerson: 12,
    crossBorderFee: 190,
    meetAndGreetFee: 25,
    animalFee: 45,
    childSeatFee: 20,
    description:
      '<h2>Mercedes-Benz V-Class VIP</h2><p>Правильний вибір для сімей, бізнес-груп, аеропортових трансферів і маршрутів з великим багажем. Багато простору без втрати преміального відчуття.</p>',
    features: [
      { icon: 'Users', text: 'До 7 пасажирів' },
      { icon: 'BriefcaseBusiness', text: 'Багато місця для валіз' },
      { icon: 'Baby', text: 'Дитячі крісла за запитом' },
      { icon: 'Route', text: 'Зручний для довгих маршрутів' },
    ],
    seoTitle: 'Mercedes-Benz V-Class VIP - трансфер для груп і сімей',
    seoDescription:
      'Mercedes-Benz V-Class VIP для групових трансферів. 7 пасажирів, до 7 валіз, комфорт для сімей, делегацій і аеропортів.',
    media: [
      {
        url: 'https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&q=80&w=1800',
        role: 'cover',
        alt: 'Mercedes-Benz V-Class VIP для трансферу груп',
        caption: 'VIP van для групових маршрутів',
      },
      {
        url: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=1800',
        role: 'gallery',
        alt: 'Преміальний автомобіль на дорозі',
        caption: 'Комфорт у місті та на трасі',
      },
    ],
  },
  {
    make: 'BMW',
    model: '7 Series G70',
    year: 2024,
    capacity: 4,
    luggageCapacity: 3,
    largeLuggageCapacity: 2,
    baseRate: 2.9,
    fuelType: 'Дизель',
    fuelConsumptionCity: 9.6,
    fuelConsumptionHighway: 6.4,
    fuelTankVolume: 74,
    comfortClass: 'Executive Sedan',
    bodyType: 'Sedan',
    baseCity: 'Київ',
    pricePerPerson: 15,
    crossBorderFee: 170,
    meetAndGreetFee: 25,
    animalFee: 40,
    childSeatFee: 20,
    description:
      '<h2>BMW 7 Series G70</h2><p>Преміальний седан з акцентом на динаміку, тишу в салоні та сучасний бізнес-стиль. Добре підходить для швидких міжміських маршрутів.</p>',
    features: [
      { icon: 'Gauge', text: 'Сильна динаміка на трасі' },
      { icon: 'Volume2', text: 'Тихий салон' },
      { icon: 'Star', text: 'Преміальний імідж' },
      { icon: 'PlugZap', text: 'Зарядки для гаджетів' },
    ],
    seoTitle: 'BMW 7 Series G70 - преміальний трансфер',
    seoDescription:
      'BMW 7 Series G70 для VIP-трансферів. 4 пасажири, дизель, комфортний салон і динаміка для міжміських маршрутів.',
    media: [
      {
        url: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&q=80&w=1800',
        role: 'cover',
        alt: 'BMW 7 Series G70 для преміального трансферу',
        caption: 'Динамічний бізнес-седан',
      },
      {
        url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=1800',
        role: 'exterior',
        alt: 'BMW преміальний седан екстерʼєр',
        caption: 'Для швидких і статусних маршрутів',
      },
    ],
  },
  {
    make: 'Audi',
    model: 'A8 L',
    year: 2023,
    capacity: 4,
    luggageCapacity: 3,
    largeLuggageCapacity: 2,
    baseRate: 2.6,
    fuelType: 'Дизель',
    fuelConsumptionCity: 10,
    fuelConsumptionHighway: 6.8,
    fuelTankVolume: 72,
    comfortClass: 'Business Sedan',
    bodyType: 'Sedan',
    baseCity: 'Варшава',
    pricePerPerson: 14,
    crossBorderFee: 160,
    meetAndGreetFee: 25,
    animalFee: 40,
    childSeatFee: 20,
    description:
      '<h2>Audi A8 L</h2><p>Стриманий преміум для клієнтів, які хочуть комфорт і статус без зайвої демонстративності. Добре працює для бізнес-маршрутів і трансферів між містами.</p>',
    features: [
      { icon: 'BadgeCheck', text: 'Стриманий бізнес-стиль' },
      { icon: 'MapPinned', text: 'Зручний для міжнародних маршрутів' },
      { icon: 'Shield', text: 'Спокійна приватна атмосфера' },
    ],
    seoTitle: 'Audi A8 L - бізнес трансфер з водієм',
    seoDescription:
      'Audi A8 L для бізнес- і VIP-трансферів. 4 пасажири, до 3 валіз, комфортний седан для міжнародних маршрутів.',
    media: [
      {
        url: 'https://images.unsplash.com/photo-1606220838315-056192d5e927?auto=format&fit=crop&q=80&w=1800',
        role: 'cover',
        alt: 'Audi A8 L бізнес седан для трансферу',
        caption: 'Стриманий бізнес-клас',
      },
      {
        url: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&q=80&w=1800',
        role: 'gallery',
        alt: 'Преміальний седан у русі',
        caption: 'Комфортний формат для ділових поїздок',
      },
    ],
  },
  {
    make: 'Mercedes-Benz',
    model: 'Sprinter VIP',
    year: 2024,
    capacity: 12,
    luggageCapacity: 12,
    largeLuggageCapacity: 10,
    baseRate: 4.2,
    fuelType: 'Дизель',
    fuelConsumptionCity: 13.5,
    fuelConsumptionHighway: 9.5,
    fuelTankVolume: 93,
    comfortClass: 'VIP Bus',
    bodyType: 'Minibus',
    baseCity: 'Львів',
    pricePerPerson: 10,
    crossBorderFee: 240,
    meetAndGreetFee: 30,
    animalFee: 60,
    childSeatFee: 20,
    description:
      '<h2>Mercedes-Benz Sprinter VIP</h2><p>Великий VIP-мікроавтобус для делегацій, подій, групових трансферів і міжнародних маршрутів з великим багажем.</p>',
    features: [
      { icon: 'UsersRound', text: 'До 12 пасажирів' },
      { icon: 'Luggage', text: 'Великий багажний простір' },
      { icon: 'Route', text: 'Зручний для міжнародних маршрутів' },
      { icon: 'Coffee', text: 'Комфорт для довгої дороги' },
    ],
    seoTitle: 'Mercedes-Benz Sprinter VIP - трансфер для делегацій',
    seoDescription:
      'Mercedes-Benz Sprinter VIP для делегацій і груп. До 12 пасажирів, великий багажний простір, комфортні міжнародні маршрути.',
    media: [
      {
        url: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&q=80&w=1800',
        role: 'cover',
        alt: 'Mercedes-Benz Sprinter VIP для делегацій',
        caption: 'VIP-мікроавтобус для груп',
      },
      {
        url: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&q=80&w=1800',
        role: 'gallery',
        alt: 'Преміальний транспорт для групових маршрутів',
        caption: 'Для подій, делегацій і довгих маршрутів',
      },
    ],
  },
];

async function ensureUsers() {
  const adminPassword = await bcrypt.hash('admin123', 10);
  const driverPassword = await bcrypt.hash('driver123', 10);
  const clientPassword = await bcrypt.hash('client123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@firstline.com' },
    update: {},
    create: {
      email: 'admin@firstline.com',
      password: adminPassword,
      name: 'Адміністратор',
      phone: '+380991234567',
      role: 'ADMIN',
    },
  });

  const driverSeeds = [
    {
      email: 'driver@firstline.com',
      name: 'Олександр Петренко',
      phone: '+380671112233',
      licenseNum: 'BXR123456',
      salaryPerKm: 0.18,
      telegramId: '100100100',
    },
    {
      email: 'driver.ivan@firstline.com',
      name: 'Іван Коваль',
      phone: '+380672224466',
      licenseNum: 'KVL778899',
      salaryPerKm: 0.16,
      telegramId: '200200200',
    },
    {
      email: 'driver.marek@firstline.com',
      name: 'Marek Nowak',
      phone: '+48501112233',
      licenseNum: 'PL554433',
      salaryPerKm: 0.22,
      telegramId: '300300300',
    },
  ];

  const drivers = [];
  for (const item of driverSeeds) {
    const driverUser = await prisma.user.upsert({
      where: { email: item.email },
      update: {
        name: item.name,
        phone: item.phone,
        role: 'DRIVER',
      },
      create: {
        email: item.email,
        password: driverPassword,
        name: item.name,
        phone: item.phone,
        role: 'DRIVER',
      },
    });

    const driver = await prisma.driver.upsert({
      where: { userId: driverUser.id },
      update: {
        licenseNum: item.licenseNum,
        salaryPerKm: item.salaryPerKm,
        telegramId: item.telegramId,
        status: 'ACTIVE',
      },
      create: {
        userId: driverUser.id,
        licenseNum: item.licenseNum,
        salaryPerKm: item.salaryPerKm,
        telegramId: item.telegramId,
        status: 'ACTIVE',
      },
    });
    drivers.push(driver);
  }

  const clientSeeds = [
    { email: 'client.olena@example.com', name: 'Олена Савчук', phone: '+380501112233' },
    { email: 'client.andriy@example.com', name: 'Андрій Мельник', phone: '+380631234567' },
    { email: 'client.marta@example.com', name: 'Marta Zielinska', phone: '+48500111222' },
  ];

  const clients = [];
  for (const item of clientSeeds) {
    const client = await prisma.user.upsert({
      where: { email: item.email },
      update: {
        name: item.name,
        phone: item.phone,
        role: 'CLIENT',
      },
      create: {
        email: item.email,
        password: clientPassword,
        name: item.name,
        phone: item.phone,
        role: 'CLIENT',
      },
    });
    clients.push(client);
  }

  console.log(`Admin ready: ${admin.email}`);
  console.log(`Drivers ready: ${drivers.length}`);
  console.log(`Clients ready: ${clients.length}`);
  return { admin, drivers, clients };
}

async function seedContent() {
  const entries = Object.entries(demoContent);
  for (const [key, value] of entries) {
    await prisma.siteContent.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }
  console.log(`CMS demo content updated: ${entries.length} keys`);
}

async function seedCars(drivers: { id: string }[]) {
  const demoSlugs = demoCars.map((car) => carSlug(car.make, car.model, car.year));

  if (resetDemoCars) {
    await prisma.car.deleteMany({
      where: {
        slug: { notIn: demoSlugs },
        bookings: { none: {} },
        promotions: { none: {} },
      },
    });
    console.log('RESET_DEMO_CARS=true: removed old cars without bookings/promotions');
  }

  const seededCars = [];
  for (const [carIndex, demoCar] of demoCars.entries()) {
    const slug = carSlug(demoCar.make, demoCar.model, demoCar.year);
    const images = demoCar.media.filter((item) => !item.url.includes('.mp4')).map((item) => item.url);
    const videos = demoCar.media.filter((item) => item.url.includes('.mp4')).map((item) => item.url);
    const defaultDriverId = drivers[carIndex % drivers.length]?.id || null;

    const car = await prisma.car.upsert({
      where: { slug },
      update: {
        slug,
        make: demoCar.make,
        model: demoCar.model,
        year: demoCar.year,
        capacity: demoCar.capacity,
        luggageCapacity: demoCar.luggageCapacity,
        largeLuggageCapacity: demoCar.largeLuggageCapacity,
        baseRate: demoCar.baseRate,
        fuelType: demoCar.fuelType,
        fuelConsumptionCity: demoCar.fuelConsumptionCity,
        fuelConsumptionHighway: demoCar.fuelConsumptionHighway,
        fuelTankVolume: demoCar.fuelTankVolume,
        comfortClass: demoCar.comfortClass,
        bodyType: demoCar.bodyType,
        status: 'AVAILABLE',
        pricePerPerson: demoCar.pricePerPerson,
        crossBorderFee: demoCar.crossBorderFee,
        meetAndGreetFee: demoCar.meetAndGreetFee,
        animalFee: demoCar.animalFee,
        childSeatFee: demoCar.childSeatFee,
        baseCity: demoCar.baseCity,
        description: demoCar.description,
        features: JSON.stringify(demoCar.features),
        seoTitle: demoCar.seoTitle,
        seoDescription: demoCar.seoDescription,
        defaultDriverId,
        images,
        videos,
      },
      create: {
        slug,
        make: demoCar.make,
        model: demoCar.model,
        year: demoCar.year,
        capacity: demoCar.capacity,
        luggageCapacity: demoCar.luggageCapacity,
        largeLuggageCapacity: demoCar.largeLuggageCapacity,
        baseRate: demoCar.baseRate,
        fuelType: demoCar.fuelType,
        fuelConsumptionCity: demoCar.fuelConsumptionCity,
        fuelConsumptionHighway: demoCar.fuelConsumptionHighway,
        fuelTankVolume: demoCar.fuelTankVolume,
        comfortClass: demoCar.comfortClass,
        bodyType: demoCar.bodyType,
        status: 'AVAILABLE',
        pricePerPerson: demoCar.pricePerPerson,
        crossBorderFee: demoCar.crossBorderFee,
        meetAndGreetFee: demoCar.meetAndGreetFee,
        animalFee: demoCar.animalFee,
        childSeatFee: demoCar.childSeatFee,
        baseCity: demoCar.baseCity,
        description: demoCar.description,
        features: JSON.stringify(demoCar.features),
        seoTitle: demoCar.seoTitle,
        seoDescription: demoCar.seoDescription,
        defaultDriverId,
        images,
        videos,
      },
    });

    await prisma.carMedia.deleteMany({ where: { carId: car.id } });
    await prisma.carMedia.createMany({
      data: demoCar.media.map((item, index) => ({
        carId: car.id,
        type: item.url.includes('.mp4') ? 'video' : 'image',
        url: item.url,
        role: item.role,
        isCover: item.role === 'cover' || index === 0,
        order: index,
        alt: item.alt,
        title: `${demoCar.make} ${demoCar.model}`,
        caption: item.caption,
        active: true,
      })),
    });

    await prisma.carReview.deleteMany({ where: { carId: car.id } });
    await prisma.carReview.createMany({
      data: [
        {
          carId: car.id,
          author: 'Ірина К.',
          rating: 5,
          text: 'Авто подали чистим, водій допоміг з багажем, маршрут пройшов спокійно і без затримок.',
        },
        {
          carId: car.id,
          author: 'Andriy M.',
          rating: 5,
          text: 'Дуже зручний трансфер для довгої дороги. Все виглядало так, як на фото.',
        },
      ],
    });

    console.log(`Demo car updated: ${car.make} ${car.model}`);
    seededCars.push(car);
  }

  return seededCars;
}

async function seedFinanceDefaults() {
  await prisma.currencyRate.upsert({
    where: { currency: 'UAH' },
    update: { rateToEur: 45.5 },
    create: { currency: 'UAH', rateToEur: 45.5 },
  });
  await prisma.currencyRate.upsert({
    where: { currency: 'PLN' },
    update: { rateToEur: 4.25 },
    create: { currency: 'PLN', rateToEur: 4.25 },
  });

  const fuelPrices = [
    { country: 'Україна', fuelType: 'Бензин', priceEur: 1.35 },
    { country: 'Україна', fuelType: 'Дизель', priceEur: 1.42 },
    { country: 'Польща', fuelType: 'Бензин', priceEur: 1.55 },
    { country: 'Польща', fuelType: 'Дизель', priceEur: 1.58 },
    { country: 'Німеччина', fuelType: 'Бензин', priceEur: 1.82 },
    { country: 'Німеччина', fuelType: 'Дизель', priceEur: 1.72 },
    { country: 'Європа', fuelType: 'Електро', priceEur: 0.48 },
  ];

  for (const item of fuelPrices) {
    await prisma.fuelPrice.upsert({
      where: { country_fuelType: { country: item.country, fuelType: item.fuelType } },
      update: { priceEur: item.priceEur },
      create: item,
    });
  }

  console.log('Currency and fuel demo defaults updated');
}

async function resetDemoOperationalData() {
  if (!resetDemoData) return;

  await prisma.message.deleteMany({});
  await prisma.chatRoom.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.booking.deleteMany({});
  await prisma.settlement.deleteMany({});
  await prisma.promotion.deleteMany({});
  await prisma.feedback.deleteMany({});
  await prisma.carReview.deleteMany({});
  await prisma.carMedia.deleteMany({});
  await prisma.car.deleteMany({});
  console.log('RESET_DEMO_DATA=true: operational demo data removed');
}

async function clearDemoBookings() {
  const demoBookings = await prisma.booking.findMany({
    where: { notes: { contains: demoBookingMarker } },
    select: { id: true },
  });
  const bookingIds = demoBookings.map((booking) => booking.id);
  if (bookingIds.length === 0) return;

  await prisma.message.deleteMany({ where: { chatRoom: { bookingId: { in: bookingIds } } } });
  await prisma.chatRoom.deleteMany({ where: { bookingId: { in: bookingIds } } });
  await prisma.invoice.deleteMany({ where: { bookingId: { in: bookingIds } } });
  await prisma.booking.deleteMany({ where: { id: { in: bookingIds } } });
  console.log(`Removed old demo bookings: ${bookingIds.length}`);
}

function calculateDemoCosts(car: any, driver: any, distance: number, deliveryDistance: number, options: { children?: number; animals?: boolean; crossBorder?: boolean; meet?: boolean; extraPassengers?: number }) {
  const cityKm = distance * 0.3;
  const highwayKm = distance * 0.7;
  const liters = (cityKm / 100) * car.fuelConsumptionCity + (highwayKm / 100) * car.fuelConsumptionHighway;
  const fuelPrice = car.fuelType === 'Дизель' ? 1.58 : car.fuelType === 'Електро' ? 0.48 : 1.55;
  const fuelCost = money(liters * fuelPrice);
  const driverSalary = money((distance + deliveryDistance) * (driver.salaryPerKm || 0.18));
  const deliveryCost = money(deliveryDistance * 1.1);
  const amortization = money(distance * 0.08);
  const optionCost =
    (options.children || 0) * car.childSeatFee +
    (options.animals ? car.animalFee : 0) +
    (options.crossBorder ? car.crossBorderFee : 0) +
    (options.meet ? car.meetAndGreetFee : 0) +
    (options.extraPassengers || 0) * car.pricePerPerson;
  const netProfit = money(distance * car.baseRate * 0.28);
  const price = money(fuelCost + driverSalary + deliveryCost + amortization + optionCost + netProfit);

  return { fuelCost, driverSalary, deliveryCost, amortization, netProfit, price };
}

async function seedBookings(cars: any[], drivers: any[], clients: any[]) {
  await clearDemoBookings();

  const bySlug = new Map(cars.map((car) => [car.slug, car]));
  const bookings = [
    {
      client: clients[0],
      driver: drivers[0],
      car: bySlug.get(carSlug('Mercedes-Benz', 'S-Class W223 Long', 2024)) || cars[0],
      routeFrom: 'Львів, Україна',
      routeTo: 'Краків, Польща',
      routeCountries: ['Україна', 'Польща'],
      distance: 330,
      deliveryDistance: 12,
      dateStart: addDays(1, 9, 30),
      durationHours: 5.5,
      passengers: 2,
      children: 0,
      luggage: '2 валізи + ручна поклажа',
      animals: false,
      status: 'CONFIRMED' as const,
      invoiceStatus: 'UNPAID' as const,
      options: { crossBorder: true, meet: true, extraPassengers: 1 },
      driverNotes: 'Зустріти біля головного входу, допомогти з багажем.',
    },
    {
      client: clients[1],
      driver: drivers[1],
      car: bySlug.get(carSlug('Mercedes-Benz', 'V-Class VIP', 2024)) || cars[1],
      routeFrom: 'Бориспіль, Terminal D',
      routeTo: 'Київ, Hyatt Regency',
      routeCountries: ['Україна'],
      distance: 38,
      deliveryDistance: 8,
      dateStart: addDays(2, 18, 0),
      durationHours: 1.25,
      passengers: 5,
      children: 1,
      luggage: '5 валіз',
      animals: false,
      status: 'PENDING' as const,
      invoiceStatus: 'UNPAID' as const,
      options: { children: 1, meet: true, extraPassengers: 4 },
      driverNotes: 'Табличка First Line Transfer, дитяче крісло в салоні.',
    },
    {
      client: clients[2],
      driver: drivers[2],
      car: bySlug.get(carSlug('BMW', '7 Series G70', 2024)) || cars[2],
      routeFrom: 'Warszawa, Centrum',
      routeTo: 'Berlin Brandenburg Airport',
      routeCountries: ['Польща', 'Німеччина'],
      distance: 575,
      deliveryDistance: 18,
      dateStart: addDays(4, 7, 45),
      durationHours: 6.5,
      passengers: 1,
      children: 0,
      luggage: '1 валіза',
      animals: true,
      status: 'CONFIRMED' as const,
      invoiceStatus: 'PAID' as const,
      options: { animals: true, crossBorder: true },
      driverNotes: 'Клієнт їде з маленькою собакою, підготувати плед.',
    },
    {
      client: clients[0],
      driver: drivers[0],
      car: bySlug.get(carSlug('Mercedes-Benz', 'Sprinter VIP', 2024)) || cars[4] || cars[0],
      routeFrom: 'Львів, Opera Hotel',
      routeTo: 'Буковель',
      routeCountries: ['Україна'],
      distance: 245,
      deliveryDistance: 15,
      dateStart: addDays(7, 8, 0),
      durationHours: 4.5,
      passengers: 10,
      children: 2,
      luggage: '10 великих валіз + лижі',
      animals: false,
      status: 'PENDING' as const,
      invoiceStatus: 'UNPAID' as const,
      options: { children: 2, extraPassengers: 9 },
      driverNotes: 'Група з лижами. Перевірити багажний простір перед подачею.',
    },
    {
      client: clients[1],
      driver: drivers[1],
      car: bySlug.get(carSlug('Audi', 'A8 L', 2023)) || cars[3] || cars[0],
      routeFrom: 'Київ, InterContinental',
      routeTo: 'Одеса, Морський вокзал',
      routeCountries: ['Україна'],
      distance: 475,
      deliveryDistance: 5,
      dateStart: addDays(-2, 10, 0),
      durationHours: 6,
      passengers: 2,
      children: 0,
      luggage: '2 валізи',
      animals: false,
      status: 'COMPLETED' as const,
      invoiceStatus: 'PAID' as const,
      options: { extraPassengers: 1 },
      driverNotes: 'Поїздку завершено, клієнт просив такий самий клас авто наступного разу.',
    },
  ];

  for (const item of bookings) {
    const costs = calculateDemoCosts(item.car, item.driver, item.distance, item.deliveryDistance, item.options);
    const dateEnd = addHours(item.dateStart, item.durationHours);
    const booking = await prisma.booking.create({
      data: {
        clientId: item.client.id,
        driverId: item.driver.id,
        carId: item.car.id,
        routeFrom: item.routeFrom,
        routeTo: item.routeTo,
        routeCountries: item.routeCountries,
        distance: item.distance,
        price: costs.price,
        dateStart: item.dateStart,
        dateEnd,
        fuelCost: costs.fuelCost,
        driverSalary: costs.driverSalary,
        deliveryCost: costs.deliveryCost,
        deliveryDistance: item.deliveryDistance,
        amortization: costs.amortization,
        netProfit: costs.netProfit,
        passengers: item.passengers,
        children: item.children,
        luggage: item.luggage,
        animals: item.animals,
        status: item.status,
        notes: `${demoBookingMarker} Demo route for calculator/calendar testing.`,
        driverNotes: item.driverNotes,
        carStartLocation: item.car.baseCity || 'Львів',
        expenseDeliveryDistance: item.deliveryDistance,
        totalExpenseDistance: item.distance + item.deliveryDistance,
        isEndingAtBase: false,
        returnToBaseDistance: Math.round(item.distance * 0.12),
      },
    });

    await prisma.invoice.create({
      data: {
        bookingId: booking.id,
        amount: costs.price,
        status: item.invoiceStatus,
      },
    });

    const chatRoom = await prisma.chatRoom.create({
      data: {
        bookingId: booking.id,
        platform: 'WEB',
        clientName: item.client.name,
        clientPhone: item.client.phone,
      },
    });

    await prisma.message.createMany({
      data: [
        {
          chatRoomId: chatRoom.id,
          senderId: item.client.id,
          isFromAdmin: false,
          content: `Доброго дня. Потрібен трансфер: ${item.routeFrom} → ${item.routeTo}.`,
        },
        {
          chatRoomId: chatRoom.id,
          isFromAdmin: true,
          content: `Дякуємо, маршрут внесено. Орієнтовна ціна: €${costs.price}.`,
        },
      ],
    });
  }

  console.log(`Demo bookings created: ${bookings.length}`);
}

async function main() {
  console.log('Starting production-safe demo seed...');
  const existingVersion = await prisma.siteContent.findUnique({ where: { key: '_demo_seed_version' } });
  if (autoDemoSeed && !forceDemoSeed && !resetDemoData && !resetDemoCars && existingVersion?.value === demoSeedVersion) {
    console.log(`Demo seed ${demoSeedVersion} already applied. Skipping. Set FORCE_DEMO_SEED=true to reapply.`);
    return;
  }

  await resetDemoOperationalData();
  const { drivers, clients } = await ensureUsers();
  await seedContent();
  const cars = await seedCars(drivers);
  await seedBookings(cars, drivers, clients);
  await seedFinanceDefaults();
  await prisma.siteContent.upsert({
    where: { key: '_demo_seed_version' },
    update: { value: demoSeedVersion },
    create: { key: '_demo_seed_version', value: demoSeedVersion },
  });
  console.log('Demo seed complete.');
  console.log('Admin: admin@firstline.com / admin123 (only created if missing)');
  console.log('Drivers: driver@firstline.com / driver123, driver.ivan@firstline.com / driver123, driver.marek@firstline.com / driver123');
  console.log('Clients: client.olena@example.com / client123, client.andriy@example.com / client123, client.marta@example.com / client123');
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
