// src/lib/validations/auth.ts

import { z } from 'zod'

export const registerSchema = z.object({
  email: z
    .string()
    .email('Neispravna email adresa')
    .refine(
      (email) => email.endsWith('@fon.bg.ac.rs'),
      'Morate koristiti FON email adresu (@fon.bg.ac.rs)'
    ),
  password: z
    .string()
    .min(8, 'Lozinka mora imati najmanje 8 karaktera')
    .regex(/[A-Z]/, 'Lozinka mora sadržati bar jedno veliko slovo')
    .regex(/[a-z]/, 'Lozinka mora sadržati bar jedno malo slovo')
    .regex(/[0-9]/, 'Lozinka mora sadržati bar jedan broj')
    .regex(/[^A-Za-z0-9]/, 'Lozinka mora sadržati bar jedan specijalni karakter'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Lozinke se ne poklapaju',
  path: ['confirmPassword'],
})

export const loginSchema = z.object({
  email: z.string().email('Neispravna email adresa'),
  password: z.string().min(1, 'Lozinka je obavezna'),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>