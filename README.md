# Rare Scents – Onlineshop für Parfüms und Abfüllungen

Vollständiger, produktionsfähiger Shop mit echtem Bestellprozess: Stripe-Zahlungen,
verifizierten Webhooks, Lagerverwaltung mit Reservierung, Transaktions-E-Mails und
geschütztem Admin-Dashboard.

**Technologie:** Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · PostgreSQL ·
Prisma 7 · Stripe · Resend · Auth.js v5 · Cloudinary · Vitest

---

## Inhalt

1. [Wichtige Hinweise vor dem Livegang](#1-wichtige-hinweise-vor-dem-livegang)
2. [Projektstruktur](#2-projektstruktur)
3. [Lokale Installation](#3-lokale-installation)
4. [PostgreSQL einrichten](#4-postgresql-einrichten)
5. [Stripe einrichten](#5-stripe-einrichten)
6. [Resend einrichten](#6-resend-einrichten)
7. [Cloudinary einrichten](#7-cloudinary-einrichten)
8. [Deployment auf Vercel](#8-deployment-auf-vercel)
9. [Wie der Bestellprozess funktioniert](#9-wie-der-bestellprozess-funktioniert)
10. [Sicherheitskonzept](#10-sicherheitskonzept)
11. [Admin-Dashboard](#11-admin-dashboard)
12. [Tests](#12-tests)
13. [Checkliste vor dem Livegang](#13-checkliste-vor-dem-livegang)
14. [Wartung und Fehlersuche](#14-wartung-und-fehlersuche)

---

## 1. Wichtige Hinweise vor dem Livegang

> **Die mitgelieferten Rechtstexte sind Platzhalter und nicht rechtssicher.**
> Impressum, Datenschutzerklärung, AGB, Widerrufsbelehrung sowie alle
> Produktangaben, Markennennungen, Duftvergleiche und Kennzeichnungspflichten
> müssen vor der Veröffentlichung von einer fachkundigen Person geprüft und an
> euer Unternehmen angepasst werden. Das betrifft insbesondere die
> Kosmetikverordnung, die Preisangabenverordnung, das Fernabsatzrecht und das
> Datenschutzrecht.

Weitere Punkte, die zwingend zu erledigen sind:

- **Firmendaten eintragen:** `src/config/site.ts` enthält Platzhalter (Firmenname,
  Adresse, UID, MwSt-Nummer, beide Geschäftspartner). Sie werden direkt in
  Impressum, Rechnungen und E-Mails verwendet.
- **Demo-Produkte entfernen:** Die sechs Seed-Produkte sind erfundene Demo-Inhalte
  mit selbst gezeichneten Abbildungen (`isDemo: true`). Vor dem Livegang durch
  eigene Produkte und eigene Fotos ersetzen.
- **Duftalternativen korrekt kennzeichnen:** Produkte, die keine Originalware
  sind, müssen das Feld „Duftalternative“ gesetzt haben. Verwendet keine
  geschützten Markenlogos, Markennamen im Produktnamen oder fremden
  Produktbilder ohne Genehmigung. Die Formulierung „Duftalternative“ bzw.
  „inspiriert von einer Duftrichtung“ ist bereits im System vorgesehen.
- **Steuersatz prüfen:** `SHOP_TAX_RATE_BP` ist auf 810 (8,1 % Schweiz)
  voreingestellt. Für Deutschland 1900, für Österreich 2000, bei
  Kleinunternehmerregelung 0.
- **Währung:** Der Shop rechnet in EUR (Vorgabe). Bei Sitz in der Schweiz ist zu
  prüfen, ob CHF sinnvoller ist – dann `siteConfig.currency`, die Stripe-Währung
  und die Preise anpassen.

---

## 2. Projektstruktur

```
rare/
├── prisma/
│   ├── schema.prisma              Datenbankschema (alle Modelle)
│   ├── migrations/                Versionierte SQL-Migrationen
│   └── seed.ts                    Demo-Produkte, Kategorien, Rabattcodes, Admin
├── prisma.config.ts               Prisma-7-Konfiguration (Verbindung für die CLI)
├── scripts/
│   ├── create-admin.ts            Adminkonto anlegen / Passwort zurücksetzen
│   └── generate-placeholders.mjs  Erzeugt die Demo-Abbildungen als SVG
├── public/produkte/               Demo-Bilder (vor Livegang ersetzen)
├── tests/
│   ├── availability.test.ts       Verfügbarkeits- und Lieferzeitlogik
│   ├── money.test.ts              Geldrechnung, Rabatte, Versandkosten
│   ├── orders.test.ts             Bestellung, Lager, Idempotenz (mit Datenbank)
│   └── setup.ts                   Testumgebung
├── src/
│   ├── proxy.ts                   Zugriffsschutz für /admin (früher middleware)
│   ├── config/
│   │   ├── site.ts                Firmendaten, Steuersatz, Grundeinstellungen
│   │   └── cookies.ts             Cookie-Verzeichnis und Consent-Konfiguration
│   ├── lib/
│   │   ├── prisma.ts              Datenbankclient (Lazy, mit Treiber-Adapter)
│   │   ├── money.ts               Cent-Rechnung, MwSt., Grundpreis
│   │   ├── availability.ts        Verfügbarkeitsregeln (5 Zustände)
│   │   ├── shipping.ts            Versandarten, Kosten, Lieferländer
│   │   ├── pricing.ts             Serverseitige Warenkorbberechnung
│   │   ├── orders.ts              Bestellung, Reservierung, Lagerbuchung
│   │   ├── discount.ts            Rabattcodes prüfen und anwenden
│   │   ├── products.ts            Katalogabfragen mit Filtern
│   │   ├── catalog.ts             Konstanten (auch für Client Components)
│   │   ├── validation.ts          Zod-Schemata für alle Eingaben
│   │   ├── auth.ts / auth.config.ts / auth-guard.ts   Admin-Authentifizierung
│   │   ├── stripe.ts              Stripe-Client (nur serverseitig)
│   │   ├── cloudinary.ts          Signierter Direkt-Upload
│   │   ├── email.ts               Versand über Resend
│   │   ├── rate-limit.ts          Rate-Limiting (Speicher oder Redis)
│   │   └── utils.ts               Bestellnummern, IP-Hashing, Formatierung
│   ├── emails/
│   │   ├── layout.ts              E-Mail-Grundlayout in Schwarz/Gold/Creme
│   │   └── templates.ts           8 Vorlagen (Bestätigung, Versand, …)
│   ├── components/                UI, Warenkorb, Produkt, Checkout, Admin
│   └── app/
│       ├── layout.tsx             Wurzel-Layout (Schriften, Grundstile)
│       ├── globals.css            Designsystem
│       ├── error.tsx              Auffangseite für Fehler
│       ├── not-found.tsx          Eigene 404-Seite
│       ├── sitemap.ts             Sitemap
│       ├── robots.ts              robots.txt
│       ├── (shop)/                Kundenbereich
│       │   ├── layout.tsx         Kopf-/Fussbereich, Cookie-Hinweis
│       │   ├── page.tsx           Startseite
│       │   ├── shop/              Shopseite mit Filtern
│       │   ├── produkt/[slug]/    Produktdetailseite
│       │   ├── warenkorb/         Warenkorb
│       │   ├── kasse/             Checkout
│       │   ├── bestellung/        Bestellbestätigung und -verfolgung
│       │   ├── newsletter/        Newsletter-Anmeldung
│       │   └── impressum, datenschutz, agb, widerruf, versand,
│       │       rueckgabe, kontakt, faq, cookie-einstellungen
│       ├── admin/
│       │   ├── layout.tsx         Adminrahmen
│       │   ├── anmelden/          Anmeldeseite (ungeschützt)
│       │   ├── actions.ts         Server Actions (alle mit Rechteprüfung)
│       │   └── (geschuetzt)/      Dashboard, Produkte, Bestellungen,
│       │                          Lager, Kategorien, Rabattcodes
│       └── api/
│           ├── warenkorb/         Serverseitige Warenkorbberechnung
│           ├── checkout/          Bestellung anlegen + Stripe-Session
│           ├── webhooks/stripe/   Verifizierter Webhook (Idempotenz)
│           ├── newsletter/        Anmeldung + Double-Opt-in
│           ├── benachrichtigung/  „Wieder verfügbar“-Vormerkung
│           ├── kontakt/           Kontaktformular
│           ├── cron/              Abgelaufene Reservierungen freigeben
│           ├── admin/             Cloudinary-Signatur
│           └── auth/              Auth.js
├── .env.example                   Alle Umgebungsvariablen mit Erklärung
├── next.config.ts                 Sicherheitsheader, Bildoptimierung
└── vercel.json                    Cron-Job und Region
```

---

## 3. Lokale Installation

### Voraussetzungen

- Node.js 20 oder neuer (getestet mit Node 22)
- PostgreSQL 14 oder neuer (lokal oder als Cloud-Datenbank)
- npm

### Schritt für Schritt

```bash
# 1. Abhängigkeiten installieren
npm install

# 2. Umgebungsvariablen anlegen
cp .env.example .env

# 3. In der .env mindestens DATABASE_URL, DIRECT_URL und AUTH_SECRET setzen.
#    Ein sicheres AUTH_SECRET erzeugen:
openssl rand -base64 32

# 4. Datenbankschema anlegen
npm run db:migrate

# 5. Demo-Daten einspielen (6 Produkte, Kategorien, Rabattcodes, Adminkonto)
npm run db:seed

# 6. Entwicklungsserver starten
npm run dev
```

Der Shop läuft anschliessend unter <http://localhost:3000>,
das Dashboard unter <http://localhost:3000/admin>.

**Zugangsdaten aus dem Seed:**
`admin@rare-scents.local` / `AendereMich2026!` – bitte sofort ändern:

```bash
npm run admin:create -- --email deine@adresse.ch --name "Vorname Nachname"
```

### Ohne externe Dienste starten

Der Shop startet auch ohne Stripe-, Resend- und Cloudinary-Schlüssel:

| Fehlender Dienst | Auswirkung |
| --- | --- |
| Stripe | Checkout meldet „Bezahlung derzeit nicht verfügbar“ (503). Alles andere funktioniert. |
| Resend | E-Mails werden nicht versendet, sondern nur in der Konsole protokolliert. |
| Cloudinary | Datei-Upload deaktiviert; Bild-URLs lassen sich weiterhin manuell eintragen. |

Das Dashboard zeigt oben an, welche Dienste noch fehlen.

### Alle Befehle

| Befehl | Zweck |
| --- | --- |
| `npm run dev` | Entwicklungsserver |
| `npm run build` | Produktionsbuild (inkl. `prisma generate`) |
| `npm start` | Produktionsserver |
| `npm run typecheck` | TypeScript prüfen |
| `npm run test` | Alle Tests |
| `npm run db:migrate` | Migration erstellen und anwenden |
| `npm run db:deploy` | Migrationen anwenden (Produktion) |
| `npm run db:seed` | Demo-Daten einspielen |
| `npm run db:studio` | Datenbank im Browser ansehen |
| `npm run admin:create` | Adminkonto anlegen / Passwort zurücksetzen |

---

## 4. PostgreSQL einrichten

### Variante A: Supabase (empfohlen)

1. Projekt auf <https://supabase.com> anlegen, Region Frankfurt (`eu-central-1`).
2. **Project Settings → Database → Connection string → URI**.
3. In die `.env` eintragen:

```bash
# Gepoolt (Port 6543) – für die Laufzeit
DATABASE_URL="postgresql://postgres.PROJEKT:PASSWORT@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Direkt (Port 5432) – nur für Migrationen
DIRECT_URL="postgresql://postgres.PROJEKT:PASSWORT@aws-0-eu-central-1.pooler.supabase.com:5432/postgres"
```

### Variante B: Neon

1. Projekt auf <https://neon.tech> anlegen, Region Frankfurt.
2. `DATABASE_URL` = gepoolte Verbindung (Host enthält `-pooler`).
3. `DIRECT_URL` = direkte Verbindung (ohne `-pooler`).

### Variante C: Lokal

```bash
sudo -u postgres psql -c "CREATE DATABASE rarescents;"
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgres';"
```

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/rarescents?schema=public"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/rarescents?schema=public"
```

> **Hinweis zu Prisma 7:** Die Verbindungsdaten stehen nicht mehr in
> `schema.prisma`, sondern in `prisma.config.ts`. Zur Laufzeit verbindet sich der
> Client über den Treiber-Adapter in `src/lib/prisma.ts`.

---

## 5. Stripe einrichten

### 5.1 Konto und Schlüssel

1. Konto auf <https://dashboard.stripe.com> anlegen.
2. **Entwickler → API-Schlüssel**:
   - „Veröffentlichbarer Schlüssel“ → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - „Geheimer Schlüssel“ → `STRIPE_SECRET_KEY` (**niemals ins Frontend!**)
3. Zum Testen den Testmodus verwenden (`sk_test_…`, `pk_test_…`).

### 5.2 Webhook einrichten (zwingend erforderlich)

Ohne funktionierenden Webhook wird **keine Bestellung als bezahlt markiert**,
kein Lagerbestand abgebucht und keine E-Mail versendet.

**Für die Produktion:**

1. **Entwickler → Webhooks → Endpunkt hinzufügen**
2. URL: `https://deine-domain.ch/api/webhooks/stripe`
3. Diese Ereignisse auswählen:
   - `checkout.session.completed`
   - `checkout.session.async_payment_succeeded`
   - `checkout.session.async_payment_failed`
   - `checkout.session.expired`
   - `payment_intent.payment_failed`
   - `charge.refunded`
4. Das angezeigte Signaturgeheimnis (`whsec_…`) als `STRIPE_WEBHOOK_SECRET`
   hinterlegen.

**Lokal testen:**

```bash
# Stripe CLI installieren: https://stripe.com/docs/stripe-cli
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe
# Das ausgegebene whsec_... in die .env eintragen und den Dev-Server neu starten.

# In einem zweiten Terminal ein Ereignis auslösen:
stripe trigger checkout.session.completed
```

**Testkarten:**

| Karte | Ergebnis |
| --- | --- |
| `4242 4242 4242 4242` | Zahlung erfolgreich |
| `4000 0000 0000 9995` | Zahlung abgelehnt (unzureichende Deckung) |
| `4000 0025 0000 3155` | 3-D-Secure-Bestätigung erforderlich |

Beliebiges künftiges Ablaufdatum, beliebige dreistellige Prüfziffer.

### 5.3 Apple Pay und Google Pay

Beide werden von Stripe Checkout automatisch angeboten, sobald das Gerät sie
unterstützt. Voraussetzung: Unter **Einstellungen → Zahlungsmethoden →
Apple Pay** muss die Live-Domain registriert sein.

### 5.4 PayPal (optional)

1. In Stripe unter **Einstellungen → Zahlungsmethoden** PayPal aktivieren.
2. `STRIPE_ENABLE_PAYPAL="true"` setzen.

---

## 6. Resend einrichten

1. Konto auf <https://resend.com> anlegen.
2. **Domains → Add Domain**, eigene Domain eintragen.
3. Die angezeigten DNS-Einträge (SPF, DKIM, ggf. DMARC) beim Domain-Anbieter
   hinterlegen und die Verifizierung abwarten.
4. **API Keys → Create API Key** → `RESEND_API_KEY`.
5. Absender und interne Adresse setzen:

```bash
EMAIL_FROM="Rare Scents <bestellungen@deine-domain.ch>"
SHOP_NOTIFICATION_EMAIL="bestellungen@deine-domain.ch"
```

> Ohne verifizierte Domain lehnt Resend den Versand an fremde Adressen ab.

**Enthaltene Vorlagen** (alle in Schwarz, Gold und Cremeweiss):

| Vorlage | Auslöser |
| --- | --- |
| Bestellbestätigung | Webhook bestätigt die Zahlung |
| Interne Benachrichtigung | gleichzeitig an die Geschäftsadresse |
| Zahlung fehlgeschlagen | `payment_intent.payment_failed` |
| Bestellung storniert | Storno im Dashboard |
| Versandbestätigung | Sendungsnummer im Dashboard erfasst |
| Rückerstattung | `charge.refunded` oder Dashboard |
| Wieder verfügbar | Bestand wird wieder eingebucht |
| Newsletter-Bestätigung | Anmeldung (Double-Opt-in) |

---

## 7. Cloudinary einrichten

1. Konto auf <https://cloudinary.com> anlegen.
2. Im Dashboard **Cloud Name**, **API Key** und **API Secret** ablesen.
3. In die `.env` eintragen:

```bash
CLOUDINARY_CLOUD_NAME="dein-cloud-name"
CLOUDINARY_API_KEY="123456789012345"
CLOUDINARY_API_SECRET="dein-api-secret"
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="dein-cloud-name"
CLOUDINARY_UPLOAD_FOLDER="rare-scents/produkte"
```

**Wie der Upload abläuft:** Der Browser fordert unter
`/api/admin/cloudinary-signatur` eine Signatur an (nur für angemeldete
Administratoren). Mit dieser Signatur lädt er die Datei direkt zu Cloudinary
hoch. Das API-Secret verlässt den Server dabei nie.

**Bildempfehlung:** Hochformat 4:5, mindestens 1200 px Breite, JPG oder WebP.
Ausgeliefert wird automatisch mit `f_auto,q_auto` (AVIF/WebP je nach Browser).

---

## 8. Deployment auf Vercel

### 8.1 Vorbereitung

```bash
git add .
git commit -m "Shop einrichten"
git push
```

### 8.2 Projekt anlegen

1. Auf <https://vercel.com> **Add New → Project** und das Repository auswählen.
2. Framework wird automatisch als Next.js erkannt.
3. Build Command: `npm run build` (Standard, führt `prisma generate` mit aus).

### 8.3 Umgebungsvariablen

Unter **Settings → Environment Variables** alle Werte aus `.env.example`
eintragen (Production **und** Preview):

```
DATABASE_URL, DIRECT_URL
AUTH_SECRET, AUTH_URL, AUTH_TRUST_HOST, NEXT_PUBLIC_SITE_URL
STRIPE_SECRET_KEY, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET
RESEND_API_KEY, EMAIL_FROM, SHOP_NOTIFICATION_EMAIL
CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET,
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_FOLDER
SHOP_TAX_RATE_BP, SHOP_PRICES_INCLUDE_TAX
CRON_SECRET
```

`NEXT_PUBLIC_SITE_URL` und `AUTH_URL` müssen exakt der Live-Domain entsprechen
(mit `https://`, ohne abschliessenden Schrägstrich).

### 8.4 Datenbank migrieren

```bash
npm i -g vercel
vercel env pull .env.production.local
npx dotenv -e .env.production.local -- npx prisma migrate deploy
```

Alternativ das Build Command auf `prisma migrate deploy && npm run build` setzen.

### 8.5 Nach dem ersten Deployment

1. **Adminkonto anlegen** (gegen die Produktionsdatenbank):

   ```bash
   npx dotenv -e .env.production.local -- npm run admin:create -- \
     --email chef@deine-domain.ch --name "Vorname Nachname"
   ```

2. **Stripe-Webhook** auf die Live-URL umstellen und das neue `whsec_…`
   hinterlegen (Abschnitt 5.2).
3. **Apple Pay**: Live-Domain in Stripe registrieren.
4. **Cron-Job prüfen:** `vercel.json` legt einen Job an, der alle 15 Minuten
   abgelaufene Reservierungen freigibt. Vercel sendet dabei automatisch das
   `CRON_SECRET` als Bearer-Token – die Variable muss gesetzt sein.

### 8.6 Eigene Domain

**Settings → Domains** → Domain hinzufügen und die angezeigten DNS-Einträge
setzen. Danach `NEXT_PUBLIC_SITE_URL` und `AUTH_URL` anpassen und neu deployen.

---

## 9. Wie der Bestellprozess funktioniert

```
Kunde legt in den Warenkorb
        │  (Browser speichert nur Varianten-ID + Menge, niemals Preise)
        ▼
POST /api/warenkorb ──────────► Server lädt Preise aus der Datenbank,
                                prüft Verfügbarkeit, rechnet Summen
        ▼
Kunde klickt „Zahlungspflichtig bestellen"
        ▼
POST /api/checkout
   1. Zod-Validierung aller Eingaben
   2. Warenkorb wird SERVERSEITIG neu berechnet
   3. Bestellung anlegen, Status „Zahlung ausstehend"
   4. Bestand RESERVIEREN (atomar, siehe unten)
   5. Stripe-Checkout-Session mit den Serverbeträgen
        ▼
Kunde bezahlt bei Stripe (Karte, Apple Pay, Google Pay, ggf. PayPal)
        ▼
Stripe ruft POST /api/webhooks/stripe auf
   1. Signatur gegen STRIPE_WEBHOOK_SECRET prüfen  ← ohne gültige Signatur: Abbruch
   2. Ereignis-ID in WebhookEvent speichern        ← doppelte Zustellung wird erkannt
   3. Bestellung auf „Bezahlt" setzen
   4. Bestand endgültig abbuchen, Reservierung auflösen
   5. Rabattcode als eingelöst zählen
   6. Bestätigungsmail an Kunde + interne Benachrichtigung
        ▼
Bestätigungsseite zeigt den bestätigten Status
```

### Kein Überverkauf

Die Reservierung erfolgt mit einem einzigen SQL-Befehl, dessen Bedingung den
Bestand mitprüft:

```sql
UPDATE "ProductVariant"
SET "reservedStock" = "reservedStock" + $qty
WHERE "id" = $id AND "stock" - "reservedStock" >= $qty
```

Betrifft das UPDATE keine Zeile, war nicht genug Ware da – die gesamte
Transaktion wird zurückgerollt, es entsteht keine halbfertige Bestellung.
Datenbankseitig ist damit ausgeschlossen, dass zwei gleichzeitige Bestellungen
dieselbe letzte Flasche erhalten. Der Test
`tests/orders.test.ts → "verhindert Überverkauf bei gleichzeitigen Bestellungen"`
prüft genau das mit vier parallelen Bestellungen.

### Idempotenz

- Jedes Stripe-Ereignis wird über `WebhookEvent.eventId` (unique) genau einmal
  angenommen. Eine zweite Zustellung antwortet sofort mit `duplicate: true`.
- Zusätzlich schützt das Feld `Order.stockCommitted`: Die Bestandsbuchung wird
  über ein bedingtes `UPDATE ... WHERE stockCommitted = false` beansprucht. Selbst
  wenn zwei Webhooks gleichzeitig ankommen, bucht nur einer ab.
- Bestätigungsmails sind über `Order.confirmationEmailSentAt` abgesichert.

### Abgebrochene Zahlungen

- Bricht der Kunde ab, läuft die Stripe-Session nach einer Stunde ab
  (`checkout.session.expired`) → Reservierung wird freigegeben.
- Zusätzlich gibt der Cron-Job alle 15 Minuten Reservierungen frei, deren
  `reservationExpiresAt` verstrichen ist. So bleibt keine Ware dauerhaft blockiert.

### Vorbestellungen

Vorbestellte Positionen reservieren ohne Bestandsprüfung. Nach der Zahlung wird
der Bestand abgebucht und darf negativ werden – der negative Wert ist der offene
Rückstand gegenüber Kunden und wird im Lager als „Offene Vorbestellungen“
ausgewiesen. Beim Wareneingang gleicht sich der Wert automatisch aus.

---

## 10. Sicherheitskonzept

| Bereich | Umsetzung |
| --- | --- |
| Preismanipulation | Der Browser sendet nur Varianten-ID und Menge. Alle Preise, Versandkosten und Rabatte kommen aus der Datenbank (`src/lib/pricing.ts`). |
| Eingabevalidierung | Jede Route und jede Server Action validiert mit Zod (`src/lib/validation.ts`). |
| Zahlungsdaten | Vollständige Kartendaten erreichen den Server nie. Gespeichert werden nur Referenz-IDs sowie Kartenmarke und die letzten vier Ziffern. |
| Webhook | Signaturprüfung gegen `STRIPE_WEBHOOK_SECRET` mit dem Rohtext des Requests. Ohne gültige Signatur: `400`, keine Verarbeitung. |
| Admin-Zugang | Auth.js v5, bcrypt (Kostenfaktor 12), JWT-Sitzung mit 8 Stunden Laufzeit. Doppelte Prüfung: `proxy.ts` **und** `requireAdmin()` in jeder Server Action. |
| Benutzer-Enumeration | Die Anmeldung unterscheidet nicht zwischen unbekanntem Konto und falschem Passwort und hasht auch bei unbekanntem Konto (konstante Antwortzeit). |
| Rate-Limiting | Pro Route und IP (`src/lib/rate-limit.ts`). Ohne Redis prozesslokal, mit `UPSTASH_REDIS_REST_*` verteilt – für Produktion empfohlen. |
| Spam-Schutz | Honeypot-Feld plus Rate-Limit bei Kontaktformular und Newsletter – ohne Captcha und ohne Drittanbieter-Skripte. |
| HTTP-Header | CSP, HSTS, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` in `next.config.ts`. |
| Logging | IP-Adressen werden ausschliesslich als Hash gespeichert. Fehlerprotokolle enthalten keine Kundendaten. |
| Fehlermeldungen | Nach aussen bewusst allgemein gehalten; Details nur im Serverprotokoll. |
| Geheimnisse | Nur Variablen mit `NEXT_PUBLIC_`-Präfix erreichen den Browser. `src/lib/stripe.ts` und `src/lib/cloudinary.ts` werden nie in Client Components importiert. |
| Bestellstatus-Link | Zufälliges Token statt fortlaufender ID – Bestellungen anderer Kunden lassen sich nicht erraten. |

---

## 11. Admin-Dashboard

Erreichbar unter `/admin`, Anmeldung unter `/admin/anmelden`.

| Bereich | Funktionen |
| --- | --- |
| **Übersicht** | Monatsumsatz, offene Bestellungen, Lagerwarnungen, Einrichtungsstatus der Dienste |
| **Bestellungen** | Suche (Nummer, Name, E-Mail, SKU), Statusfilter, Detailansicht mit Positionen, Kundendaten, Zahlungsstatus, Lagerbuchungen |
| **Bestelldetail** | Status ändern, Sendungsnummer erfassen, Versandbestätigung senden, Bestätigungsmail erneut senden, Kundenansicht öffnen |
| **Produkte** | Anlegen, bearbeiten, verstecken, löschen; Beschreibungen, Duftnoten, Pflichtangaben, Kategorien, SEO-Felder, Kennzeichnung als Duftalternative |
| **Größen** | Je Größe: SKU, Volumen, Preis, Streichpreis, Bestand, Warnschwelle, Vorbestellung, Wiederverfügbarkeitsdatum, Lieferzeit |
| **Bilder** | Direkt-Upload zu Cloudinary oder URL eintragen, Alternativtext ist Pflicht |
| **Lager** | Bestände je Größe, Reservierungen, Rückstände, direkte Korrektur, vollständiges Lagerjournal |
| **Kategorien** | Zielgruppen und Produktarten verwalten |
| **Rabattcodes** | Prozent, Festbetrag oder Gratisversand; Mindestbestellwert, Höchstzahl an Einlösungen, Zeitraum |

**Bestellstatus:** Zahlung ausstehend · Bezahlt · In Bearbeitung · Versandbereit ·
Versendet · Zugestellt · Storniert · Erstattet

Storno und Erstattung buchen den Lagerbestand automatisch zurück. Die
Geldrückzahlung selbst wird im Stripe-Dashboard ausgelöst; der eingehende
`charge.refunded`-Webhook aktualisiert Bestellung und Lager anschliessend
automatisch.

---

## 12. Tests

```bash
npm run test          # alle Tests
npm run test:watch    # während der Entwicklung
```

71 Tests in drei Dateien:

- **`availability.test.ts`** – alle fünf Verfügbarkeitszustände,
  Reservierungen, Höchstmengen, Lieferzeitberechnung, Werktage.
- **`money.test.ts`** – Cent-Rechnung, enthaltene Mehrwertsteuer, Grundpreis je
  100 ml, Rabattarten und -grenzen, Versandkosten und Gratisversand.
- **`orders.test.ts`** – Integrationstests gegen eine echte Datenbank:
  Reservierung, **Überverkauf bei vier parallelen Bestellungen**,
  **doppelt zugestellter Webhook**, Freigabe, Storno, Erstattung, Vorbestellung
  mit Rückstand, Preis-Schnappschuss in der Bestellung.

Die Integrationstests benötigen eine erreichbare `DATABASE_URL`. Sie legen ein
Testprodukt mit dem Slug `vitest-testduft` an und räumen anschliessend auf.
Bitte **nicht gegen die Produktionsdatenbank** ausführen.

---

## 13. Checkliste vor dem Livegang

### Recht und Inhalte

- [ ] Impressum vollständig: Firmenname, Rechtsform, beide Geschäftspartner, Adresse, UID/Handelsregister, MwSt-Nummer
- [ ] Datenschutzerklärung an tatsächlich eingesetzte Dienste angepasst
- [ ] AGB geprüft, insbesondere Haftung, Gerichtsstand und Zollhinweise
- [ ] Widerrufsbelehrung geprüft, Rücksendekosten eindeutig geregelt
- [ ] Alle Rechtstexte von einer fachkundigen Person freigegeben
- [ ] Duftalternativen korrekt gekennzeichnet, keine geschützten Marken im Produktnamen
- [ ] Keine fremden Produktbilder oder Markenlogos ohne Genehmigung
- [ ] Inhaltsstoffe und Pflichtangaben je Produkt vollständig
- [ ] Grundpreis je 100 ml wird korrekt angezeigt
- [ ] Steuersatz (`SHOP_TAX_RATE_BP`) stimmt mit der steuerlichen Situation überein
- [ ] Demo-Produkte gelöscht, `isDemo` bei echten Produkten nicht gesetzt
- [ ] Demo-Bilder in `public/produkte/` durch eigene Fotos ersetzt

### Technik

- [ ] Alle Umgebungsvariablen auf Vercel gesetzt (Production und Preview)
- [ ] `NEXT_PUBLIC_SITE_URL` und `AUTH_URL` zeigen auf die Live-Domain
- [ ] `AUTH_SECRET` ist zufällig erzeugt und nicht der Beispielwert
- [ ] `npm run build` und `npm run test` laufen fehlerfrei
- [ ] Migrationen auf der Produktionsdatenbank angewendet
- [ ] Seed-Adminkonto gelöscht oder Passwort geändert
- [ ] `CRON_SECRET` gesetzt, Cron-Job in Vercel sichtbar
- [ ] Rate-Limiting über Upstash Redis eingerichtet (bei mehreren Instanzen)

### Zahlungen

- [ ] Stripe vom Test- in den Live-Modus umgestellt, Live-Schlüssel hinterlegt
- [ ] Webhook auf die Live-URL eingerichtet, alle sechs Ereignisse ausgewählt
- [ ] `STRIPE_WEBHOOK_SECRET` ist das Secret des **Live**-Endpunkts
- [ ] Apple-Pay-Domain in Stripe registriert
- [ ] Testbestellung mit echter Karte durchgeführt und erstattet
- [ ] Nach der Testbestellung geprüft: Bestand reduziert, Bestellung im Dashboard, beide E-Mails angekommen

### E-Mails

- [ ] Resend-Domain verifiziert (SPF und DKIM aktiv)
- [ ] Bestellbestätigung, interne Benachrichtigung und Versandbestätigung getestet
- [ ] Absenderadresse ist erreichbar und wird gelesen
- [ ] E-Mails in Gmail, Outlook und Apple Mail geprüft (Darstellung und Spam-Ordner)

### Funktionsprüfung

- [ ] Startseite, Shop, Filter, Suche und Sortierung funktionieren
- [ ] Produkt mit mehreren Größen: Preis, Grundpreis, Bestand und Lieferzeit wechseln korrekt
- [ ] Alle fünf Verfügbarkeitszustände wurden im Shop geprüft
- [ ] Ausverkaufter Artikel lässt sich nicht in den Warenkorb legen
- [ ] Warenkorb: Menge ändern, entfernen, Rabattcode einlösen
- [ ] Hinweis bei unterschiedlichen Lieferzeiten erscheint
- [ ] Checkout mit abweichender Rechnungsadresse
- [ ] Abbruch der Zahlung gibt die Reservierung wieder frei
- [ ] Bestellbestätigungsseite zeigt alle Angaben
- [ ] Adminbereich ist ohne Anmeldung nicht erreichbar
- [ ] Newsletter-Anmeldung inklusive Bestätigungslink getestet
- [ ] Kontaktformular kommt an
- [ ] Eigene 404-Seite erscheint bei ungültigen Adressen

### Darstellung und Zugänglichkeit

- [ ] Smartphone, Tablet und Desktop geprüft
- [ ] Bedienung ausschliesslich mit der Tastatur möglich, Fokus immer sichtbar
- [ ] Alle Produktbilder haben aussagekräftige Alternativtexte
- [ ] Lighthouse: Leistung, Barrierefreiheit, Best Practices und SEO über 90
- [ ] Sitemap unter `/sitemap.xml`, robots.txt unter `/robots.txt` erreichbar
- [ ] Strukturierte Produktdaten im Rich-Results-Test von Google geprüft

---

## 14. Wartung und Fehlersuche

### Bestellung bleibt auf „Zahlung ausstehend“

Fast immer erreicht der Webhook den Server nicht.

1. Stripe-Dashboard → **Entwickler → Webhooks → Endpunkt** öffnen und die
   Antwortcodes der letzten Zustellversuche prüfen.
2. `400` bedeutet fast immer ein falsches `STRIPE_WEBHOOK_SECRET`. Das Secret
   unterscheidet sich zwischen Test- und Live-Modus und ändert sich, wenn der
   Endpunkt neu angelegt wird.
3. Nach der Korrektur in Stripe „Resend“ auf dem fehlgeschlagenen Ereignis
   auslösen – die Bestellung wird dann nachträglich korrekt verarbeitet.

### E-Mails kommen nicht an

- Ist `RESEND_API_KEY` gesetzt? Ohne Schlüssel wird nur in die Konsole geschrieben.
- Ist die Absenderdomain in Resend verifiziert (SPF und DKIM)?
- Im Resend-Dashboard unter „Logs“ die Zustellung prüfen.
- Im Bestelldetail lässt sich die Bestätigungsmail erneut senden.

### Reservierter Bestand wird nicht frei

- Cron-Job in Vercel prüfen (**Settings → Cron Jobs**), `CRON_SECRET` muss gesetzt sein.
- Manuell auslösen:

  ```bash
  curl -X POST https://deine-domain.ch/api/cron/reservierungen \
    -H "Authorization: Bearer $CRON_SECRET"
  ```

- Im Lagerjournal zeigt die Buchung „Freigabe“, dass es funktioniert hat.

### Negativer Bestand

Das ist kein Fehler: Der Wert entspricht der Anzahl bezahlter Vorbestellungen,
die noch geliefert werden müssen. Beim Wareneingang den neuen Gesamtbestand
im Lager eintragen – der Rückstand wird automatisch verrechnet.

### Migration schlägt fehl

`prisma migrate deploy` benötigt `DIRECT_URL` (Verbindung ohne Pooler).
Über die gepoolte Verbindung schlagen Migrationen bei Supabase und Neon fehl.

### Datenbank ansehen

```bash
npm run db:studio
```

---

## Lizenz und Herkunft der Inhalte

Der Programmcode steht euch zur freien Verwendung für euren Shop zur Verfügung.
Die Demo-Produktnamen (Golden Amber, Midnight Oud, Velvet Rose, Noir Vanilla,
Citrus Élan, Royal Essence) sind frei erfunden. Die Abbildungen unter
`public/produkte/` wurden eigens als SVG erzeugt – es wurden keine fremden
Produktfotos und keine geschützten Logos verwendet.
