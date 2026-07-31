# Cloudflare API Configuration Guide

## Your Zone Information
- **Zone ID**: `ba77356fe63cfb5c30948b7cd8a946a4`
- **Account ID**: `c12ef03d29310fceb5fe71e1cae66cf7`
- **Domain**: `theboernedirtplace.com`

## Get Your API Credentials

### 1. Get API Key
1. Go to: https://dash.cloudflare.com/profile/api-tokens
2. Click **"Create Token"** or use **"Global API Key"** (simpler for now)
3. If using Global API Key: Click **"View"** next to "Global API Key"
4. You'll also need your Cloudflare account email

### 2. Test API Access
```bash
# Replace with your actual values:
EMAIL="your-email@domain.com"
API_KEY="your_global_api_key_here"

# Test zone details
curl -s -X GET "https://api.cloudflare.com/client/v4/zones/ba77356fe63cfb5c30948b7cd8a946a4" \
  -H "X-Auth-Email: $EMAIL" \
  -H "X-Auth-Key: $API_KEY" \
  -H "Content-Type: application/json"
```

## Useful API Endpoints for Your Zone

### Get Zone Settings
```bash
# Get all zone settings
curl -s -X GET "https://api.cloudflare.com/client/v4/zones/ba77356fe63cfb5c30948b7cd8a946a4/settings" \
  -H "X-Auth-Email: $EMAIL" \
  -H "X-Auth-Key: $API_KEY" | python3 -m json.tool
```

### Check Browser Integrity Check
```bash
# Browser Integrity Check (security)
curl -s -X GET "https://api.cloudflare.com/client/v4/zones/ba77356fe63cfb5c30948b7cd8a946a4/settings/browser_check" \
  -H "X-Auth-Email: $EMAIL" \
  -H "X-Auth-Key: $API_KEY" | python3 -m json.tool
```

**Expected response:**
```json
{
  "success": true,
  "result": {
    "id": "browser_check",
    "value": "on",  // Should be "on"
    "modified_on": "2026-05-03T..."
  }
}
```

### Check Email Obfuscation
```bash
# Email Obfuscation (protects email from scrapers)
curl -s -X GET "https://api.cloudflare.com/client/v4/zones/ba77356fe63cfb5c30948b7cd8a946a4/settings/email_obfuscation" \
  -H "X-Auth-Email: $EMAIL" \
  -H "X-Auth-Key: $API_KEY" | python3 -m json.tool
```

### Enable Security Settings (if off)
```bash
# Turn ON Browser Integrity Check
curl -s -X PATCH "https://api.cloudflare.com/client/v4/zones/ba77356fe63cfb5c30948b7cd8a946a4/settings/browser_check" \
  -H "X-Auth-Email: $EMAIL" \
  -H "X-Auth-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"value": "on"}'

# Turn ON Email Obfuscation
curl -s -X PATCH "https://api.cloudflare.com/client/v4/zones/ba77356fe63cfb5c30948b7cd8a946a4/settings/email_obfuscation" \
  -H "X-Auth-Email: $EMAIL" \
  -H "X-Auth-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"value": "on"}'

# Turn ON SSL/TLS Recommender
curl -s -X PATCH "https://api.cloudflare.com/client/v4/zones/ba77356fe63cfb5c30948b7cd8a946a4/settings/ssl_recommender" \
  -H "X-Auth-Email: $EMAIL" \
  -H "X-Auth-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"value": "on"}'
```

### Check SSL/TLS Status
```bash
# Verify SSL mode (should be "full" or "strict")
curl -s -X GET "https://api.cloudflare.com/client/v4/zones/ba77356fe63cfb5c30948b7cd8a946a4/settings/ssl" \
  -H "X-Auth-Email: $EMAIL" \
  -H "X-Auth-Key: $API_KEY" | python3 -m json.tool
```

**Expected:** `"value": "full"` or `"strict"`

## Quick Security Checklist via API

### Enable All Security Features:
```bash
#!/bin/bash
# Save as: setup-cloudflare-security.sh
ZONE="ba77356fe63cfb5c30948b7cd8a946a4"
EMAIL="your-email@domain.com"
KEY="your_api_key"

# Security settings to enable
SETTINGS=(
  "browser_check"
  "email_obfuscation"
  "server_side_exclude"
  "hotlink_protection"
)

echo "Enabling security settings..."
for setting in "${SETTINGS[@]}"; do
  echo "Setting: $setting"
  curl -s -X PATCH "https://api.cloudflare.com/client/v4/zones/$ZONE/settings/$setting" \
    -H "X-Auth-Email: $EMAIL" \
    -H "X-Auth-Key: $KEY" \
    -H "Content-Type: application/json" \
    -d '{"value": "on"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['success'] and '✓ ON' or '✗ Failed')"
done

echo ""
echo "Checking SSL/TLS mode..."
curl -s -X GET "https://api.cloudflare.com/client/v4/zones/$ZONE/settings/ssl" \
  -H "X-Auth-Email: $EMAIL" \
  -H "X-Auth-Key: $KEY" | python3 -c "import sys,json; d=json.load(sys.stdin); print('SSL Mode:', d['result']['value'])"
```

## Pagination Note

The API endpoint you mentioned uses a different Zone ID: `cc527c543a89a9acd630e1946ee338fa`

**Your actual Zone ID** (from your dashboard): `ba77356fe63cfb5c30948b7cd8a946a4`

Make sure to use the correct one!

## Recommended Dashboard Settings (Easier than API)

Since you're just setting up, use the **Cloudflare Dashboard** (easier):

### SSL/TLS Tab:
- **Encryption Mode**: Full (strict) ✅
- **Always Use HTTPS**: ON ✅
- **Auto Minify**: ON (HTML, CSS, JS) ✅
- **Brotli**: ON ✅

### Security Tab:
- **Browser Integrity Check**: ON ✅
- **Email Obfuscation**: ON ✅
- **Server Side Exclude**: ON ✅

### Speed Tab:
- **Auto Minify**: ON ✅
- **Brotli**: ON ✅

## Next Steps

1. **Get your API credentials**: https://dash.cloudflare.com/profile/api-tokens
2. **Test API**: Run the curl commands above (with your actual email/key)
3. **Or just use Dashboard**: https://dash.cloudflare.com → Select your site
4. **Verify SSL**: Wait for DNS, then test: `curl -I https://theboernedirtplace.com`

Want me to help with anything else?
