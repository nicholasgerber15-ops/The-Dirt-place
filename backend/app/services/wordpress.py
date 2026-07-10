import httpx
from typing import Optional
from app.core.config import get_settings
from bs4 import BeautifulSoup

settings = get_settings()


class WordPressService:
    """WordPress management via REST API and XML-RPC for updates, security, and content management."""

    def __init__(self, site_url: str, username: str = "", app_password: str = ""):
        self.site_url = site_url.rstrip("/")
        self.api_base = f"{self.site_url}/wp-json/wp/v2"
        self.username = username or settings.wordpress_default_user
        self.app_password = app_password or settings.wordpress_default_app_password

    def _auth(self) -> tuple[str, str]:
        return (self.username, self.app_password)

    async def _request(self, method: str, endpoint: str, **kwargs) -> dict:
        async with httpx.AsyncClient(timeout=30, verify=False) as client:
            response = await client.request(
                method,
                f"{self.api_base}{endpoint}",
                auth=self._auth() if self.username else None,
                **kwargs,
            )
            response.raise_for_status()
            return response.json()

    # --- Site Info ---

    async def get_site_info(self) -> dict:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(f"{self.site_url}/wp-json/")
            resp.raise_for_status()
            return resp.json()

    async def detect_wp_version(self) -> Optional[str]:
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(self.site_url)
                soup = BeautifulSoup(resp.text, "html.parser")
                meta = soup.find("meta", {"name": "generator"})
                if meta and "WordPress" in meta.get("content", ""):
                    return meta["content"].replace("WordPress ", "")
        except Exception:
            pass
        return None

    # --- Content Management ---

    async def list_posts(self, per_page: int = 10, page: int = 1, status: str = "publish") -> list:
        return await self._request("GET", "/posts", params={"per_page": per_page, "page": page, "status": status})

    async def get_post(self, post_id: int) -> dict:
        return await self._request("GET", f"/posts/{post_id}")

    async def create_post(self, title: str, content: str, status: str = "draft", categories: list = None, tags: list = None) -> dict:
        payload = {"title": title, "content": content, "status": status}
        if categories:
            payload["categories"] = categories
        if tags:
            payload["tags"] = tags
        return await self._request("POST", "/posts", json=payload)

    async def update_post(self, post_id: int, **kwargs) -> dict:
        return await self._request("POST", f"/posts/{post_id}", json=kwargs)

    async def delete_post(self, post_id: int, force: bool = True) -> dict:
        return await self._request("DELETE", f"/posts/{post_id}", params={"force": force})

    # --- Pages ---

    async def list_pages(self, per_page: int = 10) -> list:
        return await self._request("GET", "/pages", params={"per_page": per_page})

    async def get_page(self, page_id: int) -> dict:
        return await self._request("GET", f"/pages/{page_id}")

    # --- Users ---

    async def list_users(self) -> list:
        return await self._request("GET", "/users")

    async def get_user(self, user_id: int) -> dict:
        return await self._request("GET", f"/users/{user_id}")

    # --- Plugins & Themes (via WP-CLI detection) ---

    async def detect_plugins(self) -> list:
        """Detect installed plugins by scanning the page source."""
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                resp = await client.get(self.site_url)
                soup = BeautifulSoup(resp.text, "html.parser")
                plugins = []
                for link in soup.find_all("link", {"rel": "stylesheet"}):
                    href = link.get("href", "")
                    if "/wp-content/plugins/" in href:
                        plugin_name = href.split("/wp-content/plugins/")[1].split("/")[0]
                        if plugin_name not in plugins:
                            plugins.append(plugin_name)
                return plugins
        except Exception:
            return []

    async def detect_themes(self) -> list:
        """Detect active themes."""
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                resp = await client.get(self.site_url)
                soup = BeautifulSoup(resp.text, "html.parser")
                themes = []
                for link in soup.find_all("link", {"rel": "stylesheet"}):
                    href = link.get("href", "")
                    if "/wp-content/themes/" in href:
                        theme_name = href.split("/wp-content/themes/")[1].split("/")[0]
                        if theme_name not in themes:
                            themes.append(theme_name)
                return themes
        except Exception:
            return []

    # --- Security Checks ---

    async def security_scan(self) -> dict:
        """Basic WordPress security scan."""
        findings = []

        # Check login page exposure
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(f"{self.site_url}/wp-login.php")
                if resp.status_code == 200:
                    findings.append({"severity": "info", "message": "Login page is accessible"})
        except Exception:
            findings.append({"severity": "low", "message": "Could not check login page"})

        # Check XML-RPC
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.post(f"{self.site_url}/xmlrpc.php", content="<methodCall><methodName>system.listMethods</methodName></methodCall>")
                if resp.status_code == 200:
                    findings.append({"severity": "medium", "message": "XML-RPC is enabled (potential brute force vector)"})
        except Exception:
            findings.append({"severity": "info", "message": "XML-RPC not accessible"})

        # Check readme.html exposure
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(f"{self.site_url}/readme.html")
                if resp.status_code == 200 and "WordPress" in resp.text:
                    findings.append({"severity": "low", "message": "readme.html is publicly accessible (leaks version info)"})
        except Exception:
            pass

        # Check wp-json user enumeration
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(f"{self.site_url}/wp-json/wp/v2/users")
                if resp.status_code == 200:
                    users = resp.json()
                    if users:
                        findings.append({"severity": "medium", "message": f"User enumeration possible via REST API ({len(users)} users exposed)"})
        except Exception:
            pass

        return {"findings": findings, "total_issues": len(findings)}

    # --- Health Check ---

    async def health_check(self) -> dict:
        """Comprehensive WordPress health check."""
        checks = {}

        # Response time
        import time
        start = time.time()
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                resp = await client.get(self.site_url)
                checks["status_code"] = resp.status_code
                checks["response_time_ms"] = int((time.time() - start) * 1000)
                checks["is_online"] = resp.status_code == 200
        except Exception as e:
            checks["is_online"] = False
            checks["error"] = str(e)

        # Version detection
        checks["wp_version"] = await self.detect_wp_version()

        # Plugin detection
        checks["plugins"] = await self.detect_plugins()
        checks["theme"] = await self.detect_themes()

        # SSL check
        checks["has_ssl"] = self.site_url.startswith("https://")

        return checks


def get_wordpress_manager(site_url: str) -> WordPressService:
    return WordPressService(site_url)
