// src/lib/email.ts

import { Resend } from 'resend'

// Inicijalizuj Resend klijenta
const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_EMAIL = process.env.EMAIL_FROM || 'ELAB AI Assistant <onboarding@resend.dev>'
const APP_URL = process.env.APP_URL || 'http://localhost:3000'
const TO_OVERRIDE = process.env.EMAIL_TO_OVERRIDE

/**
 * Helper funkcija za testiranje sa Resend free tier-om
 * U development režimu (ili kada je eksplicitno setovan EMAIL_TO_OVERRIDE),
 * svi mejlovi se šalju na override adresu umesto na pravu adresu korisnika.
 * 
 * Ovo omogućava testiranje bez potrebe za verifikacijom svakog email-a u Resend-u.
 */
function resolveTo(originalTo: string): string {
  // Proveri da li treba koristiti override
  const shouldOverride = TO_OVERRIDE && process.env.NODE_ENV !== 'production'
  
  if (shouldOverride) {
    console.log(`📧 [EMAIL OVERRIDE] Original: ${originalTo} → Override: ${TO_OVERRIDE}`)
    return TO_OVERRIDE
  }
  
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
    const verificationUrl = `${APP_URL}/api/auth/verify?token=${verificationToken}`

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: resolveTo(email), // 🔄 Koristi override u development-u
      subject: '✅ Verifikujte vaš ELAB AI nalog',
      html: getVerificationEmailHTML(verificationUrl, email),
      text: getVerificationEmailText(verificationUrl, email),
    })

    if (error) {
      console.error('❌ Resend API error:', error)
      return { success: false, error: error.message }
    }

    console.log('✅ Verification email sent:', data?.id)
    return { success: true }
  } catch (error: any) {
    console.error('❌ Failed to send verification email:', error)
    return { success: false, error: error.message || 'Unknown error' }
  }
}

/**
 * Email template za reset lozinke (za budućnost)
 */
export async function sendPasswordResetEmail(
  email: string,
  resetToken: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const resetUrl = `${APP_URL}/reset-password?token=${resetToken}`

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: resolveTo(email), // 🔄 Koristi override u development-u
      subject: '🔐 Reset lozinke - ELAB AI Assistant',
      html: `
        <h2>Reset lozinke</h2>
        <p>Primili smo zahtev za reset lozinke za vaš nalog.</p>
        <p>Kliknite na link ispod da resetujete lozinku:</p>
        <a href="${resetUrl}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
          Reset lozinke
        </a>
        <p>Link ističe za 1 sat.</p>
        <p>Ako niste tražili reset lozinke, ignorišite ovaj email.</p>
      `,
      text: `Reset lozinke\n\nKliknite na link: ${resetUrl}\n\nLink ističe za 1 sat.`,
    })

    if (error) {
      console.error('❌ Resend API error:', error)
      return { success: false, error: error.message }
    }

    console.log('✅ Password reset email sent:', data?.id)
    return { success: true }
  } catch (error: any) {
    console.error('❌ Failed to send password reset email:', error)
    return { success: false, error: error.message || 'Unknown error' }
  }
}

/**
 * Email notifikacija za promenu uloge (za administratore)
 */
export async function sendRoleChangeEmail(
  email: string,
  newRole: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: resolveTo(email), // 🔄 Koristi override u development-u
      subject: '🔔 Promena uloge na ELAB AI platformi',
      html: `
        <h2>Promena uloge</h2>
        <p>Vaša uloga na ELAB AI platformi je promenjena.</p>
        <p><strong>Nova uloga:</strong> ${newRole}</p>
        <p>Prijavite se ponovo da biste videli nove privilegije.</p>
        <a href="${APP_URL}/login" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
          Prijavi se
        </a>
      `,
      text: `Promena uloge\n\nVaša nova uloga: ${newRole}\n\nPrijavite se: ${APP_URL}/login`,
    })

    if (error) {
      console.error('❌ Resend API error:', error)
      return { success: false, error: error.message }
    }

    console.log('✅ Role change email sent:', data?.id)
    return { success: true }
  } catch (error: any) {
    console.error('❌ Failed to send role change email:', error)
    return { success: false, error: error.message || 'Unknown error' }
  }
}