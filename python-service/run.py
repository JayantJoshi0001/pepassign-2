import uvicorn

from app.config import settings


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.python_service_host,
        port=settings.python_service_port,
        reload=True,
    )
