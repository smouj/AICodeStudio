import { NextRequest, NextResponse } from 'next/server'

type LocalDevCapability = 'docker' | 'database' | 'terminal' | 'git' | 'lsp' | 'ai-provider'

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '[::1]', '::1'])
const DESTRUCTIVE_SQL_PATTERN = /\b(INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE|CREATE|REPLACE|VACUUM|ATTACH|DETACH|REINDEX)\b/i
const SQL_COMMENT_PATTERN = /(--.*?$|\/\*[\s\S]*?\*\/)/gm

function normalizeHost(hostHeader: string | null): string {
  if (!hostHeader) return ''
  const host = hostHeader.trim().toLowerCase()
  if (host.startsWith('[')) {
    const closingBracket = host.indexOf(']')
    return closingBracket >= 0 ? host.slice(0, closingBracket + 1) : host
  }
  return host.split(':')[0] ?? ''
}

function getProvidedToken(req: NextRequest): string | null {
  const headerToken = req.headers.get('x-aicodestudio-local-token')
  if (headerToken) return headerToken

  const authorization = req.headers.get('authorization')
  if (!authorization) return null

  const match = authorization.match(/^Bearer\s+(.+)$/i)
  return match?.[1] ?? null
}

export function isLocalRequest(req: NextRequest): boolean {
  const host = normalizeHost(req.headers.get('host'))
  return LOCAL_HOSTS.has(host)
}

export function requireLocalDevTools(req: NextRequest, capability: LocalDevCapability): NextResponse | null {
  const enabled = process.env.AICODESTUDIO_LOCAL_TOOLS_ENABLED === 'true'
  const allowRemote = process.env.AICODESTUDIO_ALLOW_REMOTE_LOCAL_TOOLS === 'true'
  const expectedToken = process.env.AICODESTUDIO_LOCAL_TOOLS_TOKEN

  if (!enabled) {
    return NextResponse.json(
      {
        error: `${capability} tools are disabled by default`,
        code: 'LOCAL_DEV_TOOLS_DISABLED',
        hint: 'Set AICODESTUDIO_LOCAL_TOOLS_ENABLED=true only in a trusted local environment.',
      },
      { status: 403 }
    )
  }

  if (!allowRemote && !isLocalRequest(req)) {
    return NextResponse.json(
      {
        error: `${capability} tools are local-only`,
        code: 'LOCAL_DEV_TOOLS_LOCALHOST_ONLY',
        hint: 'Use localhost or explicitly set AICODESTUDIO_ALLOW_REMOTE_LOCAL_TOOLS=true behind private auth.',
      },
      { status: 403 }
    )
  }

  if (expectedToken) {
    const providedToken = getProvidedToken(req)
    if (providedToken !== expectedToken) {
      return NextResponse.json(
        {
          error: `${capability} tools require a valid local token`,
          code: 'LOCAL_DEV_TOOLS_TOKEN_REQUIRED',
        },
        { status: 401 }
      )
    }
  }

  return null
}

export function isReadOnlySql(sql: string): boolean {
  const withoutComments = sql.replace(SQL_COMMENT_PATTERN, ' ').trim()
  const normalized = withoutComments.replace(/\s+/g, ' ').toUpperCase()

  if (!normalized) return false
  if (DESTRUCTIVE_SQL_PATTERN.test(normalized)) return false

  return (
    normalized.startsWith('SELECT ') ||
    normalized === 'SELECT' ||
    normalized.startsWith('WITH ') ||
    normalized.startsWith('PRAGMA ') ||
    normalized.startsWith('EXPLAIN ')
  )
}

export function capRows<T>(result: T, maxRows = 500): { data: T; truncated: boolean; rowLimit: number } {
  if (!Array.isArray(result)) {
    return { data: result, truncated: false, rowLimit: maxRows }
  }

  if (result.length <= maxRows) {
    return { data: result as T, truncated: false, rowLimit: maxRows }
  }

  return {
    data: result.slice(0, maxRows) as T,
    truncated: true,
    rowLimit: maxRows,
  }
}
