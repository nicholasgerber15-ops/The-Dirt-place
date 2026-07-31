# Cloudflare IP Configuration for The Dirt Place

## Cloudflare IP Ranges (fetched from API)
Updated: 2026-05-03

### IPv4 Ranges
```
173.245.48.0/20
103.21.244.0/22
103.22.200.0/22
103.31.4.0/22
141.101.64.0/18
108.162.192.0/18
190.93.240.0/20
188.114.96.0/20
197.234.240.0/22
198.41.128.0/17
162.158.0.0/15
104.16.0.0/13
104.24.0.0/14
172.64.0.0/13
131.0.72.0/22
```

### IPv6 Ranges
```
2400:cb00::/32
2606:4700::/32
2803:f800::/32
2405:b500::/32
2405:8100::/32
2a06:98c0::/29
2c0f:f248::/32
```

## Restore Original Visitor IP

### For Apache (.htaccess)
Add to `frontend/public/.htaccess`:
```apache
# Trust Cloudflare IPs
RemoteIPHeader CF-Connecting-IP
RemoteIPInternalProxy 173.245.48.0/20
RemoteIPInternalProxy 103.21.244.0/22
RemoteIPInternalProxy 103.22.200.0/22
RemoteIPInternalProxy 103.31.4.0/22
RemoteIPInternalProxy 141.101.64.0/18
RemoteIPInternalProxy 108.162.192.0/18
RemoteIPInternalProxy 190.93.240.0/20
RemoteIPInternalProxy 188.114.96.0/20
RemoteIPInternalProxy 197.234.240.0/22
RemoteIPInternalProxy 198.41.128.0/17
RemoteIPInternalProxy 162.158.0.0/15
RemoteIPInternalProxy 104.16.0.0/13
RemoteIPInternalProxy 104.24.0.0/14
RemoteIPInternalProxy 172.64.0.0/13
RemoteIPInternalProxy 131.0.72.0/22
```

### For Nginx
```nginx
# In nginx.conf http block
set_real_ip_from 173.245.48.0/20;
set_real_ip_from 103.21.244.0/22;
set_real_ip_from 103.22.200.0/22;
set_real_ip_from 103.31.4.0/22;
set_real_ip_from 141.101.64.0/18;
set_real_ip_from 108.162.192.0/18;
set_real_ip_from 190.93.240.0/20;
set_real_ip_from 188.114.96.0/20;
set_real_ip_from 197.234.240.0/22;
set_real_ip_from 198.41.128.0/17;
set_real_ip_from 162.158.0.0/15;
set_real_ip_from 104.16.0.0/13;
set_real_ip_from 104.24.0.0/14;
set_real_ip_from 172.64.0.0/13;
set_real_ip_from 131.0.72.0/22;
real_ip_header CF-Connecting-IP;
```

### For Backend (FastAPI/Python)
```python
# In backend/server.py or middleware
CLOUDFLARE_IP_RANGES = [
    "173.245.48.0/20",
    "103.21.244.0/22",
    # ... add all ranges
]

def is_cloudflare_ip(ip: str) -> bool:
    import ipaddress
    ip_addr = ipaddress.ip_address(ip)
    for range_str in CLOUDFLARE_IP_RANGES:
        if ip_addr in ipaddress.ip_network(range_str):
            return True
    return False

# Use CF-Connecting-IP header instead of remote address
def get_client_ip(request: Request):
    return request.headers.get('CF-Connecting-IP', request.client.host)
```

## Automated Updates

Cloudflare IPs can change. Auto-update script:
```bash
#!/bin/bash
# save as update-cloudflare-ips.sh
curl -s https://api.cloudflare.com/client/v4/ips | \
python3 -c "import sys,json; data=json.load(sys.stdin); print('\n'.join(data['result']['ipv4_cidrs']))" > cloudflare-ips.txt
echo "Updated cloudflare-ips.txt"
```

## Security Benefits

✅ Restore real visitor IPs (not Cloudflare proxy IPs)
✅ Block direct access to origin server (only allow Cloudflare IPs)
✅ Accurate geolocation & logging
✅ Rate limiting works correctly

## Next Steps

1. **Deploy behind Cloudflare** (free tier works)
2. **Enable "Full (strict)" SSL/TLS** in Cloudflare dashboard
3. **Add firewall rule**: Block all traffic NOT from Cloudflare IPs
4. **Update .htaccess** with Cloudflare IPs above

Your HTTPS migration + Cloudflare = A+ security rating!
