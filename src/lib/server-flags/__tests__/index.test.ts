import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { getCapabilities } from '../index'

describe('server-flags', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('getCapabilities', () => {
    it('returns all capability keys', () => {
      const caps = getCapabilities()
      expect(caps).toHaveProperty('docker')
      expect(caps).toHaveProperty('terminal')
      expect(caps).toHaveProperty('lsp')
      expect(caps).toHaveProperty('git')
      expect(caps).toHaveProperty('database')
      expect(caps).toHaveProperty('ai')
      expect(caps).toHaveProperty('collaboration')
      expect(caps).toHaveProperty('localFS')
    })

    it('docker is disabled by default', () => {
      delete process.env.AICODE_ENABLE_DOCKER
      delete process.env.DOCKER_HOST
      const caps = getCapabilities()
      expect(caps.docker.enabled).toBe(false)
      expect(caps.docker.status).toBe('disabled')
    })

    it('terminal is simulated by default', () => {
      delete process.env.AICODE_ENABLE_TERMINAL
      const caps = getCapabilities()
      expect(caps.terminal.enabled).toBe(false)
      expect(caps.terminal.status).toBe('simulated')
    })

    it('lsp is simulated by default', () => {
      delete process.env.AICODE_ENABLE_LSP
      const caps = getCapabilities()
      expect(caps.lsp.enabled).toBe(false)
      expect(caps.lsp.status).toBe('simulated')
    })

    it('collaboration is simulated by default', () => {
      const caps = getCapabilities()
      expect(caps.collaboration.enabled).toBe(false)
      expect(caps.collaboration.status).toBe('simulated')
    })

    it('docker enables when both flag and host are set with unix socket', () => {
      process.env.AICODE_ENABLE_DOCKER = 'true'
      process.env.DOCKER_HOST = 'unix:///var/run/docker.sock'
      const caps = getCapabilities()
      expect(caps.docker.enabled).toBe(true)
      expect(caps.docker.status).toBe('enabled')
    })

    it('docker blocks unencrypted localhost TCP without allow-unsafe flag', () => {
      process.env.AICODE_ENABLE_DOCKER = 'true'
      process.env.DOCKER_HOST = 'http://localhost:2375'
      delete process.env.AICODE_DOCKER_ALLOW_UNSAFE
      const caps = getCapabilities()
      expect(caps.docker.enabled).toBe(false)
      expect(caps.docker.status).toBe('unavailable')
    })

    it('docker allows unencrypted localhost TCP with allow-unsafe flag', () => {
      process.env.AICODE_ENABLE_DOCKER = 'true'
      process.env.DOCKER_HOST = 'http://localhost:2375'
      process.env.AICODE_DOCKER_ALLOW_UNSAFE = 'true'
      const caps = getCapabilities()
      expect(caps.docker.enabled).toBe(true)
      expect(caps.docker.status).toBe('enabled')
    })

    it('docker blocks non-localhost unencrypted TCP even with allow-unsafe flag', () => {
      process.env.AICODE_ENABLE_DOCKER = 'true'
      process.env.DOCKER_HOST = 'http://192.168.1.100:2375'
      process.env.AICODE_DOCKER_ALLOW_UNSAFE = 'true'
      const caps = getCapabilities()
      expect(caps.docker.enabled).toBe(false)
      expect(caps.docker.status).toBe('unavailable')
    })

    it('docker remains disabled when only flag is set without host', () => {
      process.env.AICODE_ENABLE_DOCKER = 'true'
      delete process.env.DOCKER_HOST
      const caps = getCapabilities()
      expect(caps.docker.enabled).toBe(false)
    })
  })
})
