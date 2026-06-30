import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL || "postgresql://admin:admin_password@localhost:5432/carcrm?schema=public"
});

const defaultContent = [
  { key: 'hero_title', value: 'First Line Transfer —<br/>Ваш час. Ваші правила.' },
  { key: 'hero_subtitle', value: 'Преміум-трансфер від дверей до дверей з гарантованою пунктуальністю та абсолютною конфіденційністю.' },
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
  { key: 'fleet_title', value: 'Наш автопарк' },
  { key: 'calc_title', value: 'Розрахунок вартості преміум-поїздки' },
  { key: 'contact_title', value: 'Зв\'яжіться з нами' },
  { key: 'contact_desc', value: 'Залиште свої контакти, і наш менеджер зв\'яжеться з вами для уточнення деталей поїздки.' },
  { key: 'contact_phone', value: '+380 (XX) XXX XX XX' },
  { key: 'contact_email', value: 'office@firstlinetransfer.com' },
  { key: 'footer_text', value: '© 2024 First Line Transfer. The First Class of the Road.' }
];

async function main() {
  for (const item of defaultContent) {
    await prisma.siteContent.upsert({
      where: { key: item.key },
      update: {},
      create: item,
    });
  }
  console.log('CMS Seed completed!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
