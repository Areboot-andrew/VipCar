const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Починаємо наповнення бази даних...\n');

  // ==========================================
  // 1. ADMIN USER
  // ==========================================
  const admin = await prisma.user.upsert({
    where: { email: 'admin@firstline.com' },
    update: {},
    create: {
      email: 'admin@firstline.com',
      password: 'admin123', // Потрібно замінити на хеш в продакшені
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
      model: 'S-Class W223',
      year: 2024,
      capacity: 4,
      baseRate: 2.50,
      fuelConsumption: 9.5,
      status: 'AVAILABLE',
      images: [],
      videos: [],
    },
    {
      make: 'Mercedes-Benz',
      model: 'V-Class (VIP)',
      year: 2024,
      capacity: 7,
      baseRate: 3.00,
      fuelConsumption: 11.0,
      status: 'AVAILABLE',
      images: [],
      videos: [],
    },
    {
      make: 'BMW',
      model: '7 Series G70',
      year: 2024,
      capacity: 4,
      baseRate: 2.70,
      fuelConsumption: 8.8,
      status: 'AVAILABLE',
      images: [],
      videos: [],
    },
    {
      make: 'Audi',
      model: 'A8 L',
      year: 2023,
      capacity: 4,
      baseRate: 2.40,
      fuelConsumption: 9.2,
      status: 'AVAILABLE',
      images: [],
      videos: [],
    },
    {
      make: 'Mercedes-Benz',
      model: 'Sprinter VIP',
      year: 2024,
      capacity: 12,
      baseRate: 4.00,
      fuelConsumption: 14.0,
      status: 'AVAILABLE',
      images: [],
      videos: [],
    },
  ];

  for (const carData of carsData) {
    const car = await prisma.car.create({ data: carData });
    console.log(`✅ Авто створено: ${car.make} ${car.model}`);
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
    { key: 'services_title', value: 'Чому обирають нас?' },
    { key: 'feature_1_icon', value: 'schedule' },
    { key: 'feature_1_title', value: 'Пунктуальність' },
    { key: 'feature_1_desc', value: 'Ми завжди прибуваємо за 15 хвилин до вказаного часу. Жодних запізнень, навіть на хвилину.' },
    { key: 'feature_2_icon', value: 'directions_car' },
    { key: 'feature_2_title', value: 'Преміум Автопарк' },
    { key: 'feature_2_desc', value: 'Тільки нові автомобілі класу люкс в ідеальному технічному стані. Mercedes S-Class, BMW 7 Series, Audi A8.' },
    { key: 'feature_3_icon', value: 'verified_user' },
    { key: 'feature_3_title', value: 'Конфіденційність' },
    { key: 'feature_3_desc', value: 'Повна гарантія анонімності та безпеки ваших поїздок. Дані клієнтів не передаються третім особам.' },
    { key: 'feature_4_icon', value: 'workspace_premium' },
    { key: 'feature_4_title', value: 'Професійні Водії' },
    { key: 'feature_4_desc', value: 'Англомовні водії з багаторічним досвідом VIP-обслуговування. Завжди у діловому костюмі.' },

    // Gallery
    { key: 'gallery_title', value: 'Галерея' },
    { key: 'gallery_subtitle', value: 'Наш автопарк в реальному житті. Відео та фото преміум-якості.' },

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
      password: 'driver123',
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
      licenseNumber: 'AAA 123456',
      active: true,
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
