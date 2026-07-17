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
from typing import Optional, AsyncGenerator
from app.core.config import get_settings

settings = get_settings()


class MyFinnModel:
    """LLM client for My Finn Model - supports local Ollama, OpenAI-compatible APIs, and custom endpoints."""

    def __init__(self):
        self.base_url = settings.myfinn_model_url.rstrip("/")
        self.model = settings.myfinn_model_name
        self.api_key = settings.myfinn_api_key
        self.headers = {}
        if self.api_key:
            self.headers["Authorization"] = f"Bearer {self.api_key}"
        self.headers["Content-Type"] = "application/json"

    async def chat(
        self,
        messages: list[dict],
        temperature: float = 0.7,
        max_tokens: int = 2048,
        system_prompt: Optional[str] = None,
    ) -> str:
        """Send a chat completion request to My Finn Model."""
        if system_prompt:
            messages = [{"role": "system", "content": system_prompt}] + messages

        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        async with httpx.AsyncClient(timeout=120) as client:
            response = await client.post(
                f"{self.base_url}/v1/chat/completions",
                json=payload,
                headers=self.headers,
            )
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"]

    async def stream_chat(
        self,
        messages: list[dict],
        temperature: float = 0.7,
        max_tokens: int = 2048,
        system_prompt: Optional[str] = None,
    ) -> AsyncGenerator[str, None]:
        """Stream chat completion tokens from My Finn Model."""
        if system_prompt:
            messages = [{"role": "system", "content": system_prompt}] + messages

        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": True,
        }

        async with httpx.AsyncClient(timeout=120) as client:
            async with client.stream(
                "POST",
                f"{self.base_url}/v1/chat/completions",
                json=payload,
                headers=self.headers,
            ) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        data = line[6:]
                        if data.strip() == "[DONE]":
                            break
                        import json
                        chunk = json.loads(data)
                        delta = chunk.get("choices", [{}])[0].get("delta", {})
                        if "content" in delta:
                            yield delta["content"]

    async def analyze_site(self, site_data: dict) -> dict:
        """Use the LLM to analyze site health and provide recommendations."""
        system_prompt = """You are SiteManager AI, an expert in website management, security, and performance.
Analyze the provided site data and return a JSON response with:
- health_score: 0-100
- status: "healthy" | "warning" | "critical"
- issues: list of issues found
- recommendations: list of actionable recommendations
- priority_actions: top 3 things to do immediately
Always respond with valid JSON."""

        messages = [{"role": "user", "content": f"Analyze this site data:\n{site_data}"}]
        response = await self.chat(messages, system_prompt=system_prompt, temperature=0.3)

        import json
        try:
            return json.loads(response)
        except json.JSONDecodeError:
            return {"health_score": 0, "status": "error", "issues": [response], "recommendations": [], "priority_actions": []}

    async def generate_ticket_response(self, ticket_data: dict, knowledge_base: str = "") -> str:
        """Generate a helpful response for a support ticket."""
        system_prompt = f"""You are a helpful support agent for website management.
Generate a professional, helpful response for this support ticket.
{f'Knowledge base context: {knowledge_base}' if knowledge_base else ''}
Be concise and actionable."""

        messages = [{"role": "user", "content": f"Ticket: {ticket_data}"}]
        return await self.chat(messages, system_prompt=system_prompt, temperature=0.5)

    async def security_analysis(self, scan_results: dict) -> dict:
        """Analyze security scan results and prioritize findings."""
        system_prompt = """You are a cybersecurity expert analyzing website scan results.
Return a JSON response with:
- risk_level: "low" | "medium" | "high" | "critical"
- summary: brief overall assessment
- critical_findings: list of items requiring immediate attention
- remediation_steps: ordered list of fixes with priority
Always respond with valid JSON."""

        messages = [{"role": "user", "content": f"Security scan results:\n{scan_results}"}]
        response = await self.chat(messages, system_prompt=system_prompt, temperature=0.2)

        import json
        try:
            return json.loads(response)
        except json.JSONDecodeError:
            return {"risk_level": "unknown", "summary": response, "critical_findings": [], "remediation_steps": []}


llm = MyFinnModel()
