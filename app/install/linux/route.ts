import { config } from "@/lib/config";

export async function GET() {
  const script = `#!/bin/sh
set -eu
APP_SLUG="\${1:-luma-agent}"
STORE_URL="${config.PUBLIC_BASE_URL}"
case "$(uname -m)" in x86_64) ARCH=x64 ;; aarch64|arm64) ARCH=arm64 ;; *) echo "Architecture non prise en charge" >&2; exit 1 ;; esac
CURRENT_VERSION="0.0.0"
URL="$STORE_URL/api/v1/apps/$APP_SLUG/updates?current_version=$CURRENT_VERSION&platform=linux&arch=$ARCH&channel=stable"
command -v curl >/dev/null 2>&1 || { echo "curl est requis" >&2; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo "python3 est requis" >&2; exit 1; }
JSON=$(curl --fail --silent --show-error "$URL")
AVAILABLE=$(printf '%s' "$JSON" | python3 -c 'import json,sys; print(str(json.load(sys.stdin)["data"]["available"]).lower())')
[ "$AVAILABLE" = true ] || { echo "Aucune version Linux publiée pour $APP_SLUG"; exit 0; }
DOWNLOAD=$(printf '%s' "$JSON" | python3 -c 'import json,sys; print(json.load(sys.stdin)["data"]["artifact"]["url"])')
FILE_NAME=$(printf '%s' "$JSON" | python3 -c 'import json,sys; print(json.load(sys.stdin)["data"]["artifact"]["fileName"])')
SHA=$(printf '%s' "$JSON" | python3 -c 'import json,sys; print(json.load(sys.stdin)["data"]["artifact"]["sha256"])')
FILE=$(mktemp /tmp/luma-store.XXXXXX)
trap 'rm -f "$FILE"' EXIT
curl --fail --location --silent --show-error "$DOWNLOAD" -o "$FILE"
printf '%s  %s\n' "$SHA" "$FILE" | sha256sum --check --status || { echo "Échec de vérification SHA-256" >&2; exit 1; }
case "$FILE_NAME" in *.deb) dpkg -i "$FILE" ;; *.rpm) rpm -U "$FILE" ;; *) install -m 0755 "$FILE" "/usr/local/bin/$APP_SLUG" ;; esac
echo "$APP_SLUG installé et vérifié."
`;
  return new Response(script, { headers: { "Content-Type": "text/x-shellscript; charset=utf-8", "Cache-Control": "no-store", "Content-Disposition": "inline; filename=install-luma.sh" } });
}
