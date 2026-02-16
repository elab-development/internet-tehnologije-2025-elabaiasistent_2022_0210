# 🛡️ Security Architecture | ELAB AI Assistant

Pregled implementiranih bezbednosnih mera i protokola za zaštitu sistema i korisničkih podataka.

---

## 1. Upravljanje Saobraćajem (Rate Limiting)

| Endpoint | Limit | Svrha |
| :--- | :--- | :--- |
| **Login** | 5 pokušaja / 15 min | Brute Force zaštita |
| **Auth API** | 100 zahteva / min | Sprečavanje zloupotrebe |
| **Guest API** | 10 zahteva / min | DDoS mitigacija |
| **Registracija** | 3 naloga / 24h (po IP) | Anti-spam mera |

---

## 2. Zaštita Podataka i API-ja

### 🔒 Pristup i Integritet
* **CORS:** Dozvoljeni isključivo konfigurisani domeni uz restriktivne metode (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`).
* **CSRF:** Implementirana `NextAuth` zaštita uz **SameSite** cookie politiku i validaciju origin zaglavlja.
* **SQL Injection:** Potpuna prevencija korišćenjem **Prisma ORM** (parametrizovani upiti) i **Zod** šema za strogu validaciju inputa.

### 🛡️ XSS & Input Sanitization
* **DOMPurify:** Automatsko čišćenje HTML-a iz korisničkog unosa.
* **Pattern Detection:** Detekcija i blokiranje pokušaja JavaScript injekcije.
* **Escaping:** Specijalni karakteri se automatski escape-uju pre renderovanja.

---

## 3. Security Headers (HTTP)

Sistem implementira stroge sigurnosne polise kroz HTTP zaglavlja:

```http
X-XSS-Protection: 1; mode=block
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: upgrade-insecure-requests; frame-ancestors 'none';
Permissions-Policy: geolocation=(), microphone=(), camera=()