# Frontend (Next.js App Router)

Frontend provides login, protected dashboard, and modal-based messaging UI.

## Environment

Copy `.env.example` to `.env.local`:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
```

## Install

```bash
npm install
```

## Run

```bash
npm run dev
```

Frontend runs on `http://localhost:3000`.

## What this frontend does

- Login page at `/`.
- Signup page at `/signup`.
- Stores auth token securely in HTTP-only cookie through Next route handlers.
- Protected route middleware for `/dashboard`.
- Dashboard with `Welcome, <username>`.
- `Talk with me python` modal that sends request only to Next/Nest flow.
