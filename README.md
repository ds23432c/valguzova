# ⚡ Квизория — Платформа интерактивных квизов

Дипломный проект. Fullstack монорепо: бэкенд (Node.js/Express) раздаёт собранный фронтенд (React) как статику. Один сервис — один URL.

## Стек

| Слой | Технологии |
|------|-----------|
| Фронтенд | React 18, React Router 6, Axios |
| Бэкенд | Node.js, Express, JWT, Multer, Nodemailer |
| База данных | MySQL (Railway) |
| Деплой | Railway (один сервис) |

## Структура

```
kvizoria/                  ← корень репозитория
├── package.json           ← монорепо-скрипты
├── railway.toml           ← Railway конфиг
├── .gitignore
├── backend/               ← Node.js API
│   ├── config/db.js       ← подключение к MySQL
│   ├── config/initDb.js   ← создание таблиц + seed (один раз)
│   ├── controllers/       ← auth, quiz, admin
│   ├── middleware/        ← JWT, upload
│   ├── routes/index.js    ← все маршруты /api/*
│   ├── uploads/           ← загруженные фото (gitignore)
│   ├── server.js          ← точка входа + раздача React build
│   └── .env.example       ← шаблон переменных
└── frontend/              ← React приложение
    ├── public/index.html
    └── src/
        ├── App.js
        ├── assets/css/global.css
        ├── components/
        ├── hooks/useAuth.js
        ├── pages/
        └── utils/api.js
```

## Локальный запуск

```bash
# 1. Клонируй репо
git clone https://github.com/ds23432c/valguzova.git
cd valguzova

# 2. Создай .env в backend/
cp backend/.env.example backend/.env
# → Заполни данными MySQL из Railway

# 3. Установи зависимости
npm install          # корень (для скриптов)
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# 4. Запусти бэкенд (БД инициализируется автоматически)
cd backend && npm start
# → http://localhost:5000/api

# 5. В другом терминале — фронтенд
cd frontend && npm start
# → http://localhost:3000 (проксирует /api → localhost:5000)
```

## Деплой на Railway (один сервис)

### Шаг 1 — MySQL уже есть (у тебя готов)

### Шаг 2 — Пуш всего репозитория в GitHub

```bash
# В корне проекта (kvizoria/)
git init
git add .
git commit -m "Квизория — первый коммит"
git remote add origin https://github.com/ds23432c/valguzova.git
git branch -M main
git push -u origin main
```

### Шаг 3 — Создай сервис на Railway

1. Railway → **New Service** → **GitHub Repo** → выбери `valguzova`
2. Root Directory: **`/`** (корень, не backend!)
3. Во вкладке **Variables** добавь:

```
PORT=5000
DB_HOST=${{MySQL.MYSQLHOST}}
DB_PORT=${{MySQL.MYSQLPORT}}
DB_USER=${{MySQL.MYSQLUSER}}
DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}
DB_NAME=${{MySQL.MYSQLDATABASE}}
JWT_SECRET=придумай_длинный_секрет_минимум_32_символа
NODE_ENV=production
```

4. Railway запустит `postinstall` (собирает React) → `node backend/server.js`
5. Через ~3 минуты сайт доступен по Railway URL

**Всё!** БД заполнится автоматически при первом старте.

---

## Как это работает в продакшне

```
Railway URL (один домен)
│
├── GET /           → React SPA (frontend/build/index.html)
├── GET /quizzes    → React SPA
├── GET /admin      → React SPA
│
├── GET  /api/quizzes       → Express контроллер
├── POST /api/auth/login    → Express контроллер
└── GET  /uploads/фото.jpg  → статические файлы
```

## Тестовые аккаунты (заполняются автоматически)

| Роль | Email | Пароль |
|------|-------|--------|
| Администратор | admin@kvizoria.ru | Admin2024! |
| Создатель | elena@kvizoria.ru | Creator2024! |
| Участник | user@kvizoria.ru | User2024! |

## Функции защиты от мошенничества

- 🔍 Мониторинг переключения вкладок
- 📋 Блокировка копирования (Ctrl+C)
- 🖱 Блокировка правой кнопки мыши  
- ⌨️ Блокировка Ctrl+V, Ctrl+U, Ctrl+S
- 🔀 Перемешивание вопросов и ответов
- ⏱ Таймер с автосдачей при истечении
- 🔢 Лимит попыток (настраивается)
- 📊 Лог всех нарушений в БД
