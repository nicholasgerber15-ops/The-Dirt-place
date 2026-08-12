#!/bin/bash

# Cloudflare API Quick Fetcher
# Get API credentials: https://dash.cloudflare.com/profile/api-tokens

export ZONE_ID="${ZONE_ID:-cc527c543a89a9acd630e1946ee338fa}"
export CLOUDFLARE_EMAIL="${CLOUDFLARE_EMAIL:-YOUR_EMAIL_HERE}"
export CLOUDFLARE_API_KEY="${CLOUDFLARE_API_KEY:-YOUR_API_KEY_HERE}"

# Check if credentials are set
if [ "$CLOUDFLARE_EMAIL" = "YOUR_EMAIL_HERE" ] || [ "$CLOUDFLARE_API_KEY" = "YOUR_API_KEY_HERE" ]; then
    echo "ERROR: Please set your Cloudflare credentials:"
    echo ""
    echo "  export CLOUDFLARE_EMAIL='your@email.com'"
    echo "  export CLOUDFLARE_API_KEY='your_global_api_key'"
    echo ""
    echo "Get your Global API Key at:"
    echo "  https://dash.cloudflare.com/profile/api-tokens"
    exit 1
fi

# Function to fetch a setting
fetch_setting() {
    local SETTING="$1"
    echo "=== Fetching: $SETTING ==="
    curl -s -X GET "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/settings/$SETTING" \
      -H "X-Auth-Email: $CLOUDFLARE_EMAIL" \
      -H "X-Auth-Key: $CLOUDFLARE_API_KEY" \
      -H "Content-Type: application/json" | python3 -m json.tool
    echo ""
}

# Function to patch (update) a setting
update_setting() {
    local SETTING="$1"
    local VALUE="${2:-on}"
    echo "=== Updating: $SETTING to '$VALUE' ==="
    curl -s -X PATCH "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/settings/$SETTING" \
      -H "X-Auth-Email: $CLOUDFLARE_EMAIL" \
      -H "X-Auth-Key: $CLOUDFLARE_API_KEY" \
      -H "Content-Type: application/json" \
      -d "{\"value\": \"$VALUE\"}" | python3 -m json.tool
    echo ""
}

# Main
echo "Cloudflare API Helper"
echo "Zone ID: $ZONE_ID"
echo "Email: $CLOUDFLARE_EMAIL"
echo ""

# Fetch common settings
fetch_setting "ssl"
fetch_setting "always_use_https"
fetch_setting "replace_insecure_js"
fetch_setting "browser_check"
fetch_setting "email_obfuscation"
fetch_setting "minify"
fetch_setting "brotli"

# Get SSL certificate packs (the endpoint you asked about)
echo "=== Fetching SSL Certificate Packs ==="
curl -s -X GET "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/ssl/certificate_packs" \
  -H "X-Auth-Email: $CLOUDFLARE_EMAIL" \
  -H "X-Auth-Key: $CLOUDFLARE_API_KEY" \
  -H "Content-Type: application/json" | python3 -m json.tool

echo ""
echo "=== SETTINGS COMPLETE ==="
echo ""
echo "To update a setting, run:"
echo "  update_setting 'setting_name' 'on'"
echo ""
echo "Example: update_setting 'replace_insecure_js' 'on'"
