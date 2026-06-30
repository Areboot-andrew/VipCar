# First Line Transfer — VIP Car CRM

Преміум CRM-система для трансферного бізнесу з онлайн-бронюванням, розрахунком вартості поїздки через Google Maps, візуальним календарем зайнятості авто та адмін-панеллю з повним CMS.

## 🚀 Технологічний стек

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS + Custom CSS (Obsidian + Gold дизайн)
- **Backend:** Next.js API Routes
- **Database:** PostgreSQL (Docker) + Prisma ORM
- **Maps:** Google Maps API (Autocomplete + Directions)
- **Gallery:** Embla Carousel (автопрокрутка)
- **Image Processing:** Sharp (WebP конвертація, кроп)
- **Calendar:** React Datepicker (візуальна зайнятість)
- **Notifications:** Telegram Bot API

## ⚙️ Встановлення

```bash
# 1. Клонувати репозиторій
git clone https://github.com/Areboot-andrew/VipCar.git
cd VipCar/carcrm

# 2. Встановити залежності
npm install

# 3. Налаштувати .env
cp .env.example .env
# Відредагувати .env (додати ключі Google Maps, Telegram)

# 4. Запустити базу даних
cd .. && docker-compose up -d db && cd carcrm

# 5. Виконати міграцію та наповнити базу
npx prisma migrate dev --name init
npx prisma db seed

# 6. Запустити сервер розробки
npm run dev
```

## 📋 Структура проекту

```
carcrm/
├── prisma/
│   ├── schema.prisma    # Модель бази даних
│   └── seed.ts          # Скрипт наповнення бази
├── public/
│   └── uploads/         # Локальні медіа файли (фото/відео)
├── src/
│   ├── app/
│   │   ├── page.tsx         # Головна сторінка (100% CMS)
│   │   ├── layout.tsx       # Root layout + SEO Schema
│   │   ├── cars/[id]/       # Окремі сторінки авто
│   │   ├── admin/           # Адмін панель
│   │   │   ├── fleet/       # Управління автопарком
│   │   │   ├── bookings/    # Заявки на бронювання
│   │   │   ├── cms/         # CMS (тексти, фони, логотип)
│   │   │   ├── feedback/    # Повідомлення від клієнтів
│   │   │   └── promotions/  # Знижки / Empty Legs
│   │   ├── driver/          # Портал водія
│   │   └── api/             # API Endpoints
│   └── components/
│       ├── Calculator.tsx   # Калькулятор з Google Maps
│       ├── ContactForm.tsx  # Форма зворотнього зв'язку
│       └── GlobalGallery.tsx # Карусель галереї
└── docker-compose.yml       # PostgreSQL контейнер
```

## 🔑 Облікові записи (після seed)

| Роль | Email | Пароль |
|------|-------|--------|
| Адмін | admin@firstline.com | admin123 |
| Водій | driver@firstline.com | driver123 |

## 🎨 Дизайн-система

- **Основний фон:** `#131314` (Obsidian Charcoal)
- **Акцент:** `#D4AF37` (Gold)
- **Текст:** `#e4e2e3` (Light)
- **Вторинний текст:** `#c7c6ca`
