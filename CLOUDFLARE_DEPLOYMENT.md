UNIVERSAL NRG-CO HEADER BLOCK
Use this exact banner at the top of source files. License/covenant terms still apply.

################################################################
#                                                              #
#                ⚡  N R G - C O  ⚡                          #
#                                                              #
#    CRITICAL ASSET — CLOSED SOURCE / CONFIDENTIAL              #
#    PROPRIETARY / UNDER DEVELOPMENT / SECRET                   #
#                                                              #
################################################################
# Cloudflare Deployment Guide - The Dirt Place

## Your Cloudflare Credentials
- **Zone ID**: `ba77356fe63cfb5c30948b7cd8a946a4`
- **Account ID**: `c12ef03d29310fceb5fe71e1cae66cf7`
- **Domain**: `theboernedirtplace.com`

## Quick Setup (10 minutes)

### 1. Add Domain to Cloudflare
1. Go to https://dash.cloudflare.com
2. Click "Add a Site" → Enter `theboernedirtplace.com`
3. Select "Free" plan
4. Cloudflare scans your DNS → Click "Continue"

### 2. Update Nameservers
At your domain registrar (where you bought `theboernedirtplace.com`):
- Replace existing nameservers with Cloudflare's (they'll show you 2 nameservers)
- Example: `lola.ns.cloudflare.com`, `mark.ns.cloudflare.com`

**Wait**: DNS propagation takes 24-48 hours, but usually 10-30 mins.

### 3. SSL/TLS Settings (Critical!)
In Cloudflare Dashboard → SSL/TLS tab:
- **Encryption Mode**: Set to **Full (strict)** ← Best security
- **Always Use HTTPS**: ON
- **Auto Minify**: ON (HTML, CSS, JS)
- **Brotli**: ON

### 4. Page Rules (Important!)
Create these rules in **Rules → Page Rules**:

#### Rule 1: Force HTTPS
- URL: `http://theboernedirtplace.com/*`
- Setting: **Always Use HTTPS**

#### Rule 2: Cache Static Assets
- URL: `theboernedirtplace.com/static/*`
- Setting: **Cache Level** → Cache Everything
- Setting: **Edge Cache TTL** → 1 month

#### Rule 3: Protect Admin/API
- URL: `theboernedirtplace.com/api/*`
- Setting: **Security Level** → High
- Setting: **Cache Level** → Bypass

### 5. Firewall Rules (Security)
Go to **Security → WAF → Create rule**:

#### Rule: Block Bad Bots
```
(http.user_agent contains "scraper") OR 
(http.user_agent contains "spider") OR
(ip.src neg in {173.245.48.0/20 103.21.244.0/22 ...}) AND 
(http.request.uri.path contains "/api/")
```

Action: **Block**

#### Rule: Allow Only Cloudflare IPs to Origin (Optional - Advanced)
If you want to restrict origin server access:
```
(not ip.src in {173.245.48.0/20 ...})
AND (http.request.uri.path contains "/api/")
```
Action: **Block**

### 6. DNS Records
In **DNS → Records**, add:
```
Type: A
Name: @
IPv4: [YOUR_SERVER_IP]
Proxy: ON (orange cloud)

Type: A  
Name: www
IPv4: [YOUR_SERVER_IP]
Proxy: ON (orange cloud)

Type: A
Name: api
IPv4: [YOUR_SERVER_IP]
Proxy: ON (orange cloud)
```

### 7. Deploy Frontend
Build and upload to your server:
```bash
cd frontend
npm run build
# Upload 'build/' folder to your web server
```

### 8. Deploy Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8000
```

With Cloudflare proxy, visitors hit `https://theboernedirtplace.com/api/...` → Cloudflare → Your server

## API Endpoints After Deployment

### Test URLs (all go through Cloudflare HTTPS):
```bash
# Materials catalog (176 products)
curl https://theboernedirtplace.com/api/ecommerce/materials

# Delivery fee lookup
curl https://theboernedirtplace.com/api/ecommerce/delivery-fee/78006

# Contact form
curl -X POST https://theboernedirtplace.com/api/contact/submit \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@email.com","message":"Hello"}'
```

## Verify Setup

### Check HTTPS Works
```bash
curl -I https://theboernedirtplace.com
# Should see: HTTP/2 200 or HTTP/1.1 200 OK
# Check for: strict-transport-security header
```

### Check Robots.txt
```bash
curl https://theboernedirtplace.com/robots.txt
# Should show our robots.txt blocking /api/
```

### Check Sitemap
```bash
curl https://theboernedirtplace.com/sitemap.xml
# Should show HTTPS URLs
```

## Performance Benefits

✅ **Free SSL/TLS** (HTTPS enforced)
✅ **Global CDN** (static assets cached at 300+ locations)
✅ **DDoS Protection** (Cloudflare absorbs attacks)
✅ **Auto-minification** (smaller CSS/JS = faster page loads)
✅ **Brotli compression** (20-30% smaller than GZIP)

## Security Score Target

After setup, test at: https://www.ssllabs.com/ssltest/
- Target: **A+ rating**
- You should see: TLS 1.3, strong ciphers, HSTS enabled

## Next Steps

1. ✅ Add site to Cloudflare (5 min)
2. ✅ Update nameservers at registrar (5 min)
3. ✅ Configure SSL/TLS settings (2 min)
4. ✅ Deploy frontend build to server
5. ✅ Start backend with `uvicorn`
6. ✅ Test: `curl https://theboernedirtplace.com/api/ecommerce/materials`

**Total time: ~15 minutes to full HTTPS + CDN + Security**

## Troubleshooting

**"Site not proxiing"** → Make sure orange cloud is ON in DNS records
**"SSL handshake failed"** → Set SSL mode to "Full (strict)"  
**"API returns 403"** → Check firewall rules, whitelist your IP for testing
**"Origin server offline"** → Verify backend is running on port 8000

Ready to deploy? I can help with the next step!
