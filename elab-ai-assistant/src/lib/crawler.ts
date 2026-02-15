// src/lib/crawler.ts

import axios from 'axios'
import * as cheerio from 'cheerio'
import { URL } from 'url'

/**
 * Tip za crawlovani dokument
 */
export interface CrawledDocument {
  url: string
  title: string
  content: string
  metadata: {
    sourceType: string
    crawledAt: Date
    contentLength: number
    links: string[]
  }
}

/**
 * Konfiguracija crawlera
 */
export interface CrawlerConfig {
  maxDepth?: number // Maksimalna dubina crawlovanja (default: 2)
  maxPages?: number // Maksimalan broj stranica (default: 50)
  timeout?: number // Timeout za HTTP zahtev (ms, default: 10000)
  userAgent?: string
  respectRobotsTxt?: boolean
  allowedDomains?: string[] // Dozvoljeni domeni
}

const DEFAULT_CONFIG: CrawlerConfig = {
  maxDepth: 2,
  maxPages: 50,
  timeout: 10000,
  userAgent: 'ELAB-AI-Crawler/1.0',
  respectRobotsTxt: true,
  allowedDomains: ['elab.fon.bg.ac.rs', 'bc.elab.fon.bg.ac.rs', 'ebt.rs'],
}

/**
 * Crawler klasa
 */
export class WebCrawler {
  private config: CrawlerConfig
  private visitedUrls: Set<string> = new Set()
  private crawledDocuments: CrawledDocument[] = []

  constructor(config: Partial<CrawlerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Normalizuje URL (uklanja fragment, trailing slash)
   */
  private normalizeUrl(url: string): string {
    try {
      const parsed = new URL(url)
      // Ukloni fragment (#section)
      parsed.hash = ''
      // Ukloni trailing slash
      parsed.pathname = parsed.pathname.replace(/\/$/, '')
      return parsed.toString()
    } catch {
      return url
    }
  }

  /**
   * Proverava da li je URL dozvoljen
   */
  private isAllowedUrl(url: string): boolean {
    try {
      const parsed = new URL(url)
      
      // Proveri da li je domen dozvoljen
      if (this.config.allowedDomains) {
        const isAllowed = this.config.allowedDomains.some(domain =>
          parsed.hostname.includes(domain)
        )
        if (!isAllowed) return false
      }

      // Ignoriši fajlove (PDF, ZIP, itd.)
      const fileExtensions = ['.pdf', '.zip', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx']
      if (fileExtensions.some(ext => parsed.pathname.toLowerCase().endsWith(ext))) {
        return false
      }

      return true
    } catch {
      return false
    }
  }

  /**
   * Preuzima HTML sadržaj stranice
   */
  private async fetchPage(url: string): Promise<string | null> {
    try {
      console.log(`🕷  Crawling: ${url}`)

      const response = await axios.get(url, {
        timeout: this.config.timeout,
        headers: {
          'User-Agent': this.config.userAgent || 'ELAB-AI-Crawler/1.0',
        },
        maxRedirects: 5,
      })

      // Proveri content type
      const contentType = response.headers['content-type'] || ''
      if (!contentType.includes('text/html')) {
        console.log(`⚠  Skipping non-HTML content: ${url}`)
        return null
      }

      return response.data
    } catch (error: any) {
      console.error(`❌ Failed to fetch ${url}:`, error.message)
      return null
    }
  }

  /**
   * Parsira HTML i ekstraktuje sadržaj
   */
  private parseHtml(html: string, url: string): {
    title: string
    content: string
    links: string[]
  } {
    const $ = cheerio.load(html)

    // Ukloni script, style, nav, footer elemente
    $('script, style, nav, footer, header, .sidebar, .menu, .navigation').remove()

    // Ekstraktuj naslov
    const title = $('title').text().trim() || $('h1').first().text().trim() || 'Untitled'

    // Ekstraktuj glavni sadržaj
    // Pokušaj da pronađeš main content container
    let contentElement = $('main, article, .content, .main-content, #content').first()
    if (contentElement.length === 0) {
      contentElement = $('body')
    }

    // Ekstraktuj tekst
    let content = contentElement
      .text()
      .replace(/\s+/g, ' ') // Zameni multiple whitespace sa jednim
      .replace(/\n+/g, '\n') // Zameni multiple newline sa jednim
      .trim()

    // Ekstraktuj linkove
    const links: string[] = []
    $('a[href]').each((_, element) => {
      const href = $(element).attr('href')
      if (href) {
        try {
          const absoluteUrl = new URL(href, url).toString()
          if (this.isAllowedUrl(absoluteUrl)) {
            links.push(this.normalizeUrl(absoluteUrl))
          }
        } catch {
          // Ignoriši nevažeće URL-ove
        }
      }
    })

    return { title, content, links: [...new Set(links)] }
  }

  /**
   * Crawluje jednu stranicu
   */
  private async crawlPage(url: string, depth: number): Promise<void> {
    // Proveri limite
    if (depth > (this.config.maxDepth || 2)) return
    if (this.crawledDocuments.length >= (this.config.maxPages || 50)) return

    const normalizedUrl = this.normalizeUrl(url)

    // Proveri da li je već posećena
    if (this.visitedUrls.has(normalizedUrl)) return
    this.visitedUrls.add(normalizedUrl)

    // Preuzmi stranicu
    const html = await this.fetchPage(normalizedUrl)
    if (!html) return

    // Parsiraj HTML
    const { title, content, links } = this.parseHtml(html, normalizedUrl)

    // Sačuvaj dokument
    if (content.length > 100) {
      // Ignoriši prazne stranice
      const sourceType = this.detectSourceType(normalizedUrl)

      this.crawledDocuments.push({
        url: normalizedUrl,
        title,
        content,
        metadata: {
          sourceType,
          crawledAt: new Date(),
          contentLength: content.length,
          links,
        },
      })

      console.log(`✅ Crawled: ${title} (${content.length} chars)`)
    }

    // Crawluj linkove (rekurzivno)
    for (const link of links.slice(0, 10)) {
      // Max 10 linkova po stranici
      await this.crawlPage(link, depth + 1)
      
      // Proveri limit
      if (this.crawledDocuments.length >= (this.config.maxPages || 50)) break
    }
  }

  /**
   * Detektuje tip izvora na osnovu URL-a
   */
  private detectSourceType(url: string): string {
    if (url.includes('elab.fon.bg.ac.rs')) return 'ELAB_MAIN'
    if (url.includes('bc.elab.fon.bg.ac.rs')) return 'ELAB_BC'
    if (url.includes('ebt.rs')) return 'ELAB_EBT'
    return 'OTHER'
  }

  /**
   * Pokreće crawling od početnog URL-a
   */
  public async crawl(startUrl: string): Promise<CrawledDocument[]> {
    console.log(`🚀 Starting crawl from: ${startUrl}`)
    console.log(`📋 Config:`, this.config)

    this.visitedUrls.clear()
    this.crawledDocuments = []

    await this.crawlPage(startUrl, 0)

    console.log(`✅ Crawling completed: ${this.crawledDocuments.length} documents`)
    return this.crawledDocuments
  }

  /**
   * Crawluje multiple početnih URL-ova
   */
  public async crawlMultiple(startUrls: string[]): Promise<CrawledDocument[]> {
    console.log(`🚀 Starting multi-crawl from ${startUrls.length} URLs`)

    this.visitedUrls.clear()
    this.crawledDocuments = []

    for (const url of startUrls) {
      await this.crawlPage(url, 0)
      
      // Proveri limit
      if (this.crawledDocuments.length >= (this.config.maxPages || 50)) break
    }

    console.log(`✅ Multi-crawl completed: ${this.crawledDocuments.length} documents`)
    return this.crawledDocuments
  }

  /**
   * Vraća statistiku crawlovanja
   */
  public getStats() {
    return {
      totalDocuments: this.crawledDocuments.length,
      totalUrls: this.visitedUrls.size,
      averageContentLength:
        this.crawledDocuments.reduce((sum, doc) => sum + doc.content.length, 0) /
        this.crawledDocuments.length,
      sourceTypes: this.crawledDocuments.reduce((acc, doc) => {
        acc[doc.metadata.sourceType] = (acc[doc.metadata.sourceType] || 0) + 1
        return acc
      }, {} as Record<string, number>),
    }
  }
}