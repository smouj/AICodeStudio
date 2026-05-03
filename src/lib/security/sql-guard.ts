/**
 * SQL Guard
 *
 * Restricts which SQL statements are allowed based on server configuration.
 * By default, only read-only queries (SELECT, WITH, PRAGMA) are permitted.
 * Destructive statements require AICODE_DB_WRITE_ENABLED=true.
 *
 * SECURITY: Prevents accidental or malicious data destruction.
 */

const READ_ONLY_PREFIXES = ['SELECT', 'WITH', 'PRAGMA', 'EXPLAIN']
const BLOCKED_PREFIXES = [
  'DROP', 'DELETE', 'UPDATE', 'INSERT', 'ALTER', 'CREATE',
  'ATTACH', 'DETACH', 'VACUUM', 'REPLACE', 'TRUNCATE',
]

/** Normalise SQL for prefix checking. */
function normalise(sql: string): string {
  return sql.trim().toUpperCase()
}

/** True when AICODE_DB_WRITE_ENABLED is explicitly "true". */
export function isDbWriteEnabled(): boolean {
  return process.env.AICODE_DB_WRITE_ENABLED === 'true'
}

/** Maximum rows a SELECT may return. */
export function getDbRowLimit(): number {
  const v = parseInt(process.env.AICODE_DB_ROW_LIMIT || '1000', 10)
  return Number.isFinite(v) && v > 0 ? v : 1000
}

/** Query timeout in milliseconds. */
export function getDbTimeoutMs(): number {
  const v = parseInt(process.env.AICODE_DB_TIMEOUT_MS || '5000', 10)
  return Number.isFinite(v) && v > 0 ? v : 5000
}

export type SqlGuardResult =
  | { ok: true; type: 'read' | 'write' }
  | { ok: false; reason: string }

/**
 * Validate a SQL statement against the current policy.
 *
 * Returns `{ ok: true, type }` if the query is allowed,
 * or `{ ok: false, reason }` with an explanation if not.
 */
export function guardSql(rawSql: string): SqlGuardResult {
  const sql = normalise(rawSql)

  // Check for blocked statements first
  const blocked = BLOCKED_PREFIXES.find((p) => sql.startsWith(p))
  if (blocked) {
    if (isDbWriteEnabled()) {
      return { ok: true, type: 'write' }
    }
    return {
      ok: false,
      reason: `Statement "${blocked}" is not allowed in read-only mode. Set AICODE_DB_WRITE_ENABLED=true to enable writes.`,
    }
  }

  // Check for read-only statements
  const isRead = READ_ONLY_PREFIXES.some((p) => sql.startsWith(p))
  if (isRead) {
    return { ok: true, type: 'read' }
  }

  // Unknown statement type – deny by default
  return {
    ok: false,
    reason: 'Unrecognised SQL statement. Only SELECT, WITH, PRAGMA, and EXPLAIN are allowed in read-only mode.',
  }
}
