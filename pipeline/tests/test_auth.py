"""Tests for self-hosted auth: password hashing, JWT, users CRUD, bootstrap/protect logic.

Run:  cd pipeline && PYTHONPATH=. python tests/test_auth.py
"""
import asyncio
import os
import shutil
import tempfile

import jwt as pyjwt
from fastapi import HTTPException

import auth_utils
from admin_dashboard import models
from config import config

_TMP_DIRS = []


class FakeRequest:
    """Minimal stand-in for starlette.Request (headers + cookies only)."""
    def __init__(self, headers=None, cookies=None):
        self.headers = headers or {}
        self.cookies = cookies or {}


def _setup_temp_db():
    """Point the models layer at a fresh temp SQLite DB and create its schema."""
    tmp = tempfile.mkdtemp()
    _TMP_DIRS.append(tmp)
    models.DB_PATH = os.path.join(tmp, "test_auth.db")
    models.init_db()
    return tmp


def test_password_hash_and_verify():
    h = auth_utils.hash_password("s3cret!")
    assert h.startswith("pbkdf2_sha256$")
    assert auth_utils.verify_password("s3cret!", h)
    assert not auth_utils.verify_password("wrong", h)
    assert not auth_utils.verify_password("s3cret!", "not-a-valid-hash")
    print("[PASS] password hash/verify")


def test_jwt_roundtrip_and_invalid():
    user = {"id": 7, "email": "a@b.com", "role": "admin"}
    token = auth_utils.create_access_token(user)
    p = auth_utils.decode_token(token)
    assert p["sub"] == "7" and p["email"] == "a@b.com" and p["role"] == "admin"
    try:
        auth_utils.decode_token(token + "x")
        assert False
    except pyjwt.PyJWTError:
        pass
    print("[PASS] jwt roundtrip + invalid rejected")


def test_bootstrap_first_user_is_admin():
    from admin_dashboard.routes.auth import register, CredentialRequest
    _setup_temp_db()

    assert models.count_users() == 0
    res = asyncio.run(register(CredentialRequest(email="Boss@x.com", password="123456")))
    assert res["user"]["role"] == "admin"
    assert res["token"]
    assert res["user"]["email"] == "boss@x.com"

    res2 = asyncio.run(register(CredentialRequest(email="u2@x.com", password="123456")))
    assert res2["user"]["role"] == "user"

    # duplicate email -> 409
    try:
        asyncio.run(register(CredentialRequest(email="boss@x.com", password="123456")))
        assert False
    except HTTPException as e:
        assert e.status_code == 409

    # invalid email -> 400 ; short password -> 400
    try:
        asyncio.run(register(CredentialRequest(email="bad", password="123456")))
        assert False
    except HTTPException as e:
        assert e.status_code == 400
    try:
        asyncio.run(register(CredentialRequest(email="ok@x.com", password="123")))
        assert False
    except HTTPException as e:
        assert e.status_code == 400

    print("[PASS] bootstrap first-user-admin + dedup + validation + lowercase")


def test_login_verification_and_update():
    from admin_dashboard.routes.auth import login, CredentialRequest
    _setup_temp_db()
    models.insert_user("boss@x.com", auth_utils.hash_password("123456"), "admin")

    res = asyncio.run(login(CredentialRequest(email="BOSS@x.com", password="123456")))
    assert res["token"] and res["user"]["email"] == "boss@x.com"
    assert models.get_user_by_id(res["user"]["id"])["last_login_at"]

    # wrong password -> 401
    try:
        asyncio.run(login(CredentialRequest(email="boss@x.com", password="WRONG")))
        assert False
    except HTTPException as e:
        assert e.status_code == 401

    # disabled account -> 403
    models.update_user(res["user"]["id"], status="disabled")
    try:
        asyncio.run(login(CredentialRequest(email="boss@x.com", password="123456")))
        assert False
    except HTTPException as e:
        assert e.status_code == 403

    print("[PASS] login verify + last_login_at + bad credentials + disabled")


def test_list_users_excludes_password_hash():
    _setup_temp_db()
    models.insert_user("a@x.com", auth_utils.hash_password("pw1"), "admin")
    models.insert_user("b@x.com", auth_utils.hash_password("pw2"), "user")

    users = models.list_users()
    assert len(users) == 2
    assert all("password_hash" not in u for u in users)
    assert {u["email"] for u in users} == {"a@x.com", "b@x.com"}

    full = models.get_user_by_email("a@x.com")
    assert "password_hash" in full
    pub = auth_utils.public_user_dict(full)
    assert "password_hash" not in pub and pub["role"] == "admin"
    print("[PASS] list_users + public_user_dict strip password_hash")


def test_get_current_user_and_admin_gate():
    _setup_temp_db()
    models.insert_user("admin@x.com", auth_utils.hash_password("123456"), "admin")
    admin = models.get_user_by_email("admin@x.com")
    tok = auth_utils.create_access_token(admin)

    req = FakeRequest(headers={"Authorization": f"Bearer {tok}"})
    assert auth_utils.get_current_user(req)["id"] == admin["id"]

    # disabled user -> None even with a structurally valid token
    models.update_user(admin["id"], status="disabled")
    assert auth_utils.get_current_user(req) is None
    models.update_user(admin["id"], status="active")

    # missing / garbage token -> None
    assert auth_utils.get_current_user(FakeRequest()) is None
    assert auth_utils.get_current_user(FakeRequest(headers={"Authorization": "Bearer nope"})) is None

    # check_admin_or_token: JWT(admin) accepted, legacy admin_token accepted, neither -> 401
    auth_utils.check_admin_or_token(req)
    auth_utils.check_admin_or_token(FakeRequest(headers={"X-Admin-Token": config.admin_token}))
    try:
        auth_utils.check_admin_or_token(FakeRequest())
        assert False
    except HTTPException as e:
        assert e.status_code == 401
    print("[PASS] get_current_user + check_admin_or_token")


def test_admin_self_and_last_admin_protection():
    from admin_dashboard.routes.users import update_user_endpoint, UpdateUserRequest
    _setup_temp_db()
    aid = models.insert_user("boss@x.com", auth_utils.hash_password("123456"), "admin")
    cid = models.insert_user("co@x.com", auth_utils.hash_password("123456"), "admin")
    admin = models.get_user_by_id(aid)
    co = models.get_user_by_id(cid)
    assert models.count_users_by_role("admin") == 2

    # self-protection: cannot demote / disable yourself
    try:
        asyncio.run(update_user_endpoint(co["id"], UpdateUserRequest(status="disabled"), co))
        assert False
    except HTTPException as e:
        assert e.status_code == 400
    try:
        asyncio.run(update_user_endpoint(co["id"], UpdateUserRequest(role="user"), co))
        assert False
    except HTTPException as e:
        assert e.status_code == 400

    # valid cross-admin demotion when more than one admin exists
    asyncio.run(update_user_endpoint(co["id"], UpdateUserRequest(role="user"), admin))
    assert models.get_user_by_id(cid)["role"] == "user"
    assert models.count_users_by_role("admin") == 1

    # last-admin protection: simulate a different admin caller (id != target) on
    # the sole remaining admin -- exercises the redundant defense-in-depth branch.
    sole = models.get_user_by_email("boss@x.com")
    other_admin = {"id": sole["id"] + 1000, "role": "admin"}
    try:
        asyncio.run(update_user_endpoint(sole["id"], UpdateUserRequest(role="user"), other_admin))
        assert False
    except HTTPException as e:
        assert e.status_code == 400
        assert "管理员" in e.detail
    try:
        asyncio.run(update_user_endpoint(sole["id"], UpdateUserRequest(status="disabled"), other_admin))
        assert False
    except HTTPException as e:
        assert e.status_code == 400

    # status toggle on a non-admin target is allowed
    asyncio.run(update_user_endpoint(cid, UpdateUserRequest(status="disabled"), admin))
    assert models.get_user_by_id(cid)["status"] == "disabled"

    print("[PASS] self-protection + cross-admin demotion + last-admin guard + status toggle")


def test_reset_password_and_admin_create():
    from admin_dashboard.routes.users import (
        reset_password_endpoint, create_user_endpoint,
        ResetPasswordRequest, CreateUserRequest,
    )
    from admin_dashboard.routes.auth import login, CredentialRequest
    _setup_temp_db()
    admin = models.get_user_by_id(
        models.insert_user("admin@x.com", auth_utils.hash_password("123456"), "admin")
    )

    # admin creates a user
    created = asyncio.run(
        create_user_endpoint(CreateUserRequest(email="new@x.com", password="abcdef", role="user"), admin)
    )
    assert created["user"]["email"] == "new@x.com"

    # duplicate -> 409
    try:
        asyncio.run(create_user_endpoint(CreateUserRequest(email="new@x.com", password="abcdef"), admin))
        assert False
    except HTTPException as e:
        assert e.status_code == 409

    # explicit reset value is applied and immediately usable for login
    r1 = asyncio.run(
        reset_password_endpoint(created["user"]["id"], ResetPasswordRequest(new_password="newpw123"), admin)
    )
    assert r1["password"] == "newpw123"
    asyncio.run(login(CredentialRequest(email="new@x.com", password="newpw123")))

    # no value provided -> a 12-char random password is generated and returned
    r2 = asyncio.run(reset_password_endpoint(created["user"]["id"], ResetPasswordRequest(), admin))
    assert len(r2["password"]) == 12 and r2["password"] != "newpw123"

    print("[PASS] reset-password + admin create user")


if __name__ == "__main__":
    for fn in [
        test_password_hash_and_verify,
        test_jwt_roundtrip_and_invalid,
        test_bootstrap_first_user_is_admin,
        test_login_verification_and_update,
        test_list_users_excludes_password_hash,
        test_get_current_user_and_admin_gate,
        test_admin_self_and_last_admin_protection,
        test_reset_password_and_admin_create,
    ]:
        fn()
    for d in _TMP_DIRS:
        shutil.rmtree(d, ignore_errors=True)
    print("All auth tests passed.")
