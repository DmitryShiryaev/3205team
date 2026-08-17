# URL checker

Сервис асинхронной проверки списка URL.

## Стек

- Backend: Node.js, TypeScript, NestJS (in-memory)
- Frontend: TypeScript, React, Vite, Zustand
- Docker: `Dockerfile` + `docker-compose`

## Локальный запуск

Backend (порт `3001`):

```bash
cd backend
npm install
npm run start:dev
```

Frontend (Vite, `/api` проксируется на `http://localhost:3001`):

```bash
cd frontend
npm install
npm run dev
```

## Docker

```bash
docker compose up --build
```

UI: `http://localhost`  
API: `http://localhost:3001/api/jobs`

## API (каркас)

| Метод | Путь | Статус |
| --- | --- | --- |
| `POST` | `/api/jobs` | заглушка |
| `GET` | `/api/jobs` | заглушка, `[]` |
| `GET` | `/api/jobs/:id` | заглушка, `404` |
| `DELETE` | `/api/jobs/:id` | заглушка, `404` |
