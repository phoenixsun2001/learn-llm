"""Tests for the user library: favorites, history, progress, and user isolation.

Run:  cd pipeline && PYTHONPATH=. python tests/test_library.py

Note: route handlers with Query() defaults are called with explicit type=/limit=
because Query(default=...) is a FastAPI construct that only resolves to the real
default through the framework, not on a direct call.
"""
import asyncio
import os
import shutil
import tempfile

from fastapi import HTTPException

import auth_utils
from admin_dashboard import models
from admin_dashboard.routes.library import (
    add_favorite_endpoint, get_favorites, remove_favorite_endpoint,
    record_view_endpoint, get_history, clear_history_endpoint,
    get_progress, put_progress, clear_progress_endpoint,
    FavoriteRequest, HistoryRequest, ProgressRequest,
)

_TMP_DIRS = []


class FakeRequest:
    def __init__(self, headers=None, cookies=None):
        self.headers = headers or {}
        self.cookies = cookies or {}


def _setup_temp_db():
    tmp = tempfile.mkdtemp()
    _TMP_DIRS.append(tmp)
    models.DB_PATH = os.path.join(tmp, "test_lib.db")
    models.init_db()
    return tmp


def test_favorites_crud_and_dedup():
    _setup_temp_db()
    u1 = {"id": 1}
    asyncio.run(add_favorite_endpoint(FavoriteRequest(item_type="tutorial", item_slug="intro-llm"), user=u1))
    asyncio.run(add_favorite_endpoint(FavoriteRequest(item_type="tool", item_slug="chatgpt"), user=u1))
    asyncio.run(add_favorite_endpoint(FavoriteRequest(item_type="tutorial", item_slug="intro-llm"), user=u1))

    favs = asyncio.run(get_favorites(user=u1, type=None))["favorites"]
    assert len(favs) == 2
    assert {(f["item_type"], f["item_slug"]) for f in favs} == {("tutorial", "intro-llm"), ("tool", "chatgpt")}

    assert models.is_favorite(1, "tutorial", "intro-llm")
    assert not models.is_favorite(1, "tutorial", "nope")

    asyncio.run(remove_favorite_endpoint("tutorial", "intro-llm", user=u1))
    assert not models.is_favorite(1, "tutorial", "intro-llm")
    print("[PASS] favorites CRUD + dedup")


def test_history_upsert_and_view_count():
    _setup_temp_db()
    u = {"id": 7}
    asyncio.run(record_view_endpoint(HistoryRequest(item_type="tutorial", item_slug="a"), user=u))
    asyncio.run(record_view_endpoint(HistoryRequest(item_type="tutorial", item_slug="a"), user=u))
    asyncio.run(record_view_endpoint(HistoryRequest(item_type="tool", item_slug="b"), user=u))

    hist = asyncio.run(get_history(user=u, limit=50))["history"]
    assert len(hist) == 2
    a = next(h for h in hist if h["item_slug"] == "a")
    assert a["view_count"] == 2
    b = next(h for h in hist if h["item_slug"] == "b")
    assert b["view_count"] == 1

    asyncio.run(clear_history_endpoint(user=u))
    assert asyncio.run(get_history(user=u, limit=50))["history"] == []
    print("[PASS] history upsert + view_count + clear")


def test_progress_upsert_and_list():
    _setup_temp_db()
    u = {"id": 3}
    asyncio.run(put_progress("tut-1", ProgressRequest(completed=False, chapterIndex=2, chapters={"0": {"completed": True}}), user=u))
    prog = asyncio.run(get_progress(user=u))
    assert prog["tut-1"]["completed"] is False
    assert prog["tut-1"]["chapterIndex"] == 2
    assert prog["tut-1"]["chapters"] == {"0": {"completed": True}}

    asyncio.run(put_progress("tut-1", ProgressRequest(completed=True, chapterIndex=2, chapters={"0": {"completed": True}, "1": {"completed": True}}), user=u))
    prog = asyncio.run(get_progress(user=u))
    assert prog["tut-1"]["completed"] is True
    assert prog["tut-1"]["completedAt"]
    assert len(prog["tut-1"]["chapters"]) == 2

    asyncio.run(clear_progress_endpoint(user=u))
    assert asyncio.run(get_progress(user=u)) == {}
    print("[PASS] progress upsert + list + clear")


def test_user_isolation():
    _setup_temp_db()
    a = {"id": 1}
    b = {"id": 2}
    asyncio.run(add_favorite_endpoint(FavoriteRequest(item_type="tutorial", item_slug="shared-looking"), user=a))
    assert asyncio.run(get_favorites(user=b, type=None))["favorites"] == []
    assert len(asyncio.run(get_favorites(user=a, type=None))["favorites"]) == 1

    asyncio.run(record_view_endpoint(HistoryRequest(item_type="tool", item_slug="x"), user=a))
    assert asyncio.run(get_history(user=b, limit=50))["history"] == []
    assert len(asyncio.run(get_history(user=a, limit=50))["history"]) == 1

    asyncio.run(put_progress("tut", ProgressRequest(completed=True), user=a))
    assert asyncio.run(get_progress(user=b)) == {}
    assert asyncio.run(get_progress(user=a))["tut"]["completed"] is True
    print("[PASS] user isolation (favorites/history/progress)")


def test_invalid_item_type_400():
    _setup_temp_db()
    try:
        asyncio.run(add_favorite_endpoint(FavoriteRequest(item_type="bogus", item_slug="x"), user={"id": 1}))
        assert False
    except HTTPException as e:
        assert e.status_code == 400
    try:
        asyncio.run(record_view_endpoint(HistoryRequest(item_type="bogus", item_slug="x"), user={"id": 1}))
        assert False
    except HTTPException as e:
        assert e.status_code == 400
    print("[PASS] invalid item_type -> 400")


def test_require_auth_rejects_no_token():
    try:
        auth_utils.require_auth(FakeRequest())
        assert False
    except HTTPException as e:
        assert e.status_code == 401
    print("[PASS] require_auth rejects missing token (401)")


def test_type_filter_on_list_favorites():
    _setup_temp_db()
    u = {"id": 1}
    asyncio.run(add_favorite_endpoint(FavoriteRequest(item_type="tutorial", item_slug="t1"), user=u))
    asyncio.run(add_favorite_endpoint(FavoriteRequest(item_type="tool", item_slug="x1"), user=u))
    asyncio.run(add_favorite_endpoint(FavoriteRequest(item_type="prompt", item_slug="p1"), user=u))
    only_tools = asyncio.run(get_favorites(user=u, type="tool"))
    assert len(only_tools["favorites"]) == 1
    assert only_tools["favorites"][0]["item_type"] == "tool"
    print("[PASS] favorites type filter")


if __name__ == "__main__":
    for fn in [
        test_favorites_crud_and_dedup,
        test_history_upsert_and_view_count,
        test_progress_upsert_and_list,
        test_user_isolation,
        test_invalid_item_type_400,
        test_require_auth_rejects_no_token,
        test_type_filter_on_list_favorites,
    ]:
        fn()
    for d in _TMP_DIRS:
        shutil.rmtree(d, ignore_errors=True)
    print("All library tests passed.")
