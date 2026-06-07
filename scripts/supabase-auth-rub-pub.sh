#!/usr/bin/env bash
# Set Supabase Auth Site URL + redirect allow list for rub.pub (Image Portal).
# Requires a Personal Access Token: https://supabase.com/dashboard/account/tokens
#
# Usage:
#   export SUPABASE_ACCESS_TOKEN="sbp_..."
#   bash "/Users/oraclevision/Developer/applications/RQ/image-portal/scripts/supabase-auth-rub-pub.sh"
set -euo pipefail

PROJECT_REF="${SUPABASE_PROJECT_REF:-duydupyyembdttmjvsxm}"
SITE_URL="${SITE_URL:-https://rub.pub}"

if [[ -z "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
  echo "Missing SUPABASE_ACCESS_TOKEN."
  echo "Create one at: https://supabase.com/dashboard/account/tokens"
  exit 1
fi

API="https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth"
AUTH_HEADER="Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}"

echo "==> Current auth config"
CURRENT=$(curl -sS -H "$AUTH_HEADER" -H "Accept: application/json" "$API")
export CURRENT_JSON="$CURRENT"
python3 <<'PY' || echo "$CURRENT"
import json, os
d = json.loads(os.environ["CURRENT_JSON"])
print("site_url:", d.get("site_url"))
print("uri_allow_list:")
print(d.get("uri_allow_list") or "(empty)")
PY

export REQUIRED_URLS="${SITE_URL}/auth/callback|http://localhost:3004/auth/callback|http://127.0.0.1:3004/auth/callback|https://image-portal-liard.vercel.app/auth/callback"

MERGED=$(python3 <<'PY'
import json, os
current = json.loads(os.environ["CURRENT_JSON"])
existing = (current.get("uri_allow_list") or "").strip()
lines = [ln.strip() for ln in existing.split("\n") if ln.strip()]
for u in os.environ["REQUIRED_URLS"].split("|"):
    u = u.strip()
    if u and u not in lines:
        lines.append(u)
print("\n".join(lines))
PY
)

BODY=$(SITE_URL="$SITE_URL" MERGED="$MERGED" python3 <<'PY'
import json, os
print(json.dumps({"site_url": os.environ["SITE_URL"], "uri_allow_list": os.environ["MERGED"]}))
PY
)

echo ""
echo "==> PATCH site_url=$SITE_URL and merged redirect URLs"
RESP=$(curl -sS -X PATCH -H "$AUTH_HEADER" -H "Content-Type: application/json" -d "$BODY" "$API")
export RESP_JSON="$RESP"
python3 <<'PY' || echo "$RESP"
import json, os
d = json.loads(os.environ["RESP_JSON"])
print("site_url:", d.get("site_url"))
print("uri_allow_list:")
print(d.get("uri_allow_list") or "")
PY

echo ""
echo "Done. Test: sign up on $SITE_URL and confirm the email link lands on /auth/callback"
