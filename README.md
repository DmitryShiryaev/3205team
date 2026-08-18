# URL checker

Сервис асинхронной проверки списка URL: пользователь создаёт задание, бэкенд в фоне делает HTTP-запросы (до 5 параллельно на job) и отдаёт прогресс через REST. Хранение только в памяти процесса.

## Стек

- Backend: Node.js, TypeScript, NestJS
- Frontend: TypeScript, React, Vite, Zustand
- Docker: `Dockerfile` + `docker-compose` — одной командой UI (nginx) и API; для разработки фронт через Vite

## Запуск

### Разработка: Vite + API

Фронт с hot reload, бэкенд можно поднять локально или только его контейнер.

```bash
cd backend && npm install && npm run start:dev
```

или

```bash
docker compose up backend --build
```

```bash
cd frontend && npm install && npm run dev
```

UI: `http://localhost:5173`  
Vite проксирует `/api` на `http://localhost:3001`. Контейнер `frontend` (nginx) не нужен — если он уже запущен, останови: `docker compose stop frontend`.

### Одна команда (Docker + nginx)

```bash
docker compose up --build
```

- UI: `http://localhost` (nginx отдаёт статику и проксирует `/api` на backend)
- API напрямую: `http://localhost:3001/api/jobs`

Остановка: `docker compose down`

## API

Префикс: `/api`. Ошибки: `{ "statusCode": number, "message": string }`.

| Метод | Путь | Ответ |
| --- | --- | --- |
| `POST` | `/api/jobs` | `201 { "jobId": string }` |
| `GET` | `/api/jobs` | `200` список, новые сверху, краткая статистика |
| `GET` | `/api/jobs/:id` | `200` детали + `items`; нет → `404` |
| `DELETE` | `/api/jobs/:id` | `200` отменённый job; уже финальный → `409` |

**POST `/api/jobs`**

Тело: `{ "urls": string[] }`.

- `400`, если нет `urls`, это не массив, или после trim пустых строк список пустой
- максимум 100 URL
- формат отдельных строк **не** валидируется: `not-a-url` попадёт в job и получит `error`

**GET `/api/jobs`** — элементы:

```json
{
  "id": "uuid",
  "createdAt": "ISO-8601",
  "status": "pending",
  "stats": { "total": 2, "success": 0, "error": 0 }
}
```

**GET `/api/jobs/:id`** — плюс `items[]`:

```json
{
  "url": "https://yandex.ru",
  "status": "success",
  "httpStatus": 200,
  "error": "Invalid URL",
  "startedAt": "ISO-8601",
  "finishedAt": "ISO-8601",
  "durationMs": 1234
}
```

Поля `httpStatus` / `error` / тайминги есть только если проверка уже дошла до соответствующего шага.

### Статусы

Job: `pending` → `in_progress` → `completed` \| `cancelled` \| `failed`.

- `failed` — только падение воркера, не ошибки отдельных URL
- частичные `error` у URL не мешают job стать `completed`

URL: `pending` → `in_progress` → `success` \| `error` \| `cancelled`.

- HTTP 2xx/3xx — `success` + `httpStatus`
- HTTP 4xx/5xx — `error` + `httpStatus` (например `HTTP 404`)
- битый URL, таймаут 15 с, сеть/DNS — `error` без `httpStatus`
- `DELETE` переводит job и оставшиеся `pending` URL в `cancelled`; уже `in_progress` доводятся до конца

После каждой проверки URL — случайная пауза 0–10 с.

## HEAD → GET (отклонение от ТЗ, сейчас выключено)

В задании указан только HTTP **HEAD**. Многие серверы HEAD не поддерживают и отвечают `405` или `501`.

Код GET-fallback оставлен закомментированным в `url-checker.ts`. Сейчас проверка идёт только HEAD: 405/501 — это `error` + `httpStatus`.
