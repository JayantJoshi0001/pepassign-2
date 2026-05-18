# Backend (NestJS)

NestJS is responsible for authentication, user persistence, and secure proxying to the Python service.

## Environment

Copy `.env.example` to `.env` and configure values:

```bash
PORT=3001
FRONTEND_ORIGIN=http://localhost:3000
JWT_SECRET=super-secret-jwt-key-change-me
JWT_EXPIRES_IN=3600
DATABASE_PATH=./data/auth.db
PYTHON_SERVICE_URL=http://localhost:8001
```

## Install

```bash
npm install
```

Installed core packages for this flow:

```bash
npm install @nestjs/config @nestjs/jwt @nestjs/passport @nestjs/axios class-validator class-transformer passport passport-jwt
npm install -D @types/passport-jwt
```

## Run

```bash
npm run start:dev
```

## Main API routes

- `POST /auth/register` -> creates a new user in SQLite and returns JWT.
- `POST /auth/login` -> validates stored credentials and returns JWT.
- `POST /python/talk` -> protected route that forwards message to FastAPI and returns result.
- `GET /` -> simple health-like starter route.
