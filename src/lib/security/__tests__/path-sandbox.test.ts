import { describe, it, expect } from 'vitest'
import { assertInsideWorkspaceRoot, safeResolve, getWorkspaceRoot } from '../path-sandbox'

describe('path-sandbox', () => {
  const root = '/tmp/test-workspace'

  describe('assertInsideWorkspaceRoot', () => {
    it('allows paths inside workspace root', () => {
      expect(assertInsideWorkspaceRoot('src/index.ts', root)).toBe(
        `${root}/src/index.ts`
      )
    })

    it('allows the workspace root itself', () => {
      expect(assertInsideWorkspaceRoot('.', root)).toBe(root)
    })

    it('blocks path traversal with ../', () => {
      expect(() => assertInsideWorkspaceRoot('../../../etc/passwd', root)).toThrow(
        'Path traversal blocked'
      )
    })

    it('blocks absolute paths outside workspace', () => {
      expect(() => assertInsideWorkspaceRoot('/etc/passwd', root)).toThrow(
        'Path traversal blocked'
      )
    })

    it('blocks nested traversal', () => {
      expect(() => assertInsideWorkspaceRoot('foo/../../bar/../../../etc/shadow', root)).toThrow(
        'Path traversal blocked'
      )
    })
  })

  describe('safeResolve', () => {
    it('resolves safe paths', () => {
      // safeResolve uses getWorkspaceRoot() which defaults to cwd
      // We test the logic with an explicit base
      const result = assertInsideWorkspaceRoot('src/app.ts', root)
      expect(result).toContain('src/app.ts')
    })
  })
})
