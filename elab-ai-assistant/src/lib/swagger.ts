// src/lib/swagger.ts

import { OpenAPIV3 } from 'openapi-types'

/**
 * OpenAPI 3.0 specifikacija za ELAB AI Assistant API
 */
export const swaggerSpec: OpenAPIV3.Document = {
  openapi: '3.0.0',
  info: {
    title: 'ELAB AI Assistant API',
    version: '1.0.0',
    description: `
      REST API za ELAB AI Assistant - inteligentni asistent za ELAB platformu.
      
      ## Autentifikacija
      Većina endpoint-a zahteva JWT token koji se dobija pri login-u.
      Token se prosleđuje u Authorization header-u: \`Bearer <token>\`
      
      ## Uloge korisnika
      - **GUEST**: Neregistrovani korisnik (ograničen pristup)
      - **USER**: Registrovani korisnik (chat, konverzacije, ocenjivanje)
      - **MODERATOR**: Moderator (+ FAQ, flags, tickets)
      - **ADMIN**: Administrator (+ upravljanje korisnicima, izvorima, statistika)
    `,
    contact: {
      name: 'ELAB Support',
      email: 'support@elab.fon.bg.ac.rs',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Development server',
    },
    {
      url: 'https://elab-ai.vercel.app',
      description: 'Production server',
    },
  ],
  tags: [
    { name: 'Auth', description: 'Autentifikacija i registracija' },
    { name: 'Chat', description: 'Konverzacije i poruke' },
    { name: 'Moderator', description: 'Moderatorske funkcionalnosti' },
    { name: 'Admin', description: 'Administrativne funkcionalnosti' },
    { name: 'Health', description: 'Health check endpoint' },
  ],
  paths: {
    // ============================================
    // HEALTH CHECK
    // ============================================
    '/api/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check endpoint',
        description: 'Proverava status aplikacije i konekcije sa bazom',
        responses: {
          '200': {
            description: 'Aplikacija je zdrava',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'healthy' },
                    timestamp: { type: 'string', format: 'date-time' },
                    database: { type: 'string', example: 'connected' },
                    uptime: { type: 'number', example: 123.456 },
                  },
                },
              },
            },
          },
          '503': {
            description: 'Aplikacija nije zdrava',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },

    // ============================================
    // AUTH - REGISTRACIJA
    // ============================================
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Registracija novog korisnika',
        description: 'Kreira novi korisnički nalog sa FON email adresom',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'confirmPassword'],
                properties: {
                  email: {
                    type: 'string',
                    format: 'email',
                    example: 'student@fon.bg.ac.rs',
                    description: 'Mora biti @fon.bg.ac.rs domen',
                  },
                  password: {
                    type: 'string',
                    format: 'password',
                    minLength: 8,
                    example: 'Student123!',
                    description: 'Min 8 karaktera, jedno veliko slovo, broj, specijalni karakter',
                  },
                  confirmPassword: {
                    type: 'string',
                    format: 'password',
                    example: 'Student123!',
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Korisnik uspešno kreiran',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                    user: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Validaciona greška',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ValidationError' },
              },
            },
          },
        },
      },
    },

    // ============================================
    // AUTH - VERIFIKACIJA
    // ============================================
    '/api/auth/verify': {
      get: {
        tags: ['Auth'],
        summary: 'Verifikacija email adrese',
        description: 'Aktivira korisnički nalog pomoću verifikacionog tokena',
        parameters: [
          {
            name: 'token',
            in: 'query',
            required: true,
            schema: { type: 'string' },
            description: 'Verifikacioni token iz email-a',
          },
        ],
        responses: {
          '200': {
            description: 'Email uspešno verifikovan',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'Email uspešno verifikovan!' },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Nevažeći ili istekli token',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },

    // ============================================
    // CHAT - KONVERZACIJE
    // ============================================
    '/api/chat/conversations': {
      get: {
        tags: ['Chat'],
        summary: 'Lista konverzacija trenutnog korisnika',
        description: 'Vraća sve konverzacije korisnika sortirane po datumu',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Lista konverzacija',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    conversations: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Conversation' },
                    },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Neautorizovan pristup',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
      post: {
        tags: ['Chat'],
        summary: 'Kreiranje nove konverzacije',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string', example: 'Nova konverzacija' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Konverzacija kreirana',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    conversation: { $ref: '#/components/schemas/Conversation' },
                  },
                },
              },
            },
          },
        },
      },
    },

    '/api/chat/conversations/{id}': {
      get: {
        tags: ['Chat'],
        summary: 'Detalji konverzacije',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': {
            description: 'Detalji konverzacije',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    conversation: { $ref: '#/components/schemas/ConversationDetail' },
                  },
                },
              },
            },
          },
          '404': { description: 'Konverzacija nije pronađena' },
        },
      },
      delete: {
        tags: ['Chat'],
        summary: 'Arhiviranje konverzacije',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': { description: 'Konverzacija arhivirana' },
        },
      },
    },

    // ============================================
    // CHAT - PORUKE
    // ============================================
    '/api/chat/messages': {
      post: {
        tags: ['Chat'],
        summary: 'Slanje poruke AI asistentu',
        description: 'Šalje pitanje i dobija AI odgovor sa izvorima',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['conversationId', 'content'],
                properties: {
                  conversationId: { type: 'string', format: 'uuid' },
                  content: {
                    type: 'string',
                    minLength: 1,
                    maxLength: 2000,
                    example: 'Kada su ispitni rokovi za E-poslovanje?',
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Poruka poslata i odgovor generisan',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    userMessage: { $ref: '#/components/schemas/Message' },
                    aiMessage: { $ref: '#/components/schemas/Message' },
                  },
                },
              },
            },
          },
        },
      },
    },

    // ============================================
    // CHAT - OCENJIVANJE
    // ============================================
    '/api/chat/ratings': {
      post: {
        tags: ['Chat'],
        summary: 'Ocenjivanje AI odgovora',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['messageId', 'rating'],
                properties: {
                  messageId: { type: 'string', format: 'uuid' },
                  rating: { type: 'string', enum: ['POSITIVE', 'NEGATIVE'] },
                  feedbackText: { type: 'string', maxLength: 500 },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Ocena sačuvana' },
        },
      },
    },

    // ============================================
    // ADMIN - KORISNICI
    // ============================================
    '/api/admin/users': {
      get: {
        tags: ['Admin'],
        summary: 'Lista svih korisnika',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'role',
            in: 'query',
            schema: { type: 'string', enum: ['USER', 'MODERATOR', 'ADMIN'] },
          },
          {
            name: 'status',
            in: 'query',
            schema: { type: 'string', enum: ['ACTIVE', 'BLOCKED', 'PENDING_VERIFICATION'] },
          },
        ],
        responses: {
          '200': {
            description: 'Lista korisnika',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    users: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/User' },
                    },
                  },
                },
              },
            },
          },
          '403': { description: 'Nedovoljne privilegije' },
        },
      },
    },

    '/api/admin/users/{id}': {
      patch: {
        tags: ['Admin'],
        summary: 'Ažuriranje korisnika (role/status)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  role: { type: 'string', enum: ['USER', 'MODERATOR', 'ADMIN'] },
                  status: { type: 'string', enum: ['ACTIVE', 'BLOCKED'] },
                  reason: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Korisnik ažuriran' },
        },
      },
      delete: {
        tags: ['Admin'],
        summary: 'Brisanje korisnika',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': { description: 'Korisnik obrisan' },
        },
      },
    },

    // ============================================
    // ADMIN - STATISTIKA
    // ============================================
    '/api/admin/statistics': {
      get: {
        tags: ['Admin'],
        summary: 'Statistika sistema',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Statistički podaci',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Statistics' },
              },
            },
          },
        },
      },
    },

    // ============================================
    // MODERATOR - FAQ
    // ============================================
    '/api/moderator/faq': {
      get: {
        tags: ['Moderator'],
        summary: 'Lista FAQ unosa',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'category',
            in: 'query',
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Lista FAQ-ova',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    faqs: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/FAQ' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Moderator'],
        summary: 'Kreiranje FAQ unosa',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['question', 'answer'],
                properties: {
                  question: { type: 'string', minLength: 10 },
                  answer: { type: 'string', minLength: 20 },
                  category: { type: 'string', default: 'Opšte' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'FAQ kreiran' },
        },
      },
    },
  },

  // ============================================
  // COMPONENTS (REUSABLE SCHEMAS)
  // ============================================
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token dobijen pri login-u',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          role: { type: 'string', enum: ['GUEST', 'USER', 'MODERATOR', 'ADMIN'] },
          verified: { type: 'boolean' },
          status: { type: 'string', enum: ['ACTIVE', 'BLOCKED', 'PENDING_VERIFICATION'] },
          createdAt: { type: 'string', format: 'date-time' },
          lastLogin: { type: 'string', format: 'date-time', nullable: true },
        },
      },
      Conversation: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          title: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          messageCount: { type: 'integer' },
        },
      },
      ConversationDetail: {
        allOf: [
          { $ref: '#/components/schemas/Conversation' },
          {
            type: 'object',
            properties: {
              messages: {
                type: 'array',
                items: { $ref: '#/components/schemas/Message' },
              },
            },
          },
        ],
      },
      Message: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          role: { type: 'string', enum: ['USER', 'ASSISTANT'] },
          content: { type: 'string' },
          sources: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                url: { type: 'string', format: 'uri' },
                title: { type: 'string' },
                relevanceScore: { type: 'number', format: 'float' },
              },
            },
          },
          processingTime: { type: 'integer', description: 'Milliseconds' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      FAQ: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          question: { type: 'string' },
          answer: { type: 'string' },
          category: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Statistics: {
        type: 'object',
        properties: {
          overview: {
            type: 'object',
            properties: {
              totalUsers: { type: 'integer' },
              totalConversations: { type: 'integer' },
              totalMessages: { type: 'integer' },
              satisfactionRate: { type: 'string' },
            },
          },
          usersByRole: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                role: { type: 'string' },
                count: { type: 'integer' },
              },
            },
          },
        },
      },
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string' },
          details: { type: 'object', nullable: true },
        },
      },
      ValidationError: {
        type: 'object',
        properties: {
          error: { type: 'string' },
          details: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                path: { type: 'array', items: { type: 'string' } },
                message: { type: 'string' },
              },
            },
          },
        },
      },
    },
  },
}