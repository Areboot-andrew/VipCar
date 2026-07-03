import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { carSlug } from '../src/lib/slug';

const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Починаємо наповнення бази даних...\n');

  const adminPassword = await bcrypt.hash('admin123', 10);
  const driverPassword = await bcrypt.hash('driver123', 10);

  // ==========================================
  // 1. ADMIN USER
  // ==========================================
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
  console.log('✅ Адмін створений:', admin.email);

  // ==========================================
  // 2. CARS (Автопарк)
  // ==========================================
  const carsData = [
    {
      make: 'Mercedes-Benz',
      model: 'S-Class W223 Long',
      year: 2024,
      slug: carSlug('Mercedes-Benz', 'S-Class W223 Long', 2024),
      capacity: 4,
      luggageCapacity: 3,
      largeLuggageCapacity: 2,
      baseRate: 2.50,
      fuelType: 'Бензин', fuelConsumptionCity: 10.5, fuelConsumptionHighway: 7.5,
      fuelTankVolume: 76,
      comfortClass: 'Executive Sedan',
      bodyType: 'Sedan',
      baseCity: 'Львів',
      status: 'AVAILABLE',
      description: '<h2>Mercedes-Benz S-Class для VIP-трансферів</h2><p>Тихий салон, комфортні задні місця, преміальна посадка і формат для ділових поїздок, зустрічей в аеропорту та міжнародних маршрутів.</p>',
      features: JSON.stringify([
        { icon: 'Armchair', text: 'Комфортні задні сидіння' },
        { icon: 'Wifi', text: 'Wi-Fi та зарядки' },
        { icon: 'ShieldCheck', text: 'Конфіденційність' },
      ]),
      seoTitle: 'Mercedes-Benz S-Class W223 Long - VIP трансфер',
      seoDescription: 'Mercedes-Benz S-Class W223 Long для преміальних трансферів з водієм. 4 місця, до 3 валіз, комфортний салон і бізнес-рівень сервісу.',
      images: [
        'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?auto=format&fit=crop&q=80&w=1400',
        'https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&q=80&w=1400',
      ],
      videos: [],
    },
    {
      make: 'Mercedes-Benz',
      model: 'V-Class VIP',
      year: 2024,
      slug: carSlug('Mercedes-Benz', 'V-Class VIP', 2024),
      capacity: 7,
      luggageCapacity: 7,
      largeLuggageCapacity: 5,
      baseRate: 3.00,
      fuelType: 'Дизель', fuelConsumptionCity: 12.0, fuelConsumptionHighway: 8.5,
      fuelTankVolume: 70,
      comfortClass: 'VIP Van',
      bodyType: 'Van',
      baseCity: 'Львів',
      status: 'AVAILABLE',
      description: '<h2>Mercedes-Benz V-Class VIP для груп і сімей</h2><p>Оптимальний варіант для аеропортів, бізнес-делегацій, сімей з дітьми та поїздок з великим багажем.</p>',
      features: JSON.stringify([
        { icon: 'Users', text: 'До 7 пасажирів' },
        { icon: 'BriefcaseBusiness', text: 'Багато місця для багажу' },
        { icon: 'Baby', text: 'Дитячі крісла за запитом' },
      ]),
      seoTitle: 'Mercedes-Benz V-Class VIP - трансфер для груп',
      seoDescription: 'Mercedes-Benz V-Class VIP для групових трансферів. 7 місць, великий багажний простір, комфорт для сімей та бізнес-делегацій.',
      images: [
        'https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&q=80&w=1400',
        'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=1400',
      ],
      videos: [],
    },
    {
      make: 'BMW',
      model: '7 Series G70',
      year: 2024,
      slug: carSlug('BMW', '7 Series G70', 2024),
      capacity: 4,
      luggageCapacity: 3,
      largeLuggageCapacity: 2,
      baseRate: 2.70,
      fuelType: 'Дизель', fuelConsumptionCity: 9.5, fuelConsumptionHighway: 6.5,
      fuelTankVolume: 74,
      comfortClass: 'Executive Sedan',
      bodyType: 'Sedan',
      baseCity: 'Київ',
      status: 'AVAILABLE',
      description: '<h2>BMW 7 Series для швидких преміальних маршрутів</h2><p>Динамічний седан бізнес-класу з комфортною посадкою, тишею в салоні та сильним іміджевим ефектом.</p>',
      features: JSON.stringify([
        { icon: 'Gauge', text: 'Динаміка на трасі' },
        { icon: 'Volume2', text: 'Тихий салон' },
        { icon: 'Star', text: 'Преміальний імідж' },
      ]),
      seoTitle: 'BMW 7 Series G70 - преміальний трансфер',
      seoDescription: 'BMW 7 Series G70 для VIP-трансферів. 4 місця, дизель, комфортний салон і сильна динаміка для міжміських маршрутів.',
      images: [
        'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&q=80&w=1400',
        'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=1400',
      ],
      videos: [],
    },
    {
      make: 'Mercedes-Benz',
      model: 'Sprinter VIP',
      year: 2024,
      slug: carSlug('Mercedes-Benz', 'Sprinter VIP', 2024),
      capacity: 12,
      luggageCapacity: 12,
      largeLuggageCapacity: 10,
      baseRate: 4.00,
      fuelType: 'Дизель', fuelConsumptionCity: 13.5, fuelConsumptionHighway: 9.5,
      fuelTankVolume: 93,
      comfortClass: 'VIP Bus',
      bodyType: 'Minibus',
      baseCity: 'Львів',
      status: 'AVAILABLE',
      description: '<h2>Mercedes-Benz Sprinter VIP для великих груп</h2><p>Комфортний мікроавтобус для делегацій, подій, трансферів між містами та маршрутів з великим багажем.</p>',
      features: JSON.stringify([
        { icon: 'UsersRound', text: 'До 12 пасажирів' },
        { icon: 'Luggage', text: 'Великий багажний простір' },
        { icon: 'Route', text: 'Зручний для міжнародних маршрутів' },
      ]),
      seoTitle: 'Mercedes-Benz Sprinter VIP - трансфер для делегацій',
      seoDescription: 'Mercedes-Benz Sprinter VIP для великих груп і делегацій. До 12 пасажирів, великий багажний простір, комфортні міжнародні маршрути.',
      images: [
        'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&q=80&w=1400',
        'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&q=80&w=1400',
      ],
      videos: [],
    },
  ];

  const seededSlugs = carsData.map((car) => car.slug);
  await prisma.car.deleteMany({
    where: {
      slug: { notIn: seededSlugs },
      bookings: { none: {} },
      promotions: { none: {} },
    },
  });

  for (const carData of carsData) {
    const { images, videos, ...data } = carData;
    const car = await prisma.car.upsert({
      where: { slug: carData.slug },
      update: {
        ...data,
        images,
        videos,
      },
      create: {
        ...data,
        images,
        videos,
      },
    });

    await prisma.carMedia.deleteMany({ where: { carId: car.id } });
    await prisma.carMedia.createMany({
      data: images.map((url, index) => ({
        carId: car.id,
        type: 'image',
        url,
        role: index === 0 ? 'cover' : 'gallery',
        isCover: index === 0,
        order: index,
        alt: `${car.make} ${car.model} ${index === 0 ? 'cover' : 'gallery'}`,
        title: `${car.make} ${car.model}`,
        caption: index === 0 ? `${car.make} ${car.model} для VIP-трансферу` : 'Деталі автопарку First Line Transfer',
      })),
    });
    console.log(`✅ Авто оновлено: ${car.make} ${car.model}`);
  }

  // ==========================================
  // 3. SITE CONTENT (CMS Тексти)
  // ==========================================
  const contentEntries = [
    // Бренд
    { key: 'brand_name', value: 'First Line Transfer' },
    { key: 'logo_url', value: '' },

    // Меню
    { key: 'menu_services', value: 'Послуги' },
    { key: 'menu_fleet', value: 'Автопарк' },
    { key: 'menu_gallery', value: 'Галерея' },
    { key: 'menu_contact', value: 'Контакти' },
    { key: 'menu_calculator', value: 'Бронювання' },
    { key: 'btn_book_now', value: 'Бронювати' },

    // Hero
    { key: 'hero_title', value: 'ПРЕМІУМ ТРАНСФЕР<br/><span style="color: #e9c349">БЕЗ КОМПРОМІСІВ</span>' },
    { key: 'hero_subtitle', value: 'Ваш час. Ваші правила. Ідеальний сервіс від дверей до дверей з гарантованою пунктуальністю.' },
    { key: 'hero_bg_image', value: '' },
    { key: 'hero_bg_video', value: '' },
    { key: 'btn_hero_cta', value: 'Розрахувати вартість' },

    // Features
    // Features
    { key: 'services_title', value: 'First Line Transfer — це *преміум-трансфер* від дверей до дверей, де все працює за *вашими* правилами:' },
    { key: 'feature_1_icon', value: 'schedule' },
    { key: 'feature_1_title', value: 'Пунктуальність 10/10' },
    { key: 'feature_1_desc', value: 'Ми цінуємо ваш час, тому авто буде на місці хвилину в хвилину.' },
    { key: 'feature_2_icon', value: 'workspace_premium' },
    { key: 'feature_2_title', value: 'Турбота з першої секунди' },
    { key: 'feature_2_desc', value: 'Водій допоможе з важким багажем та організує простір під вас.' },
    { key: 'feature_3_icon', value: 'event_available' },
    { key: 'feature_3_title', value: 'Гнучкість' },
    { key: 'feature_3_desc', value: 'Ми підлаштовуємося під ваш графік і форс-мажори, а не навпаки.' },
    { key: 'feature_4_icon', value: 'verified_user' },
    { key: 'feature_4_title', value: 'Абсолютна конфіденційність' },
    { key: 'feature_4_desc', value: 'Ваш простір у дорозі — недоторканний. Можна попрацювати в тиші або просто відпочити.' },
    
    // Comforts & Advantages
    { key: 'comforts_title', value: 'Для комфортної поїздки наші авто забезпечені:' },
    { key: 'comforts_list', value: JSON.stringify([
      'водою',
      'пледами',
      'подушками',
      'вологими та сухими серветками',
      'зарядними пристроями та кабелями для різних типів телефонів',
      'фірмовим шоколадом (на етапі реалізації)',
      'компактними travel-наборами для подорожей: подушка, беруші та пов’язка на очі (на етапі реалізації)'
    ])},
    { key: 'advantages_title', value: 'Наші переваги:' },
    { key: 'advantages_list', value: JSON.stringify([
      'завжди чисті та доглянуті авто',
      'уважні та досвідчені водії',
      'знижка 10% на першу поїздку',
      'однаковий рівень комфорту для всіх клієнтів, без поділу на “пакети” чи “класи”',
      'прозорі та зрозумілі умови бронювання',
      'підтримка клієнтів 24/7 до, під час та після поїздки',
      'продуманий маршрут з урахуванням ваших побажань',
      'програма лояльності для постійних клієнтів (на фінальному етапі формування умов)',
      'картка постійного клієнта (поки на етапі ідеї)',
      'Telegram-бот для самостійного бронювання трансферу (розглядаємо як окремий майбутній сервіс)'
    ])},

    // Gallery
    { key: 'gallery_title', value: 'Галерея' },
    { key: 'gallery_subtitle', value: 'Наш автопарк в реальному житті. Відео та фото преміум-якості.' },
    { key: 'gallery_seo_title', value: 'Галерея автопарку First Line Transfer' },
    { key: 'gallery_seo_description', value: 'Фото і відео преміального автопарку First Line Transfer: седани, VIP vans і мікроавтобуси для трансферів Європою та Україною.' },

    // Fleet
    { key: 'fleet_title', value: 'Оберіть свій клас' },

    // Contact
    { key: 'contact_phone', value: '+380 00 000 00 00' },
    { key: 'contact_email', value: 'info@firstlinetransfer.com' },

    // Footer
    { key: 'footer_text', value: 'Преміальні трансфери Європою та Україною. Комфорт, безпека та конфіденційність на найвищому рівні.' },
  ];

  for (const entry of contentEntries) {
    await prisma.siteContent.upsert({
      where: { key: entry.key },
      update: { value: entry.value },
      create: entry,
    });
  }
  console.log(`\n✅ CMS тексти: ${contentEntries.length} записів створено`);

  // ==========================================
  // 4. SAMPLE DRIVER
  // ==========================================
  const driverUser = await prisma.user.upsert({
    where: { email: 'driver@firstline.com' },
    update: {},
    create: {
      email: 'driver@firstline.com',
      password: driverPassword,
      name: 'Олександр Петренко',
      phone: '+380671112233',
      role: 'DRIVER',
    },
  });

  await prisma.driver.upsert({
    where: { userId: driverUser.id },
    update: {},
    create: {
      userId: driverUser.id,
      licenseNum: 'BXR123456',
      salaryPerKm: 0.15,
      status: 'ACTIVE',
    },
  });
  console.log('✅ Тестовий водій створений:', driverUser.name);

  console.log('\n🎉 Наповнення бази завершено!');
  console.log('------------------------------------');
  console.log('Адмін: admin@firstline.com / admin123');
  console.log('Водій: driver@firstline.com / driver123');
  console.log('------------------------------------');
}

seed()
  .catch((e) => {
    console.error('❌ Помилка наповнення:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
