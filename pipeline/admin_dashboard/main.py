"""FastAPI admin dashboard application for Learn-LLM pipeline management."""
import logging

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi.middleware.cors import CORSMiddleware

from config import config

# Import model functions
from admin_dashboard.models import (
    get_active_source_count,
    get_last_fetch_time,
    get_material_count,
    get_pending_count,
    get_source_count,
    init_db,
    list_review_queue,
    seed_default_sources,
)

# Import route routers
from admin_dashboard.routes.review import router as review_router
from admin_dashboard.routes.materials import router as materials_router
from admin_dashboard.routes.sources import router as sources_router
from admin_dashboard.routes.chat import router as chat_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger(__name__)

app = FastAPI(title="Learn-LLM Admin", version="0.1.0")

# Allow cross-origin requests from frontend (port 80) to backend (port 8400)
# CORS added after AuthMiddleware below

# --------------- Static Files ---------------
import os as _os
_static_dir = _os.path.join(_os.path.dirname(__file__), "static")
app.mount("/static", StaticFiles(directory=_static_dir), name="static")

# --------------- Templates ---------------
_templates_dir = _os.path.join(_os.path.dirname(__file__), "templates")
templates = Jinja2Templates(directory=_templates_dir)

# Store on app state for route access
app.state.templates = templates


# --------------- Auth Middleware ---------------
class AuthMiddleware(BaseHTTPMiddleware):
    """Simple cookie-token authentication middleware."""
    async def dispatch(self, request: Request, call_next):
        # Allow static files, login page, and login POST through
        path = request.url.path
        if path in ("/admin/login", "/") or path.startswith("/static"):
            return await call_next(request)

        # All other /admin routes require auth
        if path.startswith("/admin"):
            token = request.cookies.get("admin_token") or request.headers.get("X-Admin-Token")
            if token != config.admin_token:
                if request.method == "GET":
                    return RedirectResponse("/admin/login", status_code=302)
                raise HTTPException(status_code=401, detail="Unauthorized")

        return await call_next(request)


app.add_middleware(AuthMiddleware)

# CORS must be added AFTER AuthMiddleware so it processes requests first (outer layer)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost",
        "http://localhost:80",
        "http://localhost:3000",
        "http://localhost:4173",
        "http://127.0.0.1",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:4173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------- Login Routes ---------------
@app.get("/admin/login")
async def login_page(request: Request):
    return templates.TemplateResponse("login.html", {"request": request, "error_msg": None})


@app.post("/admin/login")
async def login_action(request: Request):
    form = await request.form()
    token = form.get("token", "")

    if token != config.admin_token:
        return templates.TemplateResponse("login.html", {
            "request": request,
            "error_msg": "Token 不正确，请重试。"
        }, status_code=401)

    response = RedirectResponse("/admin", status_code=303)
    response.set_cookie(
        key="admin_token",
        value=token,
        httponly=True,
        max_age=86400,
        path="/",
        samesite="lax",
    )
    return response


@app.get("/admin/logout")
async def logout():
    response = RedirectResponse("/admin/login", status_code=302)
    response.delete_cookie("admin_token", path="/")
    return response


# --------------- Include Routers ---------------
app.include_router(review_router, prefix="/admin")
app.include_router(materials_router, prefix="/admin")
app.include_router(sources_router, prefix="/admin")
app.include_router(chat_router)  # no prefix — public /chat endpoint


# --------------- Dashboard ---------------
@app.get("/admin")
async def dashboard(request: Request):
    recent_items = list_review_queue(status="pending", limit=10, offset=0)
    last_fetch = get_last_fetch_time()

    return templates.TemplateResponse("dashboard.html", {
        "request": request,
        "pending_count": get_pending_count(),
        "material_count": get_material_count(),
        "source_count": get_source_count(),
        "active_source_count": get_active_source_count(),
        "last_fetch": last_fetch,
        "recent_items": recent_items,
        "section": "dashboard",
    })


@app.get("/")
async def root():
    return RedirectResponse("/admin")


# --------------- Startup ---------------
@app.on_event("startup")
async def startup():
    logger.info("Initializing database...")
    init_db()
    seed_default_sources()
    logger.info(f"Admin dashboard starting at http://{config.admin_host}:{config.admin_port}")


# --------------- Main Runner ---------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "admin_dashboard.main:app",
        host=config.admin_host,
        port=config.admin_port,
        reload=False,
        log_level="info",
    )
