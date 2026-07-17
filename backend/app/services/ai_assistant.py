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
import json
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.site import Site
from app.models.ticket import Ticket, TicketStatus
from app.models.security import SecurityScan
from app.models.uptime import UptimeLog
from app.services.llm import llm
from app.services.monitor import monitor
from app.services.mongodb import mongodb
from app.services.cloudflare import cloudflare


class AIAssistant:
    """AI-powered assistant for site management, diagnostics, and natural language operations."""

    SYSTEM_PROMPT = """You are SiteManager AI, an intelligent assistant for managing websites.
You have access to tools for:
- Uptime monitoring and diagnostics
- Security scanning and analysis
- Support ticket management
- Cloudflare DNS/security management
- WordPress site management
- Azure cloud resource management

When users ask questions:
1. Analyze the current state of their sites
2. Provide actionable recommendations
3. Execute commands when asked (with confirmation for destructive actions)
4. Use data from monitoring, scans, and tickets to inform responses

Always be concise, professional, and security-conscious.
When uncertain, ask clarifying questions rather than making assumptions."""

    async def chat(
        self,
        user_id: int,
        session_id: str,
        message: str,
        db: AsyncSession,
    ) -> str:
        """Process a chat message and return AI response."""
        # Save user message
        await mongodb.save_chat_message(user_id, session_id, "user", message)

        # Get chat history
        history = await mongodb.get_chat_history(session_id, limit=20)
        messages = [{"role": h["role"], "content": h["content"]} for h in history]

        # Gather context
        context = await self._gather_context(db)

        # Build enhanced prompt with context
        enhanced_message = f"""Current system context:
{context}

User message: {message}

Respond helpfully using the context above. If the user wants to perform an action, explain what you'll do and ask for confirmation if it's destructive."""

        # Get LLM response
        response = await llm.chat(
            messages=messages + [{"role": "user", "content": enhanced_message}],
            system_prompt=self.SYSTEM_PROMPT,
            temperature=0.5,
        )

        # Save assistant response
        await mongodb.save_chat_message(user_id, session_id, "assistant", response)

        return response

    async def _gather_context(self, db: AsyncSession) -> str:
        """Gather current system state for the AI."""
        context_parts = []

        # Sites overview
        result = await db.execute(select(Site))
        sites = result.scalars().all()
        if sites:
            context_parts.append(f"Managed Sites ({len(sites)}):")
            for site in sites:
                context_parts.append(f"  - {site.name} ({site.url}) - Status: {site.status.value}")

        # Active tickets
        result = await db.execute(
            select(Ticket).where(Ticket.status.in_([TicketStatus.OPEN, TicketStatus.IN_PROGRESS]))
        )
        tickets = result.scalars().all()
        if tickets:
            context_parts.append(f"\nActive Tickets ({len(tickets)}):")
            for ticket in tickets:
                context_parts.append(f"  - [{ticket.priority.value}] {ticket.title} ({ticket.status.value})")

        # Recent alerts
        alerts = await mongodb.get_active_alerts()
        if alerts:
            context_parts.append(f"\nActive Alerts ({len(alerts)}):")
            for alert in alerts[:5]:
                context_parts.append(f"  - [{alert['severity']}] {alert['message']}")

        return "\n".join(context_parts) if context_parts else "No sites or tickets currently managed."

    async def execute_command(self, user_id: int, command: str, params: dict, db: AsyncSession) -> dict:
        """Execute a management command via natural language."""
        command = command.lower().strip()

        if "check" in command and "site" in command:
            site_url = params.get("site_url")
            if site_url:
                result = await db.execute(select(Site).where(Site.url == site_url))
                site = result.scalar_one_or_none()
                if site:
                    log = await monitor.check_site(site, db)
                    return {"status": "success", "result": f"Site {site.name} is {site.status.value}", "response_time_ms": log.response_time_ms}

        elif "scan" in command and "security" in command:
            site_url = params.get("site_url")
            if site_url:
                result = await db.execute(select(Site).where(Site.url == site_url))
                site = result.scalar_one_or_none()
                if site:
                    from app.services.security_scanner import security_scanner
                    scan = await security_scanner.run_full_scan(site, db)
                    return {"status": "success", "score": scan.score, "findings_count": len(scan.findings)}

        elif "list" in command and "dns" in command:
            records = await cloudflare.list_dns_records()
            return {"status": "success", "records": records.get("result", [])}

        elif "purge" in command and "cache" in command:
            result = await cloudflare.purge_all_cache()
            return {"status": "success", "message": "Cache purged"}

        return {"status": "unknown_command", "message": f"Command not recognized: {command}"}


ai_assistant = AIAssistant()
