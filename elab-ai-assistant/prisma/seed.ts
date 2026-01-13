// prisma/seed.ts

import { PrismaClient, UserRole, SourceType, Priority, CrawlFrequency } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Hash password helper
  const hashPassword = async (password: string) => {
    return await bcrypt.hash(password, 10)
  }

  // 1. CREATE USERS (različite uloge)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@fon.bg.ac.rs' },
    update: {},
    create: {
      email: 'admin@fon.bg.ac.rs',
      passwordHash: await hashPassword('Admin123!'),
      role: UserRole.ADMIN,
      verified: true,
      status: 'ACTIVE',
    },
  })

  const moderator = await prisma.user.upsert({
    where: { email: 'moderator@fon.bg.ac.rs' },
    update: {},
    create: {
      email: 'moderator@fon.bg.ac.rs',
      passwordHash: await hashPassword('Mod123!'),
      role: UserRole.MODERATOR,
      verified: true,
      status: 'ACTIVE',
    },
  })

  const user1 = await prisma.user.upsert({
    where: { email: 'student1@fon.bg.ac.rs' },
    update: {},
    create: {
      email: 'student1@fon.bg.ac.rs',
      passwordHash: await hashPassword('Student123!'),
      role: UserRole.USER,
      verified: true,
      status: 'ACTIVE',
    },
  })

  const user2 = await prisma.user.upsert({
    where: { email: 'student2@fon.bg.ac.rs' },
    update: {},
    create: {
      email: 'student2@fon.bg.ac.rs',
      passwordHash: await hashPassword('Student123!'),
      role: UserRole.USER,
      verified: false,
      status: 'PENDING_VERIFICATION',
      verificationToken: 'sample-token-12345',
      tokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
    },
  })

  console.log('✅ Users created:', { admin, moderator, user1, user2 })

  // 2. CREATE SOURCES
  const sources = await Promise.all([
    prisma.source.create({
      data: {
        url: 'https://elab.fon.bg.ac.rs',
        sourceType: SourceType.ELAB_MAIN,
        priority: Priority.HIGH,
        status: 'ACTIVE',
        crawlFrequency: CrawlFrequency.WEEKLY,
        createdBy: admin.id,
      },
    }),
    prisma.source.create({
      data: {
        url: 'https://bc.elab.fon.bg.ac.rs',
        sourceType: SourceType.ELAB_BC,
        priority: Priority.MEDIUM,
        status: 'ACTIVE',
        crawlFrequency: CrawlFrequency.WEEKLY,
        createdBy: admin.id,
      },
    }),
    prisma.source.create({
      data: {
        url: 'https://ebt.rs',
        sourceType: SourceType.ELAB_EBT,
        priority: Priority.MEDIUM,
        status: 'ACTIVE',
        crawlFrequency: CrawlFrequency.MONTHLY,
        createdBy: admin.id,
      },
    }),
  ])

  console.log('✅ Sources created:', sources.length)

  // 3. CREATE FAQ ENTRIES
  const faqs = await Promise.all([
    prisma.fAQEntry.create({
      data: {
        question: 'Kako se prijavim na ELAB platformu?',
        answer: 'Prijavite se korišćenjem vašeg FON email naloga (@fon.bg.ac.rs) i lozinke.',
        category: 'Pristup',
        createdBy: moderator.id,
      },
    }),
    prisma.fAQEntry.create({
      data: {
        question: 'Gde mogu naći materijale za predmet?',
        answer: 'Materijali se nalaze u sekciji "Materijali" svakog predmeta na ELAB platformi.',
        category: 'Materijali',
        createdBy: moderator.id,
      },
    }),
    prisma.fAQEntry.create({
      data: {
        question: 'Kako da resetujem lozinku?',
        answer: 'Kliknite na "Zaboravili ste lozinku?" na login stranici i pratite instrukcije.',
        category: 'Nalog',
        createdBy: moderator.id,
      },
    }),
  ])

  console.log('✅ FAQ entries created:', faqs.length)

  // 4. CREATE SAMPLE CONVERSATION
  const conversation = await prisma.conversation.create({
    data: {
      userId: user1.id,
      title: 'Pitanje o ispitnim rokovima',
      messages: {
        create: [
          {
            role: 'USER',
            content: 'Kada su ispitni rokovi za E-poslovanje?',
          },
          {
            role: 'ASSISTANT',
            content: 'Ispitni rokovi za E-poslovanje su:\n- Januarski: 15.01.2024\n- Februarski: 10.02.2024\n- Junski: 20.06.2024',
            sources: [
              {
                url: 'https://elab.fon.bg.ac.rs/ispiti',
                title: 'Raspored ispita',
                relevanceScore: 0.95,
              },
            ],
            processingTime: 1250,
          },
        ],
      },
    },
    include: {
      messages: true,
    },
  })

  console.log('✅ Conversation created with messages:', conversation.messages.length)

  // 5. CREATE RATING
  await prisma.rating.create({
    data: {
      messageId: conversation.messages[1].id, // AI odgovor
      userId: user1.id,
      rating: 'POSITIVE',
      feedbackText: 'Odličan odgovor, pomoglo mi je!',
    },
  })

  console.log('✅ Rating created')

  // 6. CREATE AUDIT LOG
  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: 'USER_ROLE_CHANGED',
      resourceType: 'User',
      entityId: moderator.id,
      details: {
        oldRole: 'USER',
        newRole: 'MODERATOR',
      },
      ipAddress: '192.168.1.1',
    },
  })

  console.log('✅ Audit log created')

  console.log('🎉 Seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })