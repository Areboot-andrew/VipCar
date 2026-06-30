const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const defaultContent = [
  { key: 'hero_title', value: 'First Line Transfer —<br>Ваш час. Ваші правила.' },
  { key: 'hero_subtitle', value: 'Преміум-трансфер від дверей до дверей з гарантованою пунктуальністю та абсолютною конфіденційністю.' },
  { key: 'hero_button', value: 'Забронювати поїздку' },
  { key: 'nav_brand', value: 'First Line Transfer' },
  { key: 'services_title', value: 'Чому ми?' },
  { key: 'service_1_title', value: 'Пунктуальність 10/10' },
  { key: 'service_1_desc', value: 'Ми цінуємо ваш час.' },
  { key: 'service_2_title', value: 'Турбота з першої секунди' },
  { key: 'service_2_desc', value: 'Допомога з багажем.' },
  { key: 'service_3_title', value: 'Гнучкість' },
  { key: 'service_3_desc', value: 'Підлаштовуємося під ваш графік.' },
  { key: 'service_4_title', value: 'Абсолютна конфіденційність' },
  { key: 'service_4_desc', value: 'Ваш простір недоторканний.' },
  { key: 'calc_title', value: 'Розрахунок вартості преміум-поїздки' },
  { key: 'fleet_title', value: 'Наш автопарк' },
  { key: 'contact_title', value: 'Зв\'яжіться з нами' },
  { key: 'contact_desc', value: 'Залиште свої контакти, і наш менеджер зв\'яжеться з вами для уточнення деталей поїздки.' },
  { key: 'contact_phone', value: '+380 (XX) XXX XX XX' },
  { key: 'contact_email', value: 'office@firstlinetransfer.com' },
  { key: 'footer_text', value: '© 2024 First Line Transfer. The First Class of the Road.' }
];

async function main() {
  console.log('Seeding default content...');
  for (const item of defaultContent) {
    await prisma.siteContent.upsert({
      where: { key: item.key },
      update: {},
      create: { key: item.key, value: item.value }
    });
  }
  console.log('Seeding done.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
