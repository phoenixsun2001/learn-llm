"""Self-hosted auth utilities: password hashing (PBKDF2), JWT, FastAPI dependencies.

Designed for enterprise / air-gapped internal deployment — no external auth
provider, no email verification. Passwords hashed with stdlib PBKDF2-SHA256
(no bcrypt dependency); tokens are HS256 JWTs.
"""
import base64
import hashlib
import logging
import os
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt
from fastapi import HTTPException, Request

from config import config
from admin_dashboard.models import get_user_by_id

logger = logging.getLogger(__name__)

# PBKDF2 parameters
_PBKDF2_ALGO = "sha256"
_PBKDF2_ROUNDS = 100_000
_SALT_BYTES = 32

# Resolve JWT secret once; warn loudly if the operator did not configure it.
_JWT_SECRET = config.jwt_secret or "learn-llm-default-jwt-secret-change-in-production"
if not config.jwt_secret:
    logger.warning("JWT_SECRET not set — using an insecure default. Set JWT_SECRET in production!")


# -------------------- Password hashing (stdlib PBKDF2) --------------------

def hash_password(password: str) -> str:
    """Return a self-describing hash: pbkdf2_sha256$rounds$salt_b64$hash_b64."""
    salt = os.urandom(_SALT_BYTES)
    dk = hashlib.pbkdf2_hmac(_PBKDF2_ALGO, password.encode("utf-8"), salt, _PBKDF2_ROUNDS)
    return f"pbkdf2_{_PBKDF2_ALGO}${_PBKDF2_ROUNDS}${base64.b64encode(salt).decode()}${base64.b64encode(dk).decode()}"


def verify_password(password: str, stored: str) -> bool:
    """Constant-time verify a password against a stored pbkdf2 hash."""
    try:
        algo_field, rounds, salt_b64, hash_b64 = stored.split("$")
        algo_name = algo_field.split("_", 1)[1]  # "pbkdf2_sha256" -> "sha256"
        salt = base64.b64decode(salt_b64)
        expected = base64.b64decode(hash_b64)
        dk = hashlib.pbkdf2_hmac(algo_name, password.encode("utf-8"), salt, int(rounds))
        return secrets.compare_digest(dk, expected)
    except (ValueError, AttributeError):
        return False


def generate_password(length: int = 12) -> str:
    """Generate a random password (for admin-initiated resets)."""
    alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    return "".join(secrets.choice(alphabet) for _ in range(length))


# -------------------- JWT --------------------

def create_access_token(user: dict) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user["id"]),
        "email": user["email"],
        "role": user["role"],
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=config.access_token_expire_minutes)).timestamp()),
    }
    return jwt.encode(payload, _JWT_SECRET, algorithm=config.jwt_algorithm)


def decode_token(token: str) -> dict:
    return jwt.decode(token, _JWT_SECRET, algorithms=[config.jwt_algorithm])


# -------------------- FastAPI request auth --------------------

def _bearer_token(request: Request) -> Optional[str]:
    h = request.headers.get("Authorization") or request.headers.get("authorization")
    if h and h.lower().startswith("bearer "):
        return h.split(" ", 1)[1].strip()
    return None


def get_current_user(request: Request) -> Optional[dict]:
    """Resolve the current user from a Bearer JWT, or None if unauthenticated/disabled."""
    token = _bearer_token(request)
    if not token:
        return None
    try:
        payload = decode_token(token)
        user = get_user_by_id(int(payload["sub"]))
    except (jwt.PyJWTError, ValueError, KeyError):
        return None
    if not user or user.get("status") != "active":
        return None
    return user


def require_auth(request: Request) -> dict:
    """Dependency: a valid authenticated, active user (else 401)."""
    user = get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="未登录或登录已过期")
    return user


def require_admin(request: Request) -> dict:
    """Dependency: an authenticated admin user (else 401/403)."""
    user = require_auth(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="需要管理员权限")
    return user


def check_admin_or_token(request: Request) -> None:
    """Unified admin gate: JWT(admin) OR the legacy admin_token (cookie/header).

    Replaces the old per-route ``_check_auth`` in review/materials/sources so an
    admin logged in via the SPA (JWT) reaches those endpoints without the legacy token.
    Raises 401 if neither credential is valid.
    """
    user = get_current_user(request)
    if user and user.get("role") == "admin":
        return
    token = request.cookies.get("admin_token") or request.headers.get("X-Admin-Token")
    if token and token == config.admin_token:
        return
    raise HTTPException(status_code=401, detail="Unauthorized")


def public_user_dict(user: dict) -> dict:
    """Strip secrets from a user row for API responses."""
    return {
        "id": user["id"],
        "email": user["email"],
        "role": user["role"],
        "status": user["status"],
        "created_at": user["created_at"],
        "last_login_at": user.get("last_login_at"),
    }
