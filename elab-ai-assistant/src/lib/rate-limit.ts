// src/lib/rate-limit.ts

/**
 * Rate Limiting Service
 * Zaštita od brute force i DDoS napada
 */

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

const store: RateLimitStore = {}

/**
 * Tip za rate limit konfiguraciju
 */
export interface RateLimitConfig {
  windowMs: number // Vremenski prozor u milisekundama
  maxRequests: number // Maksimalan broj zahteva
  message?: string // Poruka greške
}

/**
 * Predefinirane konfiguracije
 */
export const RateLimitPresets = {
  // Strogi limit za login (5 pokušaja u 15 minuta)
  LOGIN: {
    windowMs: 15 * 60 * 1000, // 15 minuta
    maxRequests: 5,
    message: 'Previše neuspešnih pokušaja prijavljivanja. Pokušajte za 15 minuta.',
  },
  // Srednji limit za API endpoint-e (100 zahteva u minuti)
  API: {
    windowMs: 60 * 1000, // 1 minut
    maxRequests: 100,
    message: 'Previše zahteva. Pokušajte kasnije.',
  },
  // Blaži limit za guest korisnike (10 zahteva u minuti)
  GUEST: {
    windowMs: 60 * 1000, // 1 minut
    maxRequests: 10,
    message: 'Dostigli ste limit. Registrujte se za neograničen pristup.',
  },
  // Limit za registraciju (3 registracije po IP-u u 24h)
  REGISTER: {
    windowMs: 24 * 60 * 60 * 1000, // 24 sata
    maxRequests: 3,
    message: 'Dostigli ste dnevni limit registracija sa ove IP adrese.',
  },
}

/**
 * Rate Limiter klasa
 */
export class RateLimiter {
  private config: RateLimitConfig

  constructor(config: RateLimitConfig) {
    this.config = config
  }

  /**
   * Generiše ključ za store (IP + endpoint)
   */
  private getKey(identifier: string, endpoint: string): string {
    return `${identifier}:${endpoint}`
  }

  /**
   * Čisti istekle zapise iz store-a
   */
  private cleanup() {
    const now = Date.now()
    Object.keys(store).forEach(key => {
      if (store[key].resetTime < now) {
        delete store[key]
      }
    })
  }

  /**
   * Proverava da li je zahtev dozvoljen
   */
  check(identifier: string, endpoint: string): {
    allowed: boolean
    remaining: number
    resetTime: number
    message?: string
  } {
    this.cleanup()

    const key = this.getKey(identifier, endpoint)
    const now = Date.now()

    if (!store[key] || store[key].resetTime < now) {
      // Novi prozor
      store[key] = {
        count: 1,
        resetTime: now + this.config.windowMs,
      }

      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetTime: store[key].resetTime,
      }
    }

    // Proveri da li je prekoračen limit
    if (store[key].count >= this.config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: store[key].resetTime,
        message: this.config.message,
      }
    }

    // Povećaj brojač
    store[key].count++

    return {
      allowed: true,
      remaining: this.config.maxRequests - store[key].count,
      resetTime: store[key].resetTime,
    }
  }

  /**
   * Resetuje brojač za identifier
   */
  reset(identifier: string, endpoint: string) {
    const key = this.getKey(identifier, endpoint)
    delete store[key]
  }
}

/**
 * Helper funkcija za dobijanje IP adrese iz zahteva
 */
export function getClientIP(headers: Headers): string {
  // Proveri X-Forwarded-For header (proxy/load balancer)
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  // Proveri X-Real-IP header
  const realIP = headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }

  // Fallback
  return 'unknown'
}

/**
 * Factory funkcije za kreiranje rate limitera
 */
export function createLoginLimiter() {
  return new RateLimiter(RateLimitPresets.LOGIN)
}

export function createAPILimiter() {
  return new RateLimiter(RateLimitPresets.API)
}

export function createGuestLimiter() {
  return new RateLimiter(RateLimitPresets.GUEST)
}

export function createRegisterLimiter() {
  return new RateLimiter(RateLimitPresets.REGISTER)
}