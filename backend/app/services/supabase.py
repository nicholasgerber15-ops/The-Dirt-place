# UNIVERSAL NRG-CO HEADER BLOCK
# Use this exact banner at the top of source files. License/covenant terms still apply.
# 
################################################################
#                                                              #
#                ⚡  N R G - C O  ⚡                          #
#                                                              #
#    CRITICAL ASSET — CLOSED SOURCE / CONFIDENTIAL              #
#    PROPRIETARY / UNDER DEVELOPMENT / SECRET                   #
#                                                              #
################################################################
import httpx
from typing import Optional
from app.core.config import get_settings

settings = get_settings()


class SupabaseService:
    """Supabase integration for auth, realtime, storage, and Edge Functions."""

    def __init__(self):
        self.url = settings.supabase_url.rstrip("/")
        self.key = settings.supabase_key
        self.service_key = settings.supabase_service_key
        self.headers = {
            "apikey": self.key,
            "Authorization": f"Bearer {self.key}",
            "Content-Type": "application/json",
        }
        self.service_headers = {
            "apikey": self.service_key,
            "Authorization": f"Bearer {self.service_key}",
            "Content-Type": "application/json",
        }

    async def _request(self, method: str, endpoint: str, service: bool = False, **kwargs) -> dict:
        headers = self.service_headers if service else self.headers
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.request(
                method, f"{self.url}{endpoint}", headers=headers, **kwargs
            )
            response.raise_for_status()
            return response.json() if response.content else {}

    # --- Auth ---

    async def signup(self, email: str, password: str) -> dict:
        return await self._request("POST", "/auth/v1/signup", json={"email": email, "password": password})

    async def login(self, email: str, password: str) -> dict:
        return await self._request("POST", "/auth/v1/token?grant_type=password", json={"email": email, "password": password})

    async def get_user(self, access_token: str) -> dict:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(
                f"{self.url}/auth/v1/user",
                headers={"apikey": self.key, "Authorization": f"Bearer {access_token}"},
            )
            resp.raise_for_status()
            return resp.json()

    # --- Database (PostgREST) ---

    async def select(self, table: str, columns: str = "*", filters: dict = None, order: str = None, limit: int = None) -> list:
        params = {"select": columns}
        if filters:
            for k, v in filters.items():
                params[k] = f"eq.{v}"
        if order:
            params["order"] = order
        if limit:
            params["limit"] = limit
        return await self._request("GET", f"/rest/v1/{table}", params=params)

    async def insert(self, table: str, data: dict | list) -> list:
        return await self._request("POST", f"/rest/v1/{table}", json=data, params={"returning": "representation"})

    async def update(self, table: str, data: dict, filters: dict) -> list:
        params = {"returning": "representation"}
        for k, v in filters.items():
            params[k] = f"eq.{v}"
        return await self._request("PATCH", f"/rest/v1/{table}", json=data, params=params)

    async def delete(self, table: str, filters: dict) -> list:
        params = {}
        for k, v in filters.items():
            params[k] = f"eq.{v}"
        return await self._request("DELETE", f"/rest/v1/{table}", params=params)

    # --- Storage ---

    async def upload_file(self, bucket: str, path: str, file_bytes: bytes, content_type: str = "application/octet-stream") -> dict:
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(
                f"{self.url}/storage/v1/object/{bucket}/{path}",
                headers={"apikey": self.key, "Authorization": f"Bearer {self.key}", "Content-Type": content_type},
                content=file_bytes,
            )
            resp.raise_for_status()
            return resp.json()

    async def get_public_url(self, bucket: str, path: str) -> str:
        return f"{self.url}/storage/v1/object/public/{bucket}/{path}"

    async def list_buckets(self) -> list:
        return await self._request("GET", "/storage/v1/bucket")

    # --- Edge Functions ---

    async def invoke_function(self, function_name: str, body: dict = None) -> dict:
        return await self._request(
            "POST",
            f"/functions/v1/{function_name}",
            json=body or {},
            service=True,
        )

    # --- Realtime (subscribe via websocket) ---

    def get_realtime_url(self, channel: str) -> str:
        ws_url = self.url.replace("https://", "wss://").replace("http://", "ws://")
        return f"{ws_url}/realtime/v1/websocket?apikey={self.key}&vsn=1.0.0"


supabase = SupabaseService()
