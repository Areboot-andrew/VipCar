import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const demoSeedVersion = '2026-07-03-gallery-demo-v1';
const resetDemoCars = process.env.RESET_DEMO_CARS === 'true';
const forceDemoSeed = process.env.FORCE_DEMO_SEED === 'true';
const autoDemoSeed = process.env.AUTO_DEMO_SEED === 'true';

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

  const driverUser = await prisma.user.upsert({
    where: { email: 'driver@firstline.com' },
    update: {
      name: 'Олександр Петренко',
      phone: '+380671112233',
      role: 'DRIVER',
    },
    create: {
      email: 'driver@firstline.com',
      password: driverPassword,
      name: 'Олександр Петренко',
      phone: '+380671112233',
      role: 'DRIVER',
    },
  });

  const driver = await prisma.driver.upsert({
    where: { userId: driverUser.id },
    update: {
      licenseNum: 'BXR123456',
      salaryPerKm: 0.18,
      status: 'ACTIVE',
    },
    create: {
      userId: driverUser.id,
      licenseNum: 'BXR123456',
      salaryPerKm: 0.18,
      status: 'ACTIVE',
    },
  });

  console.log(`Admin ready: ${admin.email}`);
  console.log(`Driver ready: ${driverUser.email}`);
  return driver;
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

async function seedCars(defaultDriverId: string) {
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

  for (const demoCar of demoCars) {
    const slug = carSlug(demoCar.make, demoCar.model, demoCar.year);
    const images = demoCar.media.filter((item) => !item.url.includes('.mp4')).map((item) => item.url);
    const videos = demoCar.media.filter((item) => item.url.includes('.mp4')).map((item) => item.url);

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
  }
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

async function main() {
  console.log('Starting production-safe demo seed...');
  const existingVersion = await prisma.siteContent.findUnique({ where: { key: '_demo_seed_version' } });
  if (autoDemoSeed && !forceDemoSeed && existingVersion?.value === demoSeedVersion) {
    console.log(`Demo seed ${demoSeedVersion} already applied. Skipping. Set FORCE_DEMO_SEED=true to reapply.`);
    return;
  }

  const driver = await ensureUsers();
  await seedContent();
  await seedCars(driver.id);
  await seedFinanceDefaults();
  await prisma.siteContent.upsert({
    where: { key: '_demo_seed_version' },
    update: { value: demoSeedVersion },
    create: { key: '_demo_seed_version', value: demoSeedVersion },
  });
  console.log('Demo seed complete.');
  console.log('Admin: admin@firstline.com / admin123 (only created if missing)');
  console.log('Driver: driver@firstline.com / driver123 (only created if missing)');
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
