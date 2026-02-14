// prisma/seed.ts

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // 🔹 Proveri da li baza već ima podatke
  const userCount = await prisma.user.count()
  
  if (userCount > 0) {
    console.log('ℹ  Database already seeded, skipping...')
    console.log(`📊 Current user count: ${userCount}`)
    return
  }

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
      role: 'ADMIN',
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
      role: 'MODERATOR',
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
      role: 'USER',
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
      role: 'USER',
      verified: false,
      status: 'PENDING_VERIFICATION',
      verificationToken: 'sample-token-12345',
      tokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
    },
  })

  console.log('✅ Users created:', { 
    admin: admin.email, 
    moderator: moderator.email, 
    user1: user1.email, 
    user2: user2.email 
  })

  // 2. CREATE SOURCES sa UPSERT (spreči duplikate)
  const sources = await Promise.all([
    prisma.source.upsert({
      where: { url: 'https://elab.fon.bg.ac.rs' },
      update: {},
      create: {
        url: 'https://elab.fon.bg.ac.rs',
        sourceType: 'ELAB_MAIN',
        priority: 'HIGH',
        status: 'ACTIVE',
        crawlFrequency: 'WEEKLY',
        createdBy: admin.id,
      },
    }),
    prisma.source.upsert({
      where: { url: 'https://bc.elab.fon.bg.ac.rs' },
      update: {},
      create: {
        url: 'https://bc.elab.fon.bg.ac.rs',
        sourceType: 'ELAB_BC',
        priority: 'MEDIUM',
        status: 'ACTIVE',
        crawlFrequency: 'WEEKLY',
        createdBy: admin.id,
      },
    }),
    prisma.source.upsert({
      where: { url: 'https://ebt.rs' },
      update: {},
      create: {
        url: 'https://ebt.rs',
        sourceType: 'ELAB_EBT',
        priority: 'MEDIUM',
        status: 'ACTIVE',
        crawlFrequency: 'MONTHLY',
        createdBy: admin.id,
      },
    }),
  ])

  console.log('✅ Sources created:', sources.length)

  // 3. CREATE FAQ ENTRIES (samo ako ne postoje)
  const existingFAQs = await prisma.fAQEntry.count()
  
  if (existingFAQs === 0) {
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
  } else {
    console.log('ℹ  FAQ entries already exist, skipping...')
  }

  // 4. CREATE SAMPLE CONVERSATION (samo ako ne postoji)
  const existingConversation = await prisma.conversation.findFirst({
    where: { userId: user1.id },
  })

  let conversation
  if (!existingConversation) {
    conversation = await prisma.conversation.create({
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
  } else {
    console.log('ℹ  Sample conversation already exists, skipping...')
    conversation = await prisma.conversation.findFirst({
      where: { userId: user1.id },
      include: { messages: true },
    })
  }

  // 5. CREATE RATING (samo ako ne postoji)
  if (conversation && conversation.messages.length > 1) {
    const existingRating = await prisma.rating.findFirst({
      where: { 
        messageId: conversation.messages[1].id,
        userId: user1.id,
      },
    })

    if (!existingRating) {
      await prisma.rating.create({
        data: {
          messageId: conversation.messages[1].id, // AI odgovor
          userId: user1.id,
          rating: 'POSITIVE',
          feedbackText: 'Odličan odgovor, pomoglo mi je!',
        },
      })

      console.log('✅ Rating created')
    } else {
      console.log('ℹ  Rating already exists, skipping...')
    }
  }

  // 6. CREATE AUDIT LOG (uvek kreiraj novi, ali sa timestampom)
  const existingAuditLogs = await prisma.auditLog.count({
    where: {
      userId: admin.id,
      action: 'USER_ROLE_CHANGED',
      entityId: moderator.id,
    },
  })

  if (existingAuditLogs === 0) {
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
  } else {
    console.log('ℹ  Audit log already exists, skipping...')
  }

  console.log('🎉 Seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })