import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

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
      model: 'S-Class W223',
      year: 2024,
      capacity: 4,
      baseRate: 2.50,
      fuelType: 'Бензин', fuelConsumptionCity: 10.5, fuelConsumptionHighway: 7.5,
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
      fuelType: 'Бензин', fuelConsumptionCity: 12.0, fuelConsumptionHighway: 8.5,
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
      fuelType: 'Дизель', fuelConsumptionCity: 9.5, fuelConsumptionHighway: 6.5,
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
      fuelType: 'Дизель', fuelConsumptionCity: 10.0, fuelConsumptionHighway: 7.0,
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
      fuelType: 'Бензин', fuelConsumptionCity: 11.5, fuelConsumptionHighway: 8.0,
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
      licenseNumber: 'BXR123456',
      salaryRate: 50.0,
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
