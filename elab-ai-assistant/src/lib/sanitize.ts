// src/lib/sanitize.ts

import validator from 'validator'

/**
 * Input Sanitization Service
 * Zaštita od XSS i SQL Injection napada
 */

/**
 * Sanitizuje HTML sadržaj (XSS zaštita) - uklanja sve HTML tagove
 */
export function sanitizeHTML(input: string): string {
  // Ukloni sve HTML tagove (ekvivalentno DOMPurify sa ALLOWED_TAGS: [])
  return input.replace(/<[^>]*>/g, '').trim()
}

/**
 * Sanitizuje tekst (uklanja HTML tagove)
 */
export function sanitizeText(input: string): string {
  // Ukloni HTML tagove
  let sanitized = input.replace(/<[^>]*>/g, '')
  
  // Escape specijalni karakteri
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
  
  return sanitized.trim()
}

/**
 * Validira i sanitizuje email
 */
export function sanitizeEmail(email: string): string | null {
  const trimmed = email.trim().toLowerCase()
  
  if (!validator.isEmail(trimmed)) {
    return null
  }
  
  return validator.normalizeEmail(trimmed) || trimmed
}

/**
 * Validira i sanitizuje URL
 */
export function sanitizeURL(url: string): string | null {
  const trimmed = url.trim()
  
  if (!validator.isURL(trimmed, {
    protocols: ['http', 'https'],
    require_protocol: true,
  })) {
    return null
  }
  
  return trimmed
}

/**
 * Sanitizuje user input za chat poruke
 */
export function sanitizeChatMessage(message: string): string {
  // Ukloni višestruke razmake
  let sanitized = message.replace(/\s+/g, ' ')
  
  // Ukloni HTML tagove
  sanitized = sanitizeText(sanitized)
  
  // Ograniči dužinu
  if (sanitized.length > 2000) {
    sanitized = sanitized.substring(0, 2000)
  }
  
  return sanitized.trim()
}

/**
 * Validira string protiv SQL Injection pattern-a
 */
export function containsSQLInjection(input: string): boolean {
  const sqlPatterns = [
    /(\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b|\bCREATE\b|\bALTER\b)/i,
    /(\bUNION\b.*\bSELECT\b)/i,
    /(--|;|\/\*|\*\/)/,
    /(\bOR\b\s+\d+\s*=\s*\d+)/i,
    /(\bAND\b\s+\d+\s*=\s*\d+)/i,
  ]
  
  return sqlPatterns.some(pattern => pattern.test(input))
}

/**
 * Validira string protiv XSS pattern-a
 */
export function containsXSS(input: string): boolean {
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi, // onclick, onload, itd.
    /<iframe/gi,
    /<object/gi,
    /<embed/gi,
  ]
  
  return xssPatterns.some(pattern => pattern.test(input))
}

/**
 * Kompletna validacija user input-a
 */
export function validateUserInput(input: string): {
  valid: boolean
  sanitized: string
  errors: string[]
} {
  const errors: string[] = []
  
  // Proveri SQL Injection
  if (containsSQLInjection(input)) {
    errors.push('Input sadrži potencijalno opasne SQL karaktere')
  }
  
  // Proveri XSS
  if (containsXSS(input)) {
    errors.push('Input sadrži potencijalno opasan JavaScript kod')
  }
  
  // Sanitizuj
  const sanitized = sanitizeText(input)
  
  return {
    valid: errors.length === 0,
    sanitized,
    errors,
  }
}