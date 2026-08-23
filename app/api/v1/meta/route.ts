import { NextResponse } from "next/server";
import { config } from "@/lib/config";

export async function GET() {
  return NextResponse.json({
    name: "LUMA Store", apiVersion: "v1", updateEndpoint: `${config.PUBLIC_BASE_URL}/api/v1/apps/{slug}/updates`,
    downloadEndpoint: `${config.PUBLIC_BASE_URL}/api/v1/apps/{slug}/download`,
    packagesEndpoint: `${config.PUBLIC_BASE_URL}/api/v1/apps/{slug}/packages`,
    supportedPlatforms: ["windows", "macos", "linux", "android"], integrity: "sha256"
  }, { headers: { "Cache-Control": "public, max-age=3600" } });
}
