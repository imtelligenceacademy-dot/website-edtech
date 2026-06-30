"""FastAPI application entrypoint.

Run (from the backend/ directory):
    uvicorn app.main:app --reload
Interactive docs: http://localhost:8000/docs
"""

from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

from app.config import settings
from app.database import Base, engine, ensure_added_columns
from app.routers import (
    access_requests,
    ai,
    auth,
    backup,
    dashboard,
    files,
    lessons,
    progress,
    reports,
    schools,
    security,
    users,
)

# Import models so they register on Base.metadata before create_all.
import app.models  # noqa: F401


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings.validate_runtime()
    # Dev convenience: ensure tables exist. Production should use Alembic migrations.
    Base.metadata.create_all(bind=engine)
    ensure_added_columns()
    yield


app = FastAPI(
    title="IM-Telligence API",
    version="0.1.0",
    description="Backend for the IM-Telligence teacher platform.",
    lifespan=lifespan,
    # Hide schema docs in production.
    docs_url=None if settings.is_production else "/docs",
    redoc_url=None,
)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("Referrer-Policy", "no-referrer")
        response.headers.setdefault(
            "Permissions-Policy", "camera=(), microphone=(), geolocation=()"
        )

        # Lesson PDFs are meant to be embedded in the frontend's lesson viewer,
        # so allow framing from the configured frontend origins for that one
        # endpoint. Everything else stays DENY (clickjacking protection).
        path = request.url.path
        is_pdf_download = path.startswith("/api/files/") and path.endswith("/download")
        if is_pdf_download:
            allowed = " ".join(["'self'", *settings.cors_origin_list])
            response.headers["Content-Security-Policy"] = f"frame-ancestors {allowed}"
        else:
            response.headers.setdefault("X-Frame-Options", "DENY")

        if settings.is_production:
            response.headers.setdefault(
                "Strict-Transport-Security", "max-age=63072000; includeSubDomains"
            )
        return response


app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,  # required for cookie-based auth
    allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

for r in (auth, users, schools, lessons, progress, reports, security, files, dashboard, ai, backup, access_requests):
    app.include_router(r.router)


@app.get("/health", tags=["meta"])
def health() -> dict[str, str]:
    return {"status": "ok", "environment": settings.environment}
