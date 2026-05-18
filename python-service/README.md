# Python Service (FastAPI)

FastAPI receives text and returns a formatted acknowledgement.

## Environment

Copy `.env.example` to `.env`:

```bash
PYTHON_SERVICE_HOST=0.0.0.0
PYTHON_SERVICE_PORT=8001
```

## Install

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

## Run

```bash
python run.py
```

Service starts on `http://localhost:8001`.

## API

- `GET /health`
- `POST /message` with JSON:

```json
{
  "text": "hello"
}
```
