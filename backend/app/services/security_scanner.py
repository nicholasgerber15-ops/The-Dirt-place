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
import ssl
import socket
from datetime import datetime
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.site import Site
from app.models.security import SecurityScan, SecurityFinding, ScanType, ScanSeverity
from app.services.llm import llm
from app.services.mongodb import mongodb


class SecurityScanner:
    """Security scanning for SSL, HTTP headers, vulnerabilities, and WordPress-specific checks."""

    async def scan_ssl(self, site: Site, db: AsyncSession) -> dict:
        """Check SSL certificate status."""
        findings = []
        try:
            from urllib.parse import urlparse
            hostname = urlparse(site.url).hostname
            port = 443

            context = ssl.create_default_context()
            with socket.create_connection((hostname, port), timeout=10) as sock:
                with context.wrap_socket(sock, server_hostname=hostname) as ssock:
                    cert = ssock.getpeercert()
                    not_after = datetime.strptime(cert["notAfter"], "%b %d %H:%M:%S %Y %Z")
                    days_remaining = (not_after - datetime.utcnow()).days
                    site.ssl_expiry = not_after

                    if days_remaining < 0:
                        findings.append({"severity": "critical", "title": "SSL Certificate Expired", "description": f"Certificate expired {abs(days_remaining)} days ago"})
                    elif days_remaining < 14:
                        findings.append({"severity": "high", "title": "SSL Certificate Expiring Soon", "description": f"Certificate expires in {days_remaining} days"})
                    elif days_remaining < 30:
                        findings.append({"severity": "medium", "title": "SSL Certificate Expiring", "description": f"Certificate expires in {days_remaining} days"})
                    else:
                        findings.append({"severity": "info", "title": "SSL Certificate Valid", "description": f"Certificate valid for {days_remaining} more days"})

                    # Check TLS version
                    tls_version = ssock.version()
                    if tls_version in ("TLSv1", "TLSv1.1"):
                        findings.append({"severity": "high", "title": "Outdated TLS Version", "description": f"Server uses {tls_version}, should use TLSv1.2+"})

        except Exception as e:
            findings.append({"severity": "high", "title": "SSL Check Failed", "description": str(e)})

        return {"findings": findings, "scan_type": "ssl"}

    async def scan_headers(self, site: Site, db: AsyncSession) -> dict:
        """Check HTTP security headers."""
        findings = []
        try:
            async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
                response = await client.get(site.url)
                headers = response.headers

                security_headers = {
                    "strict-transport-security": ("HSTS", "high"),
                    "x-content-type-options": ("X-Content-Type-Options", "medium"),
                    "x-frame-options": ("X-Frame-Options", "medium"),
                    "x-xss-protection": ("X-XSS-Protection", "medium"),
                    "content-security-policy": ("Content-Security-Policy", "high"),
                    "permissions-policy": ("Permissions-Policy", "medium"),
                    "referrer-policy": ("Referrer-Policy", "low"),
                }

                for header, (name, severity) in security_headers.items():
                    if header not in [h.lower() for h in headers]:
                        findings.append({"severity": severity, "title": f"Missing {name}", "description": f"Header {name} is not set"})
                    else:
                        findings.append({"severity": "info", "title": f"{name} Present", "description": f"Header is properly configured"})

                # Check for information leakage
                if "server" in headers:
                    findings.append({"severity": "low", "title": "Server Header Exposed", "description": f"Server header reveals: {headers['server']}"})
                if "x-powered-by" in headers:
                    findings.append({"severity": "low", "title": "X-Powered-By Exposed", "description": f"Technology revealed: {headers['x-powered-by']}"})

        except Exception as e:
            findings.append({"severity": "high", "title": "Header Scan Failed", "description": str(e)})

        return {"findings": findings, "scan_type": "headers"}

    async def scan_wordpress(self, site: Site, db: AsyncSession) -> dict:
        """WordPress-specific security scan."""
        findings = []
        try:
            from app.services.wordpress import get_wordpress_manager
            wp = get_wordpress_manager(site.url)
            result = await wp.security_scan()
            for f in result.get("findings", []):
                findings.append(f)

            # Check for known vulnerable plugins
            plugins = await wp.detect_plugins()
            known_vulnerable = ["easy-wp-smtp", "contact-form-7", "akismet", "wordfence", "elementor"]
            for plugin in plugins:
                if plugin in known_vulnerable:
                    findings.append({"severity": "medium", "title": f"Plugin: {plugin}", "description": f"Plugin '{plugin}' may have known vulnerabilities - check for updates"})

        except Exception as e:
            findings.append({"severity": "low", "title": "WordPress Scan Error", "description": str(e)})

        return {"findings": findings, "scan_type": "wordpress"}

    async def scan_performance(self, site: Site, db: AsyncSession) -> dict:
        """Basic performance analysis."""
        findings = []
        try:
            async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
                start = datetime.utcnow()
                response = await client.get(site.url)
                elapsed = (datetime.utcnow() - start).total_seconds() * 1000

                if elapsed > 3000:
                    findings.append({"severity": "high", "title": "Slow Response", "description": f"Site responded in {elapsed:.0f}ms"})
                elif elapsed > 1500:
                    findings.append({"severity": "medium", "title": "Moderate Response Time", "description": f"Site responded in {elapsed:.0f}ms"})
                else:
                    findings.append({"severity": "info", "title": "Good Response Time", "description": f"Site responded in {elapsed:.0f}ms"})

                # Check page size
                size_kb = len(response.content) / 1024
                if size_kb > 3000:
                    findings.append({"severity": "medium", "title": "Large Page Size", "description": f"Page is {size_kb:.0f}KB - consider optimization"})

                # Check compression
                if "content-encoding" not in response.headers:
                    findings.append({"severity": "low", "title": "No Compression", "description": "Response is not compressed (gzip/brotli)"})

        except Exception as e:
            findings.append({"severity": "high", "title": "Performance Scan Failed", "description": str(e)})

        return {"findings": findings, "scan_type": "performance"}

    async def run_full_scan(self, site: Site, db: AsyncSession) -> SecurityScan:
        """Run all security scans and create a comprehensive report."""
        scan = SecurityScan(site_id=site.id, scan_type=ScanType.FULL, status="running", started_at=datetime.utcnow())
        db.add(scan)
        await db.commit()
        await db.refresh(scan)

        all_findings = []

        # Run all scans
        scan_modules = [
            ("ssl", self.scan_ssl),
            ("headers", self.scan_headers),
            ("wordpress", self.scan_wordpress),
            ("performance", self.scan_performance),
        ]

        for name, scan_func in scan_modules:
            try:
                result = await scan_func(site, db)
                for f in result["findings"]:
                    finding = SecurityFinding(
                        scan_id=scan.id,
                        severity=ScanSeverity(f["severity"]),
                        title=f["title"],
                        description=f.get("description", ""),
                    )
                    db.add(finding)
                    all_findings.append(f)
            except Exception as e:
                all_findings.append({"severity": "medium", "title": f"{name} scan error", "description": str(e)})

        # Use LLM to analyze findings
        analysis = await llm.security_analysis({"site": site.name, "url": site.url, "findings": all_findings})

        # Calculate score
        severity_weights = {"critical": 25, "high": 15, "medium": 8, "low": 3, "info": 0}
        total_deductions = sum(severity_weights.get(f.get("severity", "info"), 0) for f in all_findings)
        score = max(0, 100 - total_deductions)

        scan.status = "completed"
        scan.completed_at = datetime.utcnow()
        scan.score = score
        scan.summary = analysis.get("summary", "")
        scan.findings = all_findings
        await db.commit()

        # Store in MongoDB
        await mongodb.save_scan_result(site.id, "full", {"score": score, "findings": all_findings, "analysis": analysis})

        return scan


security_scanner = SecurityScanner()
