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

# 🔹 BUILD ARGUMENTI - Prosleđuju se iz docker-compose.yml
ARG RESEND_API_KEY
ARG DATABASE_URL
ARG NEXTAUTH_SECRET
ARG NEXTAUTH_URL
ARG NEXT_PUBLIC_APP_URL

# 🔹 SETOVANJE ENV VARIJABLI za build proces
# Ove će biti dostupne tokom `npm run build`
ENV RESEND_API_KEY=${RESEND_API_KEY:-re_GBKSrAmr_MKXTXNj5r7oZQ6PYCSE7qWQh}
ENV DATABASE_URL=${DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/elab_ai}
ENV NEXTAUTH_SECRET=${NEXTAUTH_SECRET:-dummy-secret-minimum-32-characters-long}
ENV NEXTAUTH_URL=${NEXTAUTH_URL:-http://localhost:3000}
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL:-http://localhost:3000}

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

# 🔹 Runtime ENV varijable će biti setovane iz docker-compose.yml
# Ne postavljamo ih ovde, jer će biti override-ovane

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