# activoo

PWA-маркетплейс детских кружков и занятий. Родители ищут активности рядом, школы публикуют свои занятия и получают заявки.

Стек: **TanStack Start (React 19 + Vite 7)** + **Lovable Cloud** (база данных, авторизация, хранилище).

---

## 👤 Что видит обычный пользователь

UI/UX для родителей и школ не изменился. Главная, поиск, профиль, бронирование, кабинет школы — всё на тех же URL, что и раньше.

## 🔐 Доступ в админ-панель

Админка теперь **часть сайта**, но попасть в неё можно только по специальной ссылке и только с правами `admin`.

- **Ссылка для входа:** `/admin/login`  
  (например, `https://ваш-домен.com/admin/login`)
- На этой странице вводите **email + пароль** аккаунта с ролью `admin`.
- После успешного входа открывается панель `/admin` со всеми разделами:
  - **Dashboard** — статистика и последние заявки
  - **Schools** — школы (CRUD)
  - **Classes** — занятия (CRUD, флаги Featured/New)
  - **Leads** — заявки родителей, статусы, экспорт CSV
  - **Users** — пользователи и роли (parent / school / admin)
  - **Site copy** — редактирование текстов сайта (hero, "For schools" и т.п.)
- Если зайти на `/admin/login` под обычным пользователем — система сообщит, что у аккаунта нет доступа, и автоматически выйдет.
- Из обычного UI ссылок на админку **нет** — она открывается только по прямой ссылке.

### Сделать пользователя админом

В Cloud → SQL Editor (замените email):

```sql
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'вы@example.com'
ON CONFLICT (user_id, role) DO NOTHING;
```

`st.ulia063@gmail.com` уже назначен админом.

---

## 🚀 Перенос проекта на свой домен через GitHub + Vercel

### Шаг 1. Подключить GitHub

1. В Lovable откройте **Plus (+) → GitHub → Connect project**.
2. Авторизуйте Lovable GitHub App, выберите аккаунт/организацию.
3. Нажмите **Create Repository** — Lovable создаст репозиторий и автоматически зальёт код. Дальше синхронизация двусторонняя: правки в Lovable → пуш в GitHub, пуш в GitHub → подтягивается в Lovable.

### Шаг 2. Импортировать репозиторий в Vercel

1. Откройте [vercel.com/new](https://vercel.com/new) и импортируйте только что созданный репозиторий.
2. Framework preset: **TanStack Start** (также зафиксировано в `vercel.json`).
3. Build Command: `bun run build` (уже настроен).
4. Install Command: `bun install` (уже настроен).
5. Output Directory вручную не задавайте — Nitro сам создаёт Vercel Build Output.

### Шаг 3. Добавить переменные окружения в Vercel

**Project Settings → Environment Variables** — добавить для всех окружений (Production / Preview / Development). Значения возьмите из вашего `.env` в Lovable (или из `.env.example`).

| Переменная | Где используется |
| --- | --- |
| `VITE_SUPABASE_URL` | браузер |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | браузер |
| `VITE_SUPABASE_PROJECT_ID` | браузер |
| `SUPABASE_URL` | сервер (SSR) |
| `SUPABASE_PUBLISHABLE_KEY` | сервер (SSR) |
| `SUPABASE_SERVICE_ROLE_KEY` | сервер (админские операции) |

> ⚠️ `SUPABASE_SERVICE_ROLE_KEY` — секрет, никогда не коммитьте его в репозиторий.

### Шаг 4. Деплой

Нажмите **Deploy**. Vercel:
- соберёт проект (`bun run build` с `VERCEL=1`),
- Nitro создаст стандартный Vercel Build Output,
- страницы, SSR и server functions будут обслуживаться через Vercel Functions без самописного `api/server.js`.

Дальше каждый push в `main` будет автоматически разворачиваться.

### Шаг 5. Подключить свой домен

1. В Vercel → проект → **Settings → Domains → Add**.
2. Введите ваш домен (например, `activoo.com`).
3. Vercel покажет нужные DNS-записи — добавьте их у вашего регистратора:
   - `A` запись для корня → IP, который покажет Vercel
   - `CNAME` для `www` → `cname.vercel-dns.com`
4. Дождитесь проверки DNS (обычно несколько минут, максимум до 24 часов). SSL-сертификат Vercel выпустит автоматически.
5. Откройте `https://ваш-домен.com/admin/login` — это страница входа в админку.

### Шаг 6. Обновить redirect URLs для авторизации

Чтобы вход/регистрация работали на новом домене, в Lovable Cloud → **Auth → URL Configuration** добавьте:
- **Site URL:** `https://ваш-домен.com`
- **Redirect URLs:** `https://ваш-домен.com/**`

---

## 🛠 Локальная разработка

```bash
bun install
bun run dev      # http://localhost:5173
bun run build    # сборка проекта
bun run preview  # локальный просмотр продакшн-сборки
```
