# ============================================
# STAGE 1: Dependencies
# ============================================
FROM node:20-alpine AS deps

WORKDIR /app

# Kopiraj package files
COPY package.json package-lock.json ./

# Instaliraj SVE dependencies (uključujući devDependencies)
RUN npm ci

# ============================================
# STAGE 2: Builder
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Kopiraj dependencies iz prethodnog stage-a
COPY --from=deps /app/node_modules ./node_modules

# Kopiraj source code
COPY . .

# Generiši Prisma Client
RUN npx prisma generate

# Build Next.js aplikacije
RUN npm run build

# ============================================
# STAGE 3: Runner (Production)
# ============================================
FROM node:20-alpine AS runner

WORKDIR /app

# Postavi environment na production
ENV NODE_ENV=production

# Kreiraj non-root korisnika
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Kopiraj public folder
COPY --from=builder /app/public ./public

# Kopiraj built aplikaciju
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Kopiraj Prisma schema i migrations
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Kopiraj node_modules (potrebno za Prisma)
COPY --from=builder /app/node_modules ./node_modules

# Switch na non-root korisnika
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start aplikacije
CMD ["node", "server.js"]