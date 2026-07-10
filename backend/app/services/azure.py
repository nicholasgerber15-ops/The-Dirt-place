import httpx
from typing import Optional
from app.core.config import get_settings

settings = get_settings()

AZURE_BASE = "https://management.azure.com"


class AzureService:
    """Azure Resource Manager integration for managing cloud resources, VMs, App Services, and monitoring."""

    def __init__(self):
        self.subscription_id = settings.azure_subscription_id
        self.tenant_id = settings.azure_tenant_id
        self.client_id = settings.azure_client_id
        self.client_secret = settings.azure_client_secret
        self._token: Optional[str] = None

    async def _get_token(self) -> str:
        if self._token:
            return self._token
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                f"https://login.microsoftonline.com/{self.tenant_id}/oauth2/v2.0/token",
                data={
                    "grant_type": "client_credentials",
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "scope": "https://management.azure.com/.default",
                },
            )
            resp.raise_for_status()
            self._token = resp.json()["access_token"]
            return self._token

    async def _request(self, method: str, endpoint: str, **kwargs) -> dict:
        token = await self._get_token()
        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.request(
                method,
                f"{AZURE_BASE}{endpoint}",
                headers=headers,
                **kwargs,
            )
            response.raise_for_status()
            return response.json()

    # --- Resource Groups ---

    async def list_resource_groups(self) -> dict:
        return await self._request("GET", f"/subscriptions/{self.subscription_id}/resourcegroups?api-version=2021-04-01")

    async def get_resource_group(self, rg_name: str) -> dict:
        return await self._request("GET", f"/subscriptions/{self.subscription_id}/resourcegroups/{rg_name}?api-version=2021-04-01")

    async def create_resource_group(self, rg_name: str, location: str) -> dict:
        return await self._request(
            "PUT",
            f"/subscriptions/{self.subscription_id}/resourcegroups/{rg_name}?api-version=2021-04-01",
            json={"location": location},
        )

    # --- Virtual Machines ---

    async def list_vms(self, rg_name: Optional[str] = None) -> dict:
        if rg_name:
            url = f"/subscriptions/{self.subscription_id}/resourceGroups/{rg_name}/providers/Microsoft.Compute/virtualMachines?api-version=2023-03-01"
        else:
            url = f"/subscriptions/{self.subscription_id}/providers/Microsoft.Compute/virtualMachines?api-version=2023-03-01"
        return await self._request("GET", url)

    async def get_vm(self, rg_name: str, vm_name: str) -> dict:
        return await self._request(
            "GET",
            f"/subscriptions/{self.subscription_id}/resourceGroups/{rg_name}/providers/Microsoft.Compute/virtualMachines/{vm_name}?api-version=2023-03-01",
        )

    async def start_vm(self, rg_name: str, vm_name: str) -> dict:
        return await self._request(
            "POST",
            f"/subscriptions/{self.subscription_id}/resourceGroups/{rg_name}/providers/Microsoft.Compute/virtualMachines/{vm_name}/start?api-version=2023-03-01",
        )

    async def stop_vm(self, rg_name: str, vm_name: str) -> dict:
        return await self._request(
            "POST",
            f"/subscriptions/{self.subscription_id}/resourceGroups/{rg_name}/providers/Microsoft.Compute/virtualMachines/{vm_name}/powerOff?api-version=2023-03-01",
        )

    async def restart_vm(self, rg_name: str, vm_name: str) -> dict:
        return await self._request(
            "POST",
            f"/subscriptions/{self.subscription_id}/resourceGroups/{rg_name}/providers/Microsoft.Compute/virtualMachines/{vm_name}/restart?api-version=2023-03-01",
        )

    # --- App Services ---

    async def list_app_services(self, rg_name: Optional[str] = None) -> dict:
        if rg_name:
            url = f"/subscriptions/{self.subscription_id}/resourceGroups/{rg_name}/providers/Microsoft.Web/sites?api-version=2022-09-01"
        else:
            url = f"/subscriptions/{self.subscription_id}/providers/Microsoft.Web/sites?api-version=2022-09-01"
        return await self._request("GET", url)

    async def get_app_service(self, rg_name: str, site_name: str) -> dict:
        return await self._request(
            "GET",
            f"/subscriptions/{self.subscription_id}/resourceGroups/{rg_name}/providers/Microsoft.Web/sites/{site_name}?api-version=2022-09-01",
        )

    async def restart_app_service(self, rg_name: str, site_name: str) -> dict:
        return await self._request(
            "POST",
            f"/subscriptions/{self.subscription_id}/resourceGroups/{rg_name}/providers/Microsoft.Web/sites/{site_name}/restart?api-version=2022-09-01",
        )

    # --- Monitoring / Metrics ---

    async def get_vm_metrics(self, rg_name: str, vm_name: str, metric_names: str = "Percentage CPU,Available Memory Bytes") -> dict:
        resource_id = f"/subscriptions/{self.subscription_id}/resourceGroups/{rg_name}/providers/Microsoft.Compute/virtualMachines/{vm_name}"
        return await self._request(
            "GET",
            f"{resource_id}/providers/microsoft.insights/metrics?api-version=2018-01-01&metricnames={metric_names}&interval=PT1H",
        )

    async def list_activity_log(self, rg_name: Optional[str] = None) -> dict:
        filter_str = f"eventTimestamp ge datetime'2024-01-01T00:00:00Z'"
        if rg_name:
            filter_str += f" and resourceGroupName eq '{rg_name}'"
        return await self._request(
            "GET",
            f"/subscriptions/{self.subscription_id}/providers/Microsoft.Insights/eventtypes/management/values?api-version=2015-04-01&$filter={filter_str}&$top=20",
        )

    # --- SQL Databases ---

    async def list_sql_servers(self, rg_name: Optional[str] = None) -> dict:
        if rg_name:
            url = f"/subscriptions/{self.subscription_id}/resourceGroups/{rg_name}/providers/Microsoft.Sql/servers?api-version=2021-11-01"
        else:
            url = f"/subscriptions/{self.subscription_id}/providers/Microsoft.Sql/servers?api-version=2021-11-01"
        return await self._request("GET", url)

    # --- Cost Management ---

    async def get_cost_summary(self) -> dict:
        return await self._request(
            "GET",
            f"/subscriptions/{self.subscription_id}/providers/Microsoft.CostManagement/query?api-version=2021-10-01",
            json={
                "type": "ActualCost",
                "timeframe": "MonthToDate",
                "dataset": {
                    "granularity": "Daily",
                    "aggregation": {"totalCost": {"name": "PreTaxCost", "function": "Sum"}},
                },
            },
        )


azure = AzureService()
