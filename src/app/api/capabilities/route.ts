import { NextResponse } from 'next/server'
import { getCapabilities } from '@/lib/server-flags'
import { APP_VERSION } from '@/lib/version'

/**
 * GET /api/capabilities
 * Returns the current server-side capability status and app version.
 * This endpoint is public – it does NOT expose secrets.
 */
export async function GET() {
  const capabilities = getCapabilities()

  return NextResponse.json({
    success: true,
    version: APP_VERSION,
    mode: process.env.AICODE_ENABLE_DOCKER === 'true' || process.env.AICODE_ENABLE_TERMINAL === 'true'
      ? 'server'
      : 'static-demo',
    capabilities,
  })
}
