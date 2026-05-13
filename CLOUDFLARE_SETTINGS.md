# Quick Cloudflare Settings Reference

## Your Zone ID: `cc527c543a89a9acd630e1946ee338fa`

## Key Settings to Check/Enable

### 1. Replaced Insecure JS (`repace_insecure_js`)
**Purpose:** Automatically upgrade HTTP JS resources to HTTPS
**API:**
```bash
export CLOUDFLARE_EMAIL="your-email@domain.com"
export CLOUDFLARE_KEY="your_global_api_key"

bash fetch-cloudflare-setting.sh repace_insecure_js
```

**Expected:** `"value": "on"`

---

### 2. Browser Integrity Check (`browser_check`)
**Purpose:** Blocks visitors with bad browser signatures
```bash
bash fetch-cloudflare-setting.sh browser_check
```

---

### 3. Email Obfuscation (`email_obfuscation`)
**Purpose:** Protects email from scrapers
```bash
bash fetch-cloudflare-setting.sh email_obfuscation
```

---

### 4. SSL/TLS Mode (`ssl`)
**Purpose:** Encrypt traffic (set to "full" or "strict")
```bash
bash fetch-cloudflare-setting.sh ssl
```

**Target:** `"value": "full"` or `"strict"`

---

### 5. Always Use HTTPS (`always_use_https`)
**Purpose:** Redirect HTTP → HTTPS
```bash
bash fetch-cloudflare-setting.sh always_use_https
```

---

### 6. Auto Minify (`minify`)
**Purpose:** Compress HTML, CSS, JS
```bash
bash fetch-cloudflare-setting.sh minify
```

---

### 7. Brotli Compression (`brotli`)
**Purpose:** Better compression than GZip
```bash
bash fetch-cloudflare-setting.sh brotli
```

---

## Quick Security Setup (All at Once)

```bash
#!/bin/bash
# Save as: enable-all-security.sh
ZONE="cc527c543a89a9acd630e1946ee338fa"
EMAIL="$CLOUDFLARE_EMAIL"
KEY="$CLOUDFLARE_KEY"

SETTINGS=(
  "repace_insecure_js"
  "browser_check"
  "email_obfuscation"
  "server_side_exclude"
  "always_use_https"
)

echo "Enabling security settings for zone: $ZONE"
for setting in "${SETTINGS[@]}"; do
  echo -n "  $setting: "
  curl -s -X PATCH "https://api.cloudflare.com/client/v4/zones/$ZONE/settings/$setting" \
    -H "X-Auth-Email: $EMAIL" \
    -H "X-Auth-Key: $KEY" \
    -H "Content-Type: application/json" \
    -d '{"value": "on"}' | python3 -c "import sys,json; print('✓ ON' if json.load(sys.stdin)['success'] else '✗ Failed')"
done
```

---

## Get API Credentials

1. Go to: https://dash.cloudflare.com/profile/api-tokens
2. Click **"View"** next to **"Global API Key"**
3. Copy your email and API key
4. Export them:
```bash
export CLOUDFLARE_EMAIL="your_email@theboernedirtplace.com"
export CLOUDFLARE_KEY="your_32_char_api_key_here"
```

---

## Recommended Dashboard Settings (Easier)

Go to https://dash.cloudflare.com → Select your site:

### SSL/TLS Tab:
- Encryption Mode: **Full (strict)** ✅
- Always Use HTTPS: **ON** ✅
- Auto Minify: **ON** (HTML, CSS, JS) ✅
- Brotli: **ON** ✅

### Speed Tab:
- Auto Minify: **ON** ✅
- Brotli: **ON** ✅

### Security Tab:
- Browser Integrity Check: **ON** ✅
- Email Obfuscation: **ON** ✅
- Server Side Exclude: **ON** ✅

---

## Test After Configuration

```bash
# Check if HTTPS is working
curl -I https://theboernedirtplace.com
# Should see: HTTP/2 200

# Test API through Cloudflare
curl https://theboernedirtplace.com/api/ecommerce/materials
# Should return 176 products

# SSL Test (target: A+)
# Visit: https://www.ssllabs.com/ssltest/analyze?d=theboernedirtplace.com
```

---

**Ready?** Set your API credentials and run:
```bash
bash fetch-cloudflare-setting.sh repace_insecure_js
```
