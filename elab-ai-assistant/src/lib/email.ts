// src/lib/email.ts

import { Resend } from 'resend'

// Inicijalizuj Resend klijenta
const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_EMAIL = process.env.EMAIL_FROM || 'ELAB AI Assistant <onboarding@resend.dev>'
const APP_URL = process.env.APP_URL || 'http://localhost:3000'
const TO_OVERRIDE = process.env.EMAIL_TO_OVERRIDE

// 🔴 ULTRA DEBUG - log sve pri inicijalizaciji modula
console.log('═══════════════════════════════════════════════')
console.log('🔧 [EMAIL MODULE INIT] Loading email configuration...')
console.log('═══════════════════════════════════════════════')
console.log('📍 RESEND_API_KEY:', process.env.RESEND_API_KEY ? '✅ PRESENT' : '❌ MISSING')
console.log('📍 FROM_EMAIL:', FROM_EMAIL)
console.log('📍 APP_URL:', APP_URL)
console.log('📍 TO_OVERRIDE:', TO_OVERRIDE || '❌ NOT SET')
console.log('📍 NODE_ENV:', process.env.NODE_ENV)
console.log('═══════════════════════════════════════════════')

/**
 * Helper funkcija za testiranje sa Resend free tier-om
 * Ako je EMAIL_TO_OVERRIDE setovan, UVEK ga koristi (bez obzira na NODE_ENV)
 */
function resolveTo(originalTo: string): string {
  console.log('🔵 [resolveTo] Called with:', originalTo)
  console.log('🔵 [resolveTo] TO_OVERRIDE value:', TO_OVERRIDE || 'UNDEFINED')
  
  // ✅ POJEDNOSTAVLJENO - ako postoji TO_OVERRIDE, koristi ga
  if (TO_OVERRIDE) {
    console.log(`✅ [resolveTo] OVERRIDING: ${originalTo} → ${TO_OVERRIDE}`)
    return TO_OVERRIDE
  }
  
  console.log(`⚠ [resolveTo] NO OVERRIDE! Returning original: ${originalTo}`)
  return originalTo
}

/**
 * Email template za verifikaciju naloga
 */
function getVerificationEmailHTML(verificationUrl: string, email: string) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verifikujte vaš ELAB AI nalog</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background-color: #f9fafb;
            border-radius: 8px;
            padding: 30px;
            border: 1px solid #e5e7eb;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
          }
          .content {
            background-color: white;
            padding: 30px;
            border-radius: 6px;
            margin-bottom: 20px;
          }
          .button {
            display: inline-block;
            background-color: #2563eb;
            color: white;
            text-decoration: none;
            padding: 12px 30px;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
          }
          .button:hover {
            background-color: #1d4ed8;
          }
          .footer {
            text-align: center;
            color: #6b7280;
            font-size: 14px;
            margin-top: 20px;
          }
          .code {
            background-color: #f3f4f6;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: monospace;
            font-size: 14px;
          }
          .warning {
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 12px;
            margin: 20px 0;
            border-radius: 4px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🤖 ELAB AI Assistant</div>
            <p style="color: #6b7280; margin: 0;">Fakultet organizacionih nauka</p>
          </div>

          <div class="content">
            <h2 style="color: #111827; margin-top: 0;">Dobrodošli na ELAB AI platformu!</h2>
            
            <p>Pozdrav,</p>
            
            <p>
              Hvala što ste se registrovali na <strong>ELAB AI Assistant</strong> platformu.
              Da biste aktivirali vaš nalog (<span class="code">${email}</span>), molimo vas da
              kliknete na dugme ispod:
            </p>

            <div style="text-align: center;">
              <a href="${verificationUrl}" class="button">
                ✅ Verifikuj nalog
              </a>
            </div>

            <p style="color: #6b7280; font-size: 14px;">
              Ili kopirajte i nalepite sledeći link u vaš browser:
            </p>
            <p style="word-break: break-all; color: #2563eb; font-size: 14px;">
              ${verificationUrl}
            </p>

            <div class="warning">
              <strong>⏰ Važno:</strong> Ovaj link ističe za <strong>24 sata</strong>.
              Ako ne verifikujete nalog u tom periodu, moraćete se ponovo registrovati.
            </div>

            <p>
              Nakon verifikacije, moći ćete da:
            </p>
            <ul>
              <li>Postavljate neograničen broj pitanja AI asistentu</li>
              <li>Čuvate istoriju konverzacija</li>
              <li>Ocenjujete kvalitet odgovora</li>
              <li>Pretražujete ELAB dokumentaciju</li>
            </ul>
          </div>

          <div class="footer">
            <p>
              Ako niste kreirali nalog na ELAB AI platformi, možete ignorisati ovaj email.
            </p>
            <p style="margin-top: 20px;">
              <strong>ELAB AI Assistant</strong><br>
              Fakultet organizacionih nauka<br>
              Beograd, Srbija
            </p>
          </div>
        </div>
      </body>
    </html>
  `
}

/**
 * Plain text verzija email-a (fallback)
 */
function getVerificationEmailText(verificationUrl: string, email: string) {
  return `
Dobrodošli na ELAB AI Assistant platformu!

Hvala što ste se registrovali. Da biste aktivirali vaš nalog (${email}), molimo vas da posetite sledeći link:

${verificationUrl}

Ovaj link ističe za 24 sata.

Nakon verifikacije, moći ćete da koristite sve funkcionalnosti platforme.

Ako niste kreirali nalog, možete ignorisati ovaj email.

---
ELAB AI Assistant
Fakultet organizacionih nauka
  `.trim()
}

/**
 * Šalje verifikacioni email korisniku
 */
export async function sendVerificationEmail(
  email: string,
  verificationToken: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📧 [sendVerificationEmail] FUNCTION CALLED')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📍 Original email:', email)
    console.log('📍 Token:', verificationToken.substring(0, 10) + '...')
    console.log('📍 Current env vars:', {
      RESEND_API_KEY: process.env.RESEND_API_KEY ? '✅ SET' : '❌ MISSING',
      EMAIL_FROM: process.env.EMAIL_FROM,
      EMAIL_TO_OVERRIDE: process.env.EMAIL_TO_OVERRIDE || '❌ NOT SET',
      APP_URL: process.env.APP_URL,
      NODE_ENV: process.env.NODE_ENV,
    })
    
    const verificationUrl = `${APP_URL}/api/auth/verify?token=${verificationToken}`
    console.log('📍 Verification URL:', verificationUrl)

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🔄 Calling resolveTo()...')
    const actualRecipient = resolveTo(email)
    console.log('✅ resolveTo() returned:', actualRecipient)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    console.log('📤 Preparing to send email with:')
    console.log('   FROM:', FROM_EMAIL)
    console.log('   TO:', actualRecipient)
    console.log('   SUBJECT: ✅ Verifikujte vaš ELAB AI nalog')

    console.log('🚀 Calling Resend API...')
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: actualRecipient,
      subject: '✅ Verifikujte vaš ELAB AI nalog',
      html: getVerificationEmailHTML(verificationUrl, email),
      text: getVerificationEmailText(verificationUrl, email),
    })

    if (error) {
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.error('❌ [RESEND ERROR]')
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.error(JSON.stringify(error, null, 2))
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      return { success: false, error: error.message }
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✅ EMAIL SENT SUCCESSFULLY!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📬 Email ID:', data?.id)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    return { success: true }
  } catch (error: any) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.error('❌ FATAL ERROR in sendVerificationEmail')
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.error(error)
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    return { success: false, error: error.message || 'Unknown error' }
  }
}

export async function sendPasswordResetEmail(
  email: string,
  resetToken: string
): Promise<{ success: boolean; error?: string }> {
  return { success: false, error: 'Not implemented yet' }
}

export async function sendRoleChangeEmail(
  email: string,
  newRole: string
): Promise<{ success: boolean; error?: string }> {
  return { success: false, error: 'Not implemented yet' }
}