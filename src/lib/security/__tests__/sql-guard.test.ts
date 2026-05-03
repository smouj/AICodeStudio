import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { guardSql, isDbWriteEnabled, getDbRowLimit } from '../sql-guard'

describe('sql-guard', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('guardSql (read-only mode)', () => {
    beforeEach(() => {
      delete process.env.AICODE_DB_WRITE_ENABLED
    })

    it('allows SELECT statements', () => {
      const result = guardSql('SELECT * FROM users')
      expect(result.ok).toBe(true)
      if (result.ok) expect(result.type).toBe('read')
    })

    it('allows WITH (CTE) statements', () => {
      const result = guardSql('WITH cte AS (SELECT 1) SELECT * FROM cte')
      expect(result.ok).toBe(true)
      if (result.ok) expect(result.type).toBe('read')
    })

    it('allows PRAGMA statements', () => {
      const result = guardSql('PRAGMA table_info(users)')
      expect(result.ok).toBe(true)
      if (result.ok) expect(result.type).toBe('read')
    })

    it('allows EXPLAIN statements', () => {
      const result = guardSql('EXPLAIN SELECT 1')
      expect(result.ok).toBe(true)
    })

    it('blocks DROP statements', () => {
      const result = guardSql('DROP TABLE users')
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.reason).toContain('DROP')
    })

    it('blocks DELETE statements', () => {
      const result = guardSql('DELETE FROM users')
      expect(result.ok).toBe(false)
    })

    it('blocks UPDATE statements', () => {
      const result = guardSql("UPDATE users SET name='hacked'")
      expect(result.ok).toBe(false)
    })

    it('blocks INSERT statements', () => {
      const result = guardSql("INSERT INTO users VALUES (1, 'hacked')")
      expect(result.ok).toBe(false)
    })

    it('blocks ALTER statements', () => {
      const result = guardSql('ALTER TABLE users ADD COLUMN x TEXT')
      expect(result.ok).toBe(false)
    })

    it('blocks ATTACH statements', () => {
      const result = guardSql("ATTACH DATABASE '/etc/passwd' AS pwn")
      expect(result.ok).toBe(false)
    })

    it('blocks VACUUM statements', () => {
      const result = guardSql('VACUUM')
      expect(result.ok).toBe(false)
    })

    it('blocks unknown statements', () => {
      const result = guardSql('RANDOM COMMAND')
      expect(result.ok).toBe(false)
    })

    it('handles case-insensitive statements', () => {
      const result = guardSql('select * from users')
      expect(result.ok).toBe(true)
    })
  })

  describe('guardSql (write mode)', () => {
    beforeEach(() => {
      process.env.AICODE_DB_WRITE_ENABLED = 'true'
    })

    it('allows DROP in write mode', () => {
      const result = guardSql('DROP TABLE users')
      expect(result.ok).toBe(true)
      if (result.ok) expect(result.type).toBe('write')
    })

    it('allows INSERT in write mode', () => {
      const result = guardSql("INSERT INTO users VALUES (1, 'test')")
      expect(result.ok).toBe(true)
    })
  })

  describe('isDbWriteEnabled', () => {
    it('returns false by default', () => {
      delete process.env.AICODE_DB_WRITE_ENABLED
      expect(isDbWriteEnabled()).toBe(false)
    })

    it('returns true when set', () => {
      process.env.AICODE_DB_WRITE_ENABLED = 'true'
      expect(isDbWriteEnabled()).toBe(true)
    })
  })

  describe('getDbRowLimit', () => {
    it('defaults to 1000', () => {
      delete process.env.AICODE_DB_ROW_LIMIT
      expect(getDbRowLimit()).toBe(1000)
    })

    it('respects env variable', () => {
      process.env.AICODE_DB_ROW_LIMIT = '500'
      expect(getDbRowLimit()).toBe(500)
    })
  })
})
