# VipCar — Преміум Трансфер CRM

## 🚀 Швидкий старт

```bash
# 1. Клонуй репо
git clone https://github.com/Areboot-andrew/VipCar.git
cd VipCar/carcrm

# 2. Встанови залежності
npm install

# 3. Скопіюй .env
cp .env.example .env
# Відредагуй .env — впиши свої ключі (див. нижче)

# 4. Запусти базу даних (Docker)
cd ..
docker-compose up -d db
cd carcrm

# 5. Створи таблиці в базі
npx prisma migrate dev --name init

# 6. Наповни базу початковими даними
npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts

# 7. Запусти проект
npm run dev
```

Відкрий: http://localhost:3000 (сайт) та http://localhost:3000/admin (адмінка)

---

## 🔑 Змінні оточення (.env)

| Змінна | Опис | Обов'язково |
|--------|------|:-----------:|
| `DATABASE_URL` | Postgres URL | ✅ |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps API для автозаповнення адрес та розрахунку маршруту | ⚠️ Для калькулятора |
| `TELEGRAM_BOT_TOKEN` | Токен Telegram бота (створи через @BotFather) | ⚠️ Для сповіщень |
| `TELEGRAM_CHAT_ID` | ID чату/користувача для сповіщень | ⚠️ Для сповіщень |

---

## 📁 Структура проекту

```
VipCar/
├── docker-compose.yml          # Docker: Postgres + Web
├── carcrm/                     # Next.js App
│   ├── prisma/
│   │   ├── schema.prisma       # Моделі бази даних
│   │   └── seed.ts             # Скрипт наповнення бази
│   ├── public/
│   │   └── uploads/            # Завантажені фото/відео (локально)
│   │       ├── images/         # Оптимізовані WebP зображення
│   │       └── videos/         # Відео файли
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx      # Root layout (SEO, шрифти, JSON-LD)
│   │   │   ├── page.tsx        # Головна сторінка (100% CMS)
│   │   │   ├── globals.css     # Глобальні стилі + DatePicker тема
│   │   │   ├── cars/
│   │   │   │   └── [id]/page.tsx   # Окрема SEO-сторінка авто
│   │   │   ├── admin/
│   │   │   │   ├── layout.tsx      # Sidebar адмінки
│   │   │   │   ├── page.tsx        # Дашборд (Календар 90 днів)
│   │   │   │   ├── fleet/page.tsx  # Автопарк (CRUD + завантаж. фото/відео)
│   │   │   │   ├── bookings/page.tsx # Заявки (пасажири, багаж, тварини)
│   │   │   │   ├── cms/page.tsx    # CMS Тексти + Файли
│   │   │   │   ├── feedback/page.tsx # Повідомлення клієнтів
│   │   │   │   ├── promotions/page.tsx # Знижки (Empty Legs)
│   │   │   │   └── DashboardCalendar.tsx
│   │   │   ├── driver/
│   │   │   │   ├── layout.tsx      # Layout водія
│   │   │   │   ├── page.tsx        # Дашборд водія
│   │   │   │   └── settlements/page.tsx # Розрахунки водія
│   │   │   └── api/
│   │   │       ├── bookings/route.ts    # CRUD бронювань
│   │   │       ├── cars/
│   │   │       │   ├── route.ts         # GET/POST автопарк
│   │   │       │   ├── availability/route.ts # Перевірка зайнятості
│   │   │       │   └── [id]/
│   │   │       │       ├── route.ts     # GET/DELETE/PATCH авто
│   │   │       │       ├── media/route.ts    # Додати/Видалити фото
│   │   │       │       └── booked-dates/route.ts # Зайняті дати
│   │   │       ├── cms/route.ts         # CMS тексти (масовий update)
│   │   │       ├── feedback/route.ts    # Зворотній зв'язок + Telegram
│   │   │       ├── promotions/route.ts  # Знижки
│   │   │       └── upload/route.ts      # Завантаження файлів (Sharp)
│   │   └── components/
│   │       ├── Calculator.tsx    # Калькулятор з DatePicker + Google Maps
│   │       ├── ContactForm.tsx   # Форма зв'язку
│   │       └── GlobalGallery.tsx # Авто-карусель (Embla)
│   ├── Dockerfile
│   ├── .env.example
│   └── package.json
└── DESIGN.md                   # Дизайн-система
```

---

## 🗄️ Моделі бази даних

| Модель | Опис |
|--------|------|
| `User` | Клієнти, адміни, водії (role: ADMIN/CLIENT/DRIVER) |
| `Driver` | Водії (прив'язані до User) |
| `Car` | Автопарк (images[], videos[], baseRate) |
| `Booking` | Бронювання (passengers, children, luggage, animals, dateStart, dateEnd) |
| `Invoice` | Рахунки |
| `Settlement` | Розрахунки з водіями |
| `SiteContent` | CMS тексти (key/value) |
| `Promotion` | Знижки / Empty Legs |
| `Feedback` | Повідомлення зворотнього зв'язку |

---

## 🔐 Доступ після seed

| Роль | Email | Пароль |
|------|-------|--------|
| Адмін | admin@firstline.com | admin123 |
| Водій | driver@firstline.com | driver123 |

---

## 🛠️ Технології

- **Frontend:** Next.js 16, React 19, TailwindCSS
- **Backend:** Next.js API Routes, Prisma ORM
- **DB:** PostgreSQL 15 (Docker)
- **Медіа:** Sharp (WebP оптимізація), Embla Carousel
- **Maps:** Google Maps API (Autocomplete + Directions)
- **Notifications:** Telegram Bot API
- **Calendar:** react-datepicker (візуальна зайнятість)
