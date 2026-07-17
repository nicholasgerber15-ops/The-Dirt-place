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

CF_BASE = "https://api.cloudflare.com/client/v4"


class CloudflareService:
    """Cloudflare API integration for DNS, security, analytics, and CDN management."""

    def __init__(self):
        self.token = settings.cloudflare_api_token
        self.zone_id = settings.cloudflare_zone_id
        self.account_id = settings.cloudflare_account_id
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json",
        }

    async def _request(self, method: str, endpoint: str, **kwargs) -> dict:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.request(
                method, f"{CF_BASE}{endpoint}", headers=self.headers, **kwargs
            )
            response.raise_for_status()
            return response.json()

    # --- DNS Management ---

    async def list_dns_records(self, record_type: str = "A", page: int = 1, per_page: int = 50) -> dict:
        return await self._request(
            "GET",
            f"/zones/{self.zone_id}/dns_records",
            params={"type": record_type, "page": page, "per_page": per_page},
        )

    async def create_dns_record(self, record_type: str, name: str, content: str, ttl: int = 1, proxied: bool = True) -> dict:
        return await self._request(
            "POST",
            f"/zones/{self.zone_id}/dns_records",
            json={"type": record_type, "name": name, "content": content, "ttl": ttl, "proxied": proxied},
        )

    async def update_dns_record(self, record_id: str, record_type: str, name: str, content: str, ttl: int = 1, proxied: bool = True) -> dict:
        return await self._request(
            "PUT",
            f"/zones/{self.zone_id}/dns_records/{record_id}",
            json={"type": record_type, "name": name, "content": content, "ttl": ttl, "proxied": proxied},
        )

    async def delete_dns_record(self, record_id: str) -> dict:
        return await self._request("DELETE", f"/zones/{self.zone_id}/dns_records/{record_id}")

    # --- Security / WAF ---

    async def get_security_level(self) -> dict:
        return await self._request("GET", f"/zones/{self.zone_id}/settings/security_level")

    async def set_security_level(self, level: str = "medium") -> dict:
        valid_levels = ["essentially_off", "low", "medium", "high", "under_attack"]
        if level not in valid_levels:
            raise ValueError(f"Invalid level. Must be one of: {valid_levels}")
        return await self._request(
            "PATCH",
            f"/zones/{self.zone_id}/settings/security_level",
            json={"value": level},
        )

    async def get_waf_rules(self) -> dict:
        return await self._request("GET", f"/zones/{self.zone_id}/firewall/rules")

    async def create_waf_rule(self, rule_expression: str, action: str = "block", description: str = "") -> dict:
        return await self._request(
            "POST",
            f"/zones/{self.zone_id}/firewall/rules",
            json={"filter": {"expression": rule_expression}, "action": action, "description": description},
        )

    async def enable_bot_management(self) -> dict:
        return await self._request(
            "PATCH",
            f"/zones/{self.zone_id}/settings/bot_management",
            json={"value": "on"},
        )

    # --- Analytics ---

    async def get_analytics_dashboard(self, since: str = "-1440", until: str = "0") -> dict:
        return await self._request(
            "GET",
            f"/zones/{self.zone_id}/analytics/dashboard",
            params={"since": since, "until": until},
        )

    async def get_threat_analytics(self) -> dict:
        return await self._request("GET", f"/zones/{self.zone_id}/security/events")

    # --- SSL / TLS ---

    async def get_ssl_settings(self) -> dict:
        return await self._request("GET", f"/zones/{self.zone_id}/settings/min_tls_version")

    async def set_ssl_mode(self, mode: str = "full_strict") -> dict:
        valid_modes = ["off", "flexible", "full", "full_strict"]
        if mode not in valid_modes:
            raise ValueError(f"Invalid mode. Must be one of: {valid_modes}")
        return await self._request(
            "PATCH",
            f"/zones/{self.zone_id}/settings/ssl",
            json={"value": mode},
        )

    # --- Purge Cache ---

    async def purge_all_cache(self) -> dict:
        return await self._request(
            "DELETE",
            f"/zones/{self.zone_id}/purge_cache",
            json={"purge_everything": True},
        )

    async def purge_urls(self, urls: list[str]) -> dict:
        return await self._request(
            "DELETE",
            f"/zones/{self.zone_id}/purge_cache",
            json={"files": urls},
        )

    # --- Rate Limiting ---

    async def list_rate_rules(self) -> dict:
        return await self._request("GET", f"/zones/{self.zone_id}/rate_limits")

    async def create_rate_rule(self, expression: str, request_rate: int = 100, period: int = 60) -> dict:
        return await self._request(
            "POST",
            f"/zones/{self.zone_id}/rate_limits",
            json={
                "match": {"request": {"expression": expression}},
                "action": {"mode": "simulate", "timeout": 600},
                "count_by": ["ip"],
                "request_rate": {"count": request_rate, "period": period},
                "description": f"Auto rate limit: {expression}",
            },
        )

    # --- Page Rules ---

    async def list_page_rules(self) -> dict:
        return await self._request("GET", f"/zones/{self.zone_id}/pagerules")

    # --- Health Checks ---

    async def create_health_check(self, name: str, url: str, expected_codes: str = "200") -> dict:
        return await self._request(
            "POST",
            f"/zones/{self.zone_id}/healthchecks",
            json={"name": name, "url": url, "expected_codes": expected_codes, "type": "HTTP"},
        )

    async def list_health_checks(self) -> dict:
        return await self._request("GET", f"/zones/{self.zone_id}/healthchecks")


cloudflare = CloudflareService()
