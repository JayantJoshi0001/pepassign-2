# Pepagora Assignment -> 2  (Next.js + NestJS + FastAPI)

This workspace contains 3 services with strict communication flow:

`Next.js -> NestJS -> FastAPI -> NestJS -> Next.js`

## 1. Backend Setup (NestJS)

```bash
cd backend
npm install
copy .env.example .env
npm run start:dev
```

## 2. Python Setup (FastAPI)

```bash
cd python-service
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python run.py
```

## 3. Frontend Setup (Next.js)

```bash
cd frontend
npm install
copy .env.example .env.local
npm run dev
```

## Functional Flow

1. Open frontend login page (`/`).
2. Use the signup page to create and store a user in SQLite, or login with an existing account.
3. NestJS returns JWT after register or login.
4. Frontend stores JWT in HTTP-only cookie through Next route handler.
5. Dashboard shows `Welcome, <username>`.
6. Click `Talk with me python` and send text.
7. Frontend calls Next API route, which calls NestJS protected route.
8. NestJS forwards payload to FastAPI `/message` endpoint.
9. FastAPI response returns to NestJS and then frontend UI.
