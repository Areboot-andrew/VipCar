const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const defaultContent = [
  { key: 'hero_title', value: 'First Line Transfer —<br/>Ваш час. Ваші правила.' },
  { key: 'hero_subtitle', value: 'Преміум-трансфер від дверей до дверей з гарантованою пунктуальністю та абсолютною конфіденційністю.' },
  { key: 'hero_btn_text', value: 'Забронювати поїздку' },
  { key: 'services_title', value: 'Чому ми?' },
  { key: 'calculator_title', value: 'Розрахунок вартості преміум-поїздки' },
  { key: 'fleet_title', value: 'Наш автопарк' },
  { key: 'feature_1_title', value: 'Пунктуальність 10/10' },
  { key: 'feature_1_desc', value: 'Ми цінуємо ваш час.' },
  { key: 'feature_2_title', value: 'Турбота з першої секунди' },
  { key: 'feature_2_desc', value: 'Допомога з багажем.' },
  { key: 'feature_3_title', value: 'Гнучкість' },
  { key: 'feature_3_desc', value: 'Підлаштовуємося під ваш графік.' },
  { key: 'feature_4_title', value: 'Абсолютна конфіденційність' },
  { key: 'feature_4_desc', value: 'Ваш простір недоторканний.' }
];

async function main() {
  for (const item of defaultContent) {
    await prisma.siteContent.upsert({
      where: { key: item.key },
      update: { value: item.value },
      create: { key: item.key, value: item.value }
    });
  }
  console.log('CMS Seeded!');
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
