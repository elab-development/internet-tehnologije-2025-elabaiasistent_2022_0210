import { describe, it, expect } from 'vitest'
import {
  sanitizeHTML,
  sanitizeText,
  sanitizeEmail,
  sanitizeURL,
  sanitizeChatMessage,
  containsSQLInjection,
  containsXSS,
  validateUserInput,
} from '@/lib/sanitize'

describe('sanitize.ts - Security Functions', () => {
  describe('sanitizeHTML', () => {
    it('should remove all HTML tags', () => {
      const input = '<script>alert("xss")</script>Hello'
      const result = sanitizeHTML(input)
      expect(result).not.toContain('<script>')
      expect(result).not.toContain('</script>')
    })

    it('should remove dangerous tags', () => {
      const input = '<img src="x" onerror="alert(1)">'
      const result = sanitizeHTML(input)
      expect(result).not.toContain('<img')
      expect(result).not.toContain('onerror')
    })

    it('should handle empty string', () => {
      expect(sanitizeHTML('')).toBe('')
    })
  })

  describe('sanitizeText', () => {
    it('should remove HTML tags', () => {
      const input = '<div>Hello <b>World</b></div>'
      const result = sanitizeText(input)
      expect(result).toBe('Hello World')
    })

    it('should escape special characters', () => {
      const input = '& < > " \' /'
      const result = sanitizeText(input)
      expect(result).toContain('&amp;')
      expect(result).toContain('&lt;')
      expect(result).toContain('&gt;')
      expect(result).toContain('&quot;')
      expect(result).toContain('&#x27;')
      expect(result).toContain('&#x2F;')
    })

    it('should trim whitespace', () => {
      const input = '  Hello World  '
      const result = sanitizeText(input)
      expect(result).toBe('Hello World')
    })
  })

  describe('sanitizeEmail', () => {
    it('should validate and normalize valid email', () => {
      const result = sanitizeEmail('  Test@Example.COM  ')
      expect(result).toBe('test@example.com')
    })

    it('should return null for invalid email', () => {
      expect(sanitizeEmail('invalid-email')).toBeNull()
      expect(sanitizeEmail('@example.com')).toBeNull()
      expect(sanitizeEmail('test@')).toBeNull()
    })

    it('should handle empty string', () => {
      expect(sanitizeEmail('')).toBeNull()
    })
  })

  describe('sanitizeURL', () => {
    it('should validate valid URLs', () => {
      expect(sanitizeURL('https://example.com')).toBe('https://example.com')
      expect(sanitizeURL('http://test.org/path')).toBe('http://test.org/path')
    })

    it('should return null for invalid URLs', () => {
      expect(sanitizeURL('not-a-url')).toBeNull()
      expect(sanitizeURL('ftp://example.com')).toBeNull() // Only http/https allowed
      expect(sanitizeURL('javascript:alert(1)')).toBeNull()
    })

    it('should require protocol', () => {
      expect(sanitizeURL('example.com')).toBeNull()
    })
  })

  describe('sanitizeChatMessage', () => {
    it('should remove multiple spaces', () => {
      const input = 'Hello    World     Test'
      const result = sanitizeChatMessage(input)
      expect(result).toBe('Hello World Test')
    })

    it('should remove HTML tags', () => {
      const input = 'Hello <script>alert(1)</script> World'
      const result = sanitizeChatMessage(input)
      expect(result).not.toContain('<script>')
    })

    it('should limit message length to 2000 characters', () => {
      const input = 'a'.repeat(3000)
      const result = sanitizeChatMessage(input)
      expect(result.length).toBeLessThanOrEqual(2000)
    })

    it('should trim whitespace', () => {
      const input = '  Hello World  '
      const result = sanitizeChatMessage(input)
      expect(result).toBe('Hello World')
    })
  })

  describe('containsSQLInjection', () => {
    it('should detect SQL keywords', () => {
      expect(containsSQLInjection('SELECT * FROM users')).toBe(true)
      expect(containsSQLInjection('DROP TABLE users')).toBe(true)
      expect(containsSQLInjection('INSERT INTO users')).toBe(true)
      expect(containsSQLInjection('UPDATE users SET')).toBe(true)
      expect(containsSQLInjection('DELETE FROM users')).toBe(true)
    })

    it('should detect UNION attacks', () => {
      expect(containsSQLInjection('UNION SELECT password')).toBe(true)
    })

    it('should detect SQL comments', () => {
      expect(containsSQLInjection('admin--')).toBe(true)
      expect(containsSQLInjection('test/*comment*/')).toBe(true)
    })

    it('should detect OR/AND patterns', () => {
      expect(containsSQLInjection('OR 1=1')).toBe(true)
      expect(containsSQLInjection('AND 1=1')).toBe(true)
    })

    it('should return false for safe input', () => {
      expect(containsSQLInjection('Hello World')).toBe(false)
      expect(containsSQLInjection('Just a normal message')).toBe(false)
    })
  })

  describe('containsXSS', () => {
    it('should detect script tags', () => {
      expect(containsXSS('<script>alert(1)</script>')).toBe(true)
      expect(containsXSS('<SCRIPT>alert(1)</SCRIPT>')).toBe(true)
    })

    it('should detect javascript protocol', () => {
      expect(containsXSS('javascript:alert(1)')).toBe(true)
      expect(containsXSS('JAVASCRIPT:alert(1)')).toBe(true)
    })

    it('should detect event handlers', () => {
      expect(containsXSS('<img onerror="alert(1)">')).toBe(true)
      expect(containsXSS('<div onclick="alert(1)">')).toBe(true)
      expect(containsXSS('<body onload="alert(1)">')).toBe(true)
    })

    it('should detect dangerous tags', () => {
      expect(containsXSS('<iframe src="evil.com"></iframe>')).toBe(true)
      expect(containsXSS('<object data="evil.swf"></object>')).toBe(true)
      expect(containsXSS('<embed src="evil.swf">')).toBe(true)
    })

    it('should return false for safe input', () => {
      expect(containsXSS('Hello World')).toBe(false)
      expect(containsXSS('<p>Normal paragraph</p>')).toBe(false)
    })
  })

  describe('validateUserInput', () => {
    it('should validate safe input', () => {
      const result = validateUserInput('Hello World')
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.sanitized).toBe('Hello World')
    })

    it('should detect SQL injection', () => {
      const result = validateUserInput('SELECT * FROM users')
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Input sadrži potencijalno opasne SQL karaktere')
    })

    it('should detect XSS', () => {
      const result = validateUserInput('<script>alert(1)</script>')
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Input sadrži potencijalno opasan JavaScript kod')
    })

    it('should detect both SQL injection and XSS', () => {
      const result = validateUserInput('<script>SELECT * FROM users</script>')
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should sanitize the input regardless of validation', () => {
      const result = validateUserInput('<b>Bold</b> text')
      expect(result.sanitized).not.toContain('<b>')
    })
  })
})
