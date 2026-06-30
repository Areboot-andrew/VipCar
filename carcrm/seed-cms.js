const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const defaultContent = [
  { key: 'hero_title', value: 'First Line Transfer —<br/>Ваш час. Ваші правила.' },
  { key: 'hero_subtitle', value: 'Преміум-трансфер від дверей до дверей з гарантованою пунктуальністю та абсолютною конфіденційністю.' },
  { key: 'btn_book', value: 'Забронювати поїздку' },
  { key: 'services_title', value: 'Чому ми?' },
  { key: 'service_1_title', value: 'Пунктуальність 10/10' },
  { key: 'service_1_desc', value: 'Ми цінуємо ваш час.' },
  { key: 'service_2_title', value: 'Турбота з першої секунди' },
  { key: 'service_2_desc', value: 'Допомога з багажем.' },
  { key: 'service_3_title', value: 'Гнучкість' },
  { key: 'service_3_desc', value: 'Підлаштовуємося під ваш графік.' },
  { key: 'service_4_title', value: 'Абсолютна конфіденційність' },
  { key: 'service_4_desc', value: 'Ваш простір недоторканний.' },
  { key: 'fleet_title', value: 'Наш автопарк' },
  { key: 'calc_title', value: 'Розрахунок вартості преміум-поїздки' },
  { key: 'calc_route_title', value: 'Маршрут поїздки' },
  { key: 'calc_from', value: 'Звідки' },
  { key: 'calc_to', value: 'Куди' },
  { key: 'calc_distance', value: 'Відстань (км)' },
  { key: 'calc_options', value: 'Клас обслуговування (Авто)' },
  { key: 'calc_price_title', value: 'Орієнтовна вартість' },
  { key: 'calc_btn', value: 'Продовжити бронювання' },
  { key: 'footer_title', value: 'First Line Transfer' },
  { key: 'footer_desc', value: '© 2024 First Line Transfer. The First Class of the Road.' }
];

async function main() {
  console.log('Seeding CMS content...');
  for (const item of defaultContent) {
    await prisma.siteContent.upsert({
      where: { key: item.key },
      update: {},
      create: item,
    });
  }
  console.log('CMS seeded!');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
