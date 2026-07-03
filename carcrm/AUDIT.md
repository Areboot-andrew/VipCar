# Аудит CarCRM

Дата аудиту: 2026-07-03.

## Прогрес після аудиту

- `/admin/settings` перероблено в логічні таби: Бізнес, Ціни і валюти, Месенджери, Оплата.
- `/api/settings` тепер читає і зберігає ключі Telegram, Facebook Messenger, WhatsApp, контакти й платіжні реквізити через існуючий `SiteContent`.
- `/admin/users` отримав керування ролями, зміною пароля, ставкою водія, ліцензією і прив'язкою Telegram.
- Додано API `/api/users/[id]/password` і `/api/users/[id]/driver`.
- Виправлено збереження `driverNotes` у `/api/bookings/[id]`.
- Адмінське меню перероблено в логічні групи: Операції, Автопарк, Клієнти, Контент, Фінанси, Система.
- Із референсу `energy-` адаптовано стильову основу: `HighlightedTitle` для двоколірних заголовків через `*зірочки*`, `IconPicker` для lucide-іконок і `DynamicIcon` для рендеру іконок із підтримкою старих material-назв.
- Додано центральний словник `src/lib/contentDefaults.ts`: публічні тексти, SEO, footer, контактна форма, Empty Legs, адмін-меню, месенджери і базові розрахункові ключі більше не мають жити як розкидані фолбеки по компонентах.
- `/api/cms` тепер автоматично досіває відсутні ключі у `SiteContent` і повертає CMS-об'єкт разом із дефолтами.
- Головна сторінка, мобільне меню, auth-nav, контактна форма, Empty Legs, SEO metadata/schema і адмінський sidebar підключені до CMS-словника.

## UI правила для подальшої переробки

- Кожна сторінка адмінки має відповідати на одне питання: що оператор робить тут і чому це саме тут.
- Меню не повинно бути плоским списком. Все групується за робочими контекстами: операції, автопарк, клієнти, контент, фінанси, система.
- Не змішувати бізнес-налаштування, медіа, CMS, заявки і інтеграції в одному екрані.
- Для складних сутностей використовувати вкладки. Для авто: Основне, Технічні дані, Ціни, Водій/експлуатація, Медіа, SEO.
- Для медіа не використовувати прості масиви URL у UI. Потрібні категорія, роль, порядок, обкладинка, alt, caption, активність.
- Для редактора сайту використовувати предметні секції, як у референсі `energy-`: Hero редагується як Hero, галерея як галерея, контакти як контакти, а не як сирий JSON.
- Для іконок використовувати вибір із бібліотеки, а не ручне введення назв.
- Для фото використовувати uploader з preview/crop, для відео - uploader з типом і preview.
- Alert/confirm поступово замінити на нормальні toast/dialog, але це робимо після стабілізації основної архітектури.

## Висновок коротко

Проект збирається (`npm run build` проходить), але продуктово він зібраний як набір окремих напівготових фіч, а не як єдина CRM. Основна проблема не в одному поганому екрані, а в тому, що немає єдиного центру керування: заявки, календар, чат замовлення, зовнішні месенджери, CMS, галерея і фінанси живуть різними моделями і різними UI-патернами.

`npm run lint` падає: 218 проблем, з них 140 errors і 78 warnings. Це не блокує build, але показує реальний технічний борг: `any`, inline styles, незахищені HTML-вставки, застарілі скрипти, неузгоджені React effects.

## Що є зараз

- Next.js 16 App Router, React 19, Prisma, PostgreSQL, Tailwind.
- Публічний сайт: головна, галерея, сторінки авто, калькулятор бронювання, контактна форма.
- Адмінка: dashboard/calendar, fleet, bookings, users, invoices, promotions, cms, chat, settings, feedback.
- Кабінет водія: рейси і розрахунки.
- Моделі БД: User, Driver, Car, Booking, Invoice, Settlement, SiteContent, PageBlock, ChatRoom, Message, Promotion, Feedback, CurrencyRate, FuelPrice.

## Критичні проблеми

### 1. Налаштування месенджерів фактично відсутні

Сторінка `/admin/settings` керує тільки валютами і пальним. Там немає нормальних секцій для Telegram, Facebook Messenger, WhatsApp, контактних каналів, webhook URL, токенів, статусу підключення, тесту відправки, інструкцій або логів.

Фактичний стан:
- Telegram MTProto бере `telegram_api_id`, `telegram_api_hash`, `telegram_string_session` із `SiteContent`.
- Facebook Messenger бере `facebook_page_token` і `facebook_verify_token` із `SiteContent`.
- WhatsApp згадується тільки в коментарі `ChatRoom.platform`, але немає API, UI, токенів, webhook, відправки чи прийому.
- README каже про Telegram Bot API, ARCHITECTURE каже про MTProto userbot. Це конфлікт документації і реалізації.

Наслідок: адміністратор не може зрозуміти, що підключено, що зламано, як змінити ключі і як протестувати канал.

### 2. Єдина система повідомлень не є єдиною

Є дві паралельні системи:
- `/admin/chat` працює з `ChatRoom` напряму і зовнішніми каналами TELEGRAM/MESSENGER.
- `ChatWidget` працює з `/api/chat/[bookingId]` і створює WEB-чат для конкретного бронювання.

Вони використовують одну таблицю `ChatRoom`, але UI, права доступу, відправка, вкладення і контекст різні. `Message` має `senderId`, але повідомлення з `/api/chat` від адміна створюються без senderId, тільки `isFromAdmin`. У результаті немає нормальної стрічки комунікацій по клієнту/заявці.

Проблеми:
- polling кожні 3 секунди в двох місцях;
- немає read/unread;
- немає статусів доставки;
- немає пошуку;
- немає прив'язки зовнішнього чату до клієнта або бронювання;
- немає вкладень у зовнішньому `/admin/chat`;
- немає єдиного composer-компонента.

### 3. Календар і заявки дублюють одне одного, але не дають нормального диспетчерського workflow

`/admin` показує календар. `/admin/bookings` також вставляє той самий `DashboardCalendar`, а нижче виводить картки заявок. Це дубль без нормальної інтеграції.

Проблеми UX:
- календар не є диспетчерською сіткою авто/водії/час;
- немає фільтрів по авто, водію, статусу, даті, місту;
- клік по події показує тільки деталі внизу, не відкриває заявку;
- в заявках велика картка на 4 колонки з inline styles, погано сканується;
- немає списку конфліктів, прострочених PENDING, непідтверджених оплат;
- поле `driverNotes` вводиться у UI, але API `/api/bookings/[id]` його не зберігає.

Останній пункт є прямим багом: UI відправляє `driverNotes`, API ігнорує.

### 4. Dashboard не є dashboard

Поточний dashboard - це тільки календар на 90 днів. Немає операційних метрик:
- нові заявки;
- сьогодні/завтра рейси;
- авто в роботі/вільні/maintenance;
- неоплачені інвойси;
- валовий дохід, витрати, чистий прибуток;
- водії без прив'язаного Telegram;
- месенджери з непрочитаними повідомленнями.

Зараз dashboard не допомагає адміну вирішити, що робити першим.

### 5. CMS і редактор сторінок роздвоєні

Є стара модель `SiteContent` key/value і нова `PageBlock`. Адмінка CMS показує обидві системи: блоки головної плюс "старі ключі". Головна сторінка теж має дві гілки рендерингу: якщо є блоки - рендерить блоки, якщо нема - fallback на старий CMS.

Проблеми:
- немає типізованої схеми контенту;
- JSON у `content` редагується через ad hoc форми;
- немає preview;
- немає draft/publish;
- немає SEO-полів сторінки;
- небезпечне `dangerouslySetInnerHTML` використовується по всьому фронту;
- ReactQuill дозволяє HTML, але немає sanitizer.

### 6. Галерея технічно і продуктово слабка

У `Car` медіа - це просто `images String[]` і `videos String[]`. API додає/видаляє URL з масиву.

Чого не вистачає:
- порядок/drag-and-drop;
- cover image;
- alt/title/caption;
- тип/роль медіа: exterior, interior, luggage, hero, gallery;
- приховати/показати;
- кроп/фокус;
- bulk upload;
- прив'язка медіа до блоків сторінки через єдину бібліотеку;
- видалення фізичного файлу з диска при видаленні URL;
- захист від дублю URL.

Публічна `/gallery` просто змішує `standalone_gallery_media` і всі медіа авто в одну сітку. Це не контроль галереї, а дамп медіа.

### 7. Дизайн-система і фактичний UI конфліктують

`DESIGN.md` каже: sharp/no-radius UI, не cluttered dashboards, преміальна стриманість. Код масово використовує `rounded-2xl`, `rounded-3xl`, gradient/glass panels, inline styles, різні кольори і компоненти без системи.

Фактичні проблеми:
- змішані Tailwind, CSS variables, inline styles;
- повторені картки, модалки, кнопки, input styles;
- Material Symbols і lucide-react змішані;
- багато alert/confirm замість нормальних toast/dialog;
- немає активного стану nav;
- немає responsive-first адмінських таблиць;
- адмінка виглядає як набір різних прототипів.

### 8. API і безпека нерівні

Частина API перевіряє сесію, частина ні. Наприклад `/api/chat/[bookingId]` має session check, а багато адмінських API читають/пишуть без перевірки ролі. Є middleware, але аудит показує, що security rules з DESIGN.md не можна вважати виконаними без повної перевірки.

Технічні проблеми:
- `new PrismaClient()` створюється в багатьох файлах замість спільного prisma singleton;
- немає централізованого auth/role guard для API;
- немає валідації body через zod або схожу схему;
- seed/admin endpoints виглядають небезпечно для продакшну;
- Telegram має hardcoded default API ID/hash;
- webhook endpoints не мають достатньої перевірки підписів/секретів.

### 9. Фінанси є, але це не фінансовий модуль

Є Invoice, Settlement, price breakdown у Booking, але немає нормальної фінансової логіки:
- інвойс створюється при бронюванні, хоча TODO каже "при підтвердженні";
- немає payment provider;
- немає часткових оплат/депозитів;
- немає журналу оплат;
- немає фінансових звітів;
- немає зв'язку settlement зі списком рейсів;
- немає контролю валют у рахунках.

### 10. Документація застаріла і суперечлива

Приклади:
- README: Next.js 16, ARCHITECTURE: Next.js 15.
- README: Telegram Bot API, ARCHITECTURE: MTProto userbot.
- TODO каже, що auth/NextAuth не зроблено, але в коді NextAuth є.
- TODO каже invoice не зроблено, але invoice модель/API/сторінки є.

Документація більше не може бути джерелом правди.

## Дублі і роздвоєння

- `SiteContent` + `PageBlock` - дві CMS-системи.
- `/admin` календар + `/admin/bookings` календар - дубль.
- `/api/chat` + `/api/chat/[bookingId]` - дві чат-системи.
- `Calculator.tsx` + `Calculator.backup.tsx` - backup у src.
- `seed-cms.js`, `seedCMS.js`, `seed-cms.mjs`, `prisma/seed.ts`, `prisma/seed.js` - дубль seed-логіки.
- `postcss.config.js` + `postcss.config.mjs`.
- багато scratch/process scripts у корені проекту.
- `CarGallery`, `GlobalGallery`, `MarqueeGallery`, `/gallery`, CMS gallery block, fleet media gallery - багато галерей без єдиної моделі.
- styling: Tailwind classes + CSS vars + inline styles + ad hoc global CSS.
- icons: lucide-react + material symbols.

## Рекомендований порядок переробки

### Етап 1. Каркас CRM і безпека

1. Створити спільний `src/lib/prisma.ts` singleton.
2. Створити API guards: `requireAdmin`, `requireDriver`, `requireUser`.
3. Закрити всі admin API і seed endpoints.
4. Додати типізовані DTO/validation для booking, car, settings, message.
5. Прибрати backup/scratch дублікати з runtime або винести в scripts/archive.

### Етап 2. Налаштування каналів

1. Додати модель `IntegrationSetting` або розширити settings нормальною typed-моделлю.
2. `/admin/settings` розбити на таби: General, Payments, Fuel/Currency, Telegram, Messenger, WhatsApp, Notifications.
3. Для кожного каналу: enabled, credentials, webhook URL, status, last error, test send.
4. WhatsApp додати як окремий канал, але спершу закласти модель і UI, потім API.
5. Прибрати секрети з `SiteContent`.

### Етап 3. Єдиний inbox

1. Об'єднати WEB/TELEGRAM/MESSENGER/WHATSAPP у один inbox.
2. ChatRoom має мати `customerId`, `bookingId`, `platform`, `externalId`, `status`, `assignedTo`, `lastReadAt`.
3. Message має мати `direction`, `senderType`, `deliveryStatus`, `attachments`.
4. Один composer для всіх чатів.
5. Прив'язка зовнішнього чату до клієнта або заявки з UI.
6. Заміна polling на server actions/SSE/WebSocket пізніше; спершу хоча б централізований polling hook.

### Етап 4. Диспетчерський календар і заявки

1. Зробити dashboard як операційний центр: KPI + urgent queues.
2. Заявки перевести в table/master-detail замість великих карток.
3. Календар зробити resource view: авто/водії по рядках, час/дні по колонках.
4. Клік по рейсу відкриває drawer заявки.
5. Фільтри: статус, авто, водій, дата, місто, оплата.
6. Виправити API для `driverNotes`.

### Етап 5. Галерея і медіа-бібліотека

1. Створити модель `MediaAsset` замість масивів URL.
2. Поля: url, type, alt, caption, order, role, active, carId, pageBlockId, width, height.
3. Fleet gallery: drag sort, set cover, edit metadata, delete file.
4. Public gallery: фільтри по авто/типу, нормальні cards, lightbox.
5. CMS block gallery бере медіа з бібліотеки, а не з локального JSON.

### Етап 6. CMS/page editor

1. Визначити одну систему: або typed PageBlock, або key/value fallback, але не обидві як рівноправні.
2. Додати preview, draft/publish, SEO fields.
3. Додати sanitizer для HTML.
4. Нормальні block schemas і редактори без `any` та raw JSON.

### Етап 7. UI system

1. Вирішити форму: або слідуємо DESIGN.md sharp/no-radius, або оновлюємо DESIGN.md під фактичний стиль.
2. Створити базові компоненти: Button, Input, Select, Card, Modal/Dialog, Drawer, Table, Tabs, Badge, Toast.
3. Прибрати inline styles зі сторінок адмінки.
4. Замінити alert/confirm на нормальні dialogs/toasts.
5. Вирівняти іконки на lucide-react або один обраний набір.

## Найперші задачі для наступного кроку

1. Виправити `/api/bookings/[id]`, щоб `driverNotes` реально зберігався.
2. Додати структуру settings для Telegram/Messenger/WhatsApp і таби в `/admin/settings`.
3. Почати `Unified Inbox`: об'єднати список чатів і чати замовлень в один UI.
4. Прибрати найбільш очевидні дублікати: `Calculator.backup.tsx`, scratch-файли, дубльовані seed-файли, дубль postcss після перевірки.
5. Зробити shared UI primitives для адмінки і переписати `/admin/bookings` як перший екран.

## Перевірки

- `npm run build` - проходить.
- `npm run lint` - падає: 218 problems (140 errors, 78 warnings).
