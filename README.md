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
15. [Währung und Mehrwertsteuer](#15-währung-und-mehrwertsteuer)

---

## 1. Wichtige Hinweise vor dem Livegang

> **Die mitgelieferten Rechtstexte sind nicht automatisch rechtssicher.**
> Impressum, Datenschutzerklärung, AGB und die Rückgabe-/Widerrufsseite sind
> auf Rare Scents als Schweizer Einzelunternehmen zugeschnitten, ersetzen aber
> keine Rechtsberatung. Sie müssen – ebenso wie Produktangaben,
> Markennennungen, Duftvergleiche und Kennzeichnungspflichten – vor der
> Veröffentlichung von einer fachkundigen Person geprüft werden. Das betrifft
> insbesondere das Kosmetikrecht, die Preisbekanntgabeverordnung (PBV), das
> Fernabsatzrecht sowie revDSG und DSGVO.

**Hinterlegte Firmendaten** (`src/config/site.ts`):

| Feld | Wert |
| --- | --- |
| Firma | Rare Scents |
| Rechtsform | Einzelunternehmen |
| Adresse | bewusst nicht veröffentlicht – siehe Hinweis unten |
| E-Mail | rarescents.swiss@gmail.com |
| Instagram | @rarescents.swiss |
| Handelsregister / UID | keine (nicht eingetragen) |
| Mehrwertsteuer | nicht mehrwertsteuerpflichtig |
| Abrechnungswährung | CHF |

> **Postanschrift:** Inhabername und Privatadresse stehen bewusst nirgends auf
> der Website. Art. 3 Abs. 1 lit. s UWG verlangt von Onlineanbietern aber
> „klare und vollständige Angaben über seine Identität und seine
> Kontaktadresse einschliesslich derjenigen der elektronischen Post“ – die
> E-Mail-Adresse kommt dort ausdrücklich *zusätzlich* zur Postanschrift.
> Eine reine E-Mail-Angabe erfüllt die Vorschrift deshalb streng genommen
> nicht. Saubere Lösung ohne Privatadresse im Netz: ein Postfach der
> Schweizerischen Post oder eine c/o-Geschäftsadresse mieten und in
> `siteConfig.contact` eintragen – Impressum, AGB, Datenschutzerklärung,
> Footer und alle E-Mails zeigen sie dann automatisch wieder an.

### Duftwelten aus den Duftnoten

Unter **Admin → Kategorien** steht oben „Duftwelten aus den Duftnoten“. Der
Shop liest die Kopf-, Herz- und Basisnoten aller eigenen Produkte und schlägt
Kategorien vor: „Vanille, Tonkabohne, Karamell“ ergibt *Süss & Gourmand*,
„Oud, Zeder, Vetiver“ ergibt *Holzig & Oud*.

Die Regeln stehen in `src/lib/scent-worlds.ts`:

- Eine Welt zählt, wenn sie **mindestens zwei** Noten trifft – oder wenn sie
  der beste Treffer ist. Sonst landete jeder Duft mit einer einzigen
  Pfeffernote unter *Würzig*.
- Höchstens **zwei Welten** pro Duft. Ein Duft in fünf Kategorien hilft beim
  Stöbern nicht mehr.
- Erkannt wird über das **längste enthaltene Stichwort** (`src/lib/notes.ts`).
  In echten Daten steht „Oudholz“, „Tabakblatt“ und „Schwarzer Pfeffer“, nicht
  „Oud“, „Tabak“ und „Pfeffer“. Die Regel „längstes Stichwort gewinnt“ sorgt
  ausserdem dafür, dass „Eichenmoos“ beim Moos landet und nicht beim Holz.

Der Adminbereich zeigt den Vorschlag **vor** dem Ausführen an, samt der Noten,
die den Ausschlag gaben. Angefasst werden ausschliesslich Duftwelt-Kategorien;
von Hand vergebene Zuordnungen wie „Damen“ oder „Herren“ bleiben unberührt.
Der Knopf lässt sich beliebig oft drücken – ändern sich die Duftnoten eines
Produkts, wird beim nächsten Durchlauf umsortiert.

Auf der Startseite bekommen nur die Zielgruppen grosse Kacheln; die Duftwelten
stehen als Textzeile darunter, sonst bestünde die Seite nur noch aus
Kategorien.

Weitere Punkte, die zwingend zu erledigen sind:

- **Mehrwertsteuer:** `SHOP_TAX_RATE_BP` steht auf `0`, weil ohne UID und ohne
  MwSt-Registrierung keine Mehrwertsteuer ausgewiesen werden darf. Der Shop
  blendet dann alle MwSt-Zeilen aus und schreibt stattdessen „keine MwSt.“.
  Sobald die Steuerpflicht eintritt (Umsatz ab CHF 100'000 pro Jahr), auf
  `810` setzen – mehr ist nicht nötig, alle Anzeigen passen sich automatisch an.
- **Telefonnummer:** `siteConfig.contact.phone` ist `null`. In der Schweiz
  genügt nach Art. 3 Abs. 1 lit. s UWG eine E-Mail-Adresse. Sobald eine Nummer
  eingetragen wird, erscheint sie automatisch in Impressum und Kontaktseite.
- **Demo-Produkte entfernen:** Die sechs Seed-Produkte sind erfundene Demo-Inhalte
  mit selbst gezeichneten Abbildungen (`isDemo: true`). Vor dem Livegang durch
  eigene Produkte und eigene Fotos ersetzen.
- **Duftalternativen korrekt kennzeichnen:** Produkte, die keine Originalware
  sind, müssen das Feld „Duftalternative“ gesetzt haben. Verwendet keine
  geschützten Markenlogos, Markennamen im Produktnamen oder fremden
  Produktbilder ohne Genehmigung. Die Formulierung „Duftalternative“ bzw.
  „inspiriert von einer Duftrichtung“ ist bereits im System vorgesehen.
- **Wechselkurse pflegen:** `SHOP_DISPLAY_RATES` enthält die Kurse für den
  Währungsumschalter. Sie veralten – regelmässig aktualisieren oder den
  Umschalter mit `SHOP_DISPLAY_RATES="aus"` abschalten (siehe Abschnitt 15).
- **Liefergebiet:** Der Shop liefert ausschliesslich in die **Schweiz**
  (`shippingCountries` in `src/lib/shipping.ts`). Das ist eine bewusste
  Entscheidung: kein Zoll, keine Einfuhrabgaben für Kundinnen und Kunden, kein
  zwingendes EU-Fernabsatzrecht und dadurch kürzere Rechtstexte. Eine
  Erweiterung ins Ausland ist **nicht** mit einem neuen Eintrag getan – dann
  müssen zusätzlich eine echte Widerrufsbelehrung, Zollhinweise und die
  Versandkosten ergänzt werden.

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

### 5.4 TWINT, PayPal und weitere Zahlungsarten

Der Shop gibt Stripe **keine** feste Liste vor. Es gelten die Zahlungsarten,
die im Dashboard unter **Einstellungen → Zahlungsmethoden** freigeschaltet
sind. Eine neue Methode zu aktivieren ist damit ein Haken im Dashboard – ohne
Codeänderung und ohne neues Deployment.

Für einen Schweizer Shop lohnt sich vor allem **TWINT**: Es ist hierzulande
weit verbreitet, und wer es nicht anbietet, verliert Bestellungen an der
Kasse. Voraussetzung sind ein Schweizer Stripe-Konto und CHF als Währung –
beides ist gegeben.

Stripe blendet automatisch aus, was nicht passt: TWINT erscheint nur bei
CHF-Zahlungen, PayPal nur dort, wo es zugelassen ist.

Nur wer die Auswahl fest verdrahten will, setzt:

```bash
STRIPE_PAYMENT_METHODS="card,twint"
```

Leerer Wert oder `"auto"` bedeutet: Dashboard entscheidet. Eine leere Liste
fällt bewusst auf das Dashboard zurück – eine Session ganz ohne Zahlungsart
würde Stripe ablehnen und den Bezahlvorgang für alle Kundinnen totlegen.

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

### 8.4b Ersteinrichtung im Browser (ohne Terminal)

Die Tabellen legt Vercel bei jedem Deployment selbst an – das Build-Kommando
lautet `prisma generate && prisma migrate deploy && next build`. Ein separater
Migrationslauf ist nicht nötig.

Für den Zugang zum Adminbereich gibt es die Seite **`/admin/einrichtung`**.
Sie ist nur erreichbar, **solange noch kein einziges Konto existiert**, und
verschwindet danach spurlos (404). Dort legst du dein Administratorkonto an.

> **Sofort nach dem ersten Deployment einrichten.** Solange kein Konto besteht,
> könnte theoretisch jede Person, die die URL kennt, das erste Konto anlegen.
> Danach ist die Seite dauerhaft dicht.

`/admin/anmelden` leitet automatisch dorthin um, solange kein Konto besteht.

Alternativ, wenn du ein Terminal hast:

```bash
npm run admin:create -- --email chef@deine-domain.ch --name "Vorname Nachname"
```

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
| **Demo-Inhalte** | Auf der Übersicht: Demo-Produkte mit einem Klick einspielen und wieder entfernen |

**Duft anlegen.** Unter `/admin/produkte/neu` sind nur die Felder sichtbar, die
man wirklich braucht: Name, Beschreibung, Duftfamilie, Duftnoten,
Pflichtangaben und Kategorien. Sichtbarkeit, Kennzeichnungen, Adresse der
Produktseite und die Suchmaschinen-Felder liegen zusammengeklappt unter
«Weitere Einstellungen» und haben brauchbare Voreinstellungen. Die Adresse
bildet sich automatisch aus dem Namen.

Anwendungshinweise und die üblichen Warnhinweise sind bei neuen Produkten
vorausgefüllt (siehe `src/config/product-defaults.ts`). Die INCI-Liste bleibt
bewusst ein Platzhalter zum Überschreiben – sie steht auf der Verpackung und
unterscheidet sich je Duft; ein plausibel aussehender Vorgabetext würde dort
niemand mehr prüfen.

In der Größenverwaltung füllt ein Klick auf «2 ml», «10 ml», «50 ml» usw.
Größe, Volumen, Artikelnummer und die Probenmarkierung auf einmal. Die
Artikelnummer entsteht aus Produktkürzel und Volumen (`amber-nuit` + 10 ml →
`AN-010`) und weicht aus, wenn sie schon vergeben ist.

Bilder und die erste Größe lassen sich direkt beim Anlegen erfassen, sodass
ein Duft nach einem einzigen Speichern vollständig und bestellbar ist. Der
Upload zu Cloudinary hängt an keiner Produkt-ID und funktioniert deshalb
schon, bevor das Produkt existiert; die Adressen werden über verborgene
Formularfelder mitgesendet. Ohne Cloudinary lässt sich stattdessen eine
Bild-Adresse eintragen.

**Bilder werden automatisch vereinheitlicht.** Fotos kommen in allen
Formaten herein – hochkant, quer, heller oder dunkler Hintergrund. Damit der
Shop trotzdem ruhig wirkt, formt Cloudinary jedes Bild beim Ausliefern in ein
einheitliches 4:5-Hochformat um (`src/lib/product-image.ts`).

Bewusst mit `c_pad` statt `c_fill`: Gefüllt würde zugeschnitten und dabei
Flakonhälse oder Sockel abgeschnitten. Gepolstert bleibt der Flakon
vollständig sichtbar, und der Rand wird in der Hintergrundfarbe der jeweiligen
Fläche aufgefüllt (`#080808` auf Produktkarten, `#151515` auf der
Produktseite) – dadurch fällt die Polsterung nicht auf.

Du musst Fotos also **nicht vorbereiten**: Lade sie so hoch, wie sie sind.
Bilder von fremden Adressen bleiben unverändert.

**Hintergrund im Foto ersetzen.** Wer Fotos auf hellem Untergrund macht, kann
den Hintergrund automatisch durch die Shop-Farbe ersetzen lassen:

```bash
SHOP_IMAGE_BACKGROUND="transparent"   # einfarbige Fläche entfernen
SHOP_IMAGE_BACKGROUND="ai"            # freistellen (kostenpflichtiges Modul)
SHOP_IMAGE_BACKGROUND="scene"         # freistellen + Kulisse aus den Duftnoten
SHOP_IMAGE_BACKGROUND="keep"          # Standard: Foto bleibt unverändert
```

`transparent` läuft in jedem Cloudinary-Tarif, verlangt aber einen ruhigen,
einfarbigen Hintergrund ohne starke Schatten; die Empfindlichkeit steuert
`SHOP_IMAGE_BACKGROUND_TOLERANCE` (1–100, Vorgabe 30). `ai` kommt auch mit
unruhigem Hintergrund zurecht, setzt aber das Zusatzmodul
«Background Removal» im Cloudinary-Konto voraus.

`scene` geht einen Schritt weiter: Der Flakon wird freigestellt und
anschliessend vor eine erzeugte Kulisse gesetzt. Woraus die entsteht, wird in
dieser Reihenfolge entschieden:

1. **Die Duftnoten des Produkts.** Was im Adminbereich als Duftnote steht,
   landet im Bild: „Zitrone, Pfirsich“ ergibt Zitronen und Pfirsiche neben dem
   Flakon. Gewählt wird nach Möglichkeit **eine Note aus Kopf oder Herz und
   eine aus der Basis** – „Oud Maracuja“ hat Maracuja im Kopf und Oud in der
   Basis, und ausgerechnet das Oud gehört ins Bild. Übersetzt wird über ein
   Wörterbuch in
   `src/config/scent-scenes.ts` – nicht wörtlich, weil das Bildmodell
   englische Substantive braucht und weil Noten ohne Aussehen (Moschus,
   Ambroxan, Aldehyde) übersprungen gehören.
2. **Duftfamilie**, wenn keine Note ein Motiv ergibt.
3. **Nichts** – dann wird der Flakon nur freigestellt.

Höchstens drei Motive pro Bild, und die dunkle Bildsprache steht am Anfang der
Beschreibung. Der gemeinsame Schluss ist an einem echten Produktfoto
nachgemessen: „dark moody product photography“ hält die Kulisse dunkel
(Helligkeit 45–51 von 255 statt 86). „shallow depth of field“ stand dort
einmal ebenfalls und war der Grund, warum bei den meisten Düften gar keine
Motive im Bild auftauchten – die Anweisung erzeugt genau das, was sie
verspricht: einen unscharfen, leeren Hintergrund. Nicht wieder hinzufügen.

Im Adminbereich steht über den Produktbildern, welche Noten tatsächlich
verwendet werden (`sceneHint()`), damit niemand rätselt, warum „Moschus“ nichts
bewirkt.

Zwei Dinge dazu:

- **Guthaben.** Jedes Bild wird genau einmal erzeugt und danach von Cloudinary
  ausgeliefert. Produktkarte und Produktseite verwenden bewusst dieselbe
  Adresse, damit nicht zweimal Guthaben fliesst; Vorschaubilder unter der
  Galerie bekommen gar keine Kulisse.
- **Erster Abruf.** Cloudinary erzeugt die Kulisse erst, wenn die Adresse zum
  ersten Mal abgerufen wird. Deshalb ruft `warmeBilderVor()` in
  `src/app/admin/actions.ts` sie direkt nach dem Speichern einmal selbst ab –
  sonst liefe die erste Kundin in eine Wartezeit oder ein kaputtes Bild.
- **Adressen gehören auf den Server.** `SHOP_IMAGE_BACKGROUND` ist in
  Client-Komponenten nicht lesbar; dort käme immer `keep` heraus. Galerie und
  Bildverwaltung bekommen ihre Adressen deshalb fertig als Prop
  (`GalleryImage.url`, `ImageRow.previewUrl`) statt sie selbst zu bauen.

Steht keine oder eine unbekannte Duftfamilie am Produkt, wird der Flakon nur
freigestellt statt eine Kulisse zu raten.

Standard ist bewusst `keep`: Die Einstellung wirkt auf **alle** Bilder
gleichzeitig, und ein Freistellen, das danebengeht, ruiniert das ganze
Sortiment auf einen Schlag – unbemerkt, weil niemand alle Bilder
nachkontrolliert. Nach dem Umstellen also ein paar Produktseiten ansehen.

**Probengrößen.** Proben und Abfüllungen sind keine eigenen Produkte, sondern
Größen desselben Dufts. In der Größenverwaltung markiert das Häkchen
«Probe oder Abfüllung zum Testen» eine Größe als Probe (`isSample`). Auf der
Produktseite erscheinen solche Größen dann gruppiert unter «Zum Testen»,
getrennt von den Flakons, und der Shopfilter «Mit Probengröße erhältlich»
(`/shop?probe=1`) findet gezielt Düfte, die es in kleiner Menge gibt.

**Demo-Inhalte.** Auf einem frisch aufgesetzten Shop steht auf der
Übersichtsseite ein Kasten, über den sich die sechs erfundenen Demo-Produkte
samt Kategorien und Rabattcodes einspielen lassen – nützlich, um den Shop
einmal vollständig zu sehen, bevor eigene Produkte erfasst werden. Sobald
echte Produkte vorhanden sind, verweigert die Funktion das Einspielen.
Entfernt werden ausschliesslich Produkte mit `isDemo: true`; eigene Produkte
und bereits erfasste Bestellungen bleiben unberührt (`OrderItem` speichert
Name und Grösse als Schnappschuss). Dieselbe Logik nutzt auch
`npm run db:seed` – siehe `src/lib/demo-seed.ts`.

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

- [ ] Impressum stimmt: Firmenname, Rechtsform, Inhaber, Adresse, E-Mail
- [ ] Datenschutzerklärung an tatsächlich eingesetzte Dienste angepasst, Transportunternehmen namentlich ergänzt
- [ ] AGB geprüft, insbesondere Haftung, Gerichtsstand und Zollhinweise
- [ ] Rückgabe- und Widerrufsseite geprüft: freiwillige Frist Schweiz, gesetzliche Frist EU, Rücksendekosten
- [ ] Liefergebiet geprüft (aktuell nur Schweiz; bei Erweiterung Rechtstexte anpassen)
- [ ] Alle Rechtstexte von einer fachkundigen Person freigegeben
- [ ] Duftalternativen korrekt gekennzeichnet, keine geschützten Marken im Produktnamen
- [ ] Keine fremden Produktbilder oder Markenlogos ohne Genehmigung
- [ ] Inhaltsstoffe und Pflichtangaben je Produkt vollständig
- [ ] Grundpreis je 100 ml wird korrekt angezeigt
- [ ] Steuersatz (`SHOP_TAX_RATE_BP`) stimmt mit der steuerlichen Situation überein (aktuell `0` = nicht MwSt-pflichtig)
- [ ] Wechselkurse in `SHOP_DISPLAY_RATES` aktuell, oder Umschalter abgeschaltet
- [ ] Demo-Inhalte über den Adminbereich entfernt, `isDemo` bei echten Produkten nicht gesetzt
- [ ] Demo-Bilder in `public/produkte/` durch eigene Fotos ersetzt

### Technik

- [ ] Alle Umgebungsvariablen auf Vercel gesetzt (Production und Preview)
- [ ] `NEXT_PUBLIC_SITE_URL` und `AUTH_URL` zeigen auf die Live-Domain
- [ ] `AUTH_SECRET` ist zufällig erzeugt und nicht der Beispielwert
- [ ] `npm run build` und `npm run test` laufen fehlerfrei
- [ ] Migrationen auf der Produktionsdatenbank angewendet
- [ ] Adminkonto über /admin/einrichtung angelegt; Seed-Adminkonto gelöscht oder Passwort geändert
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

## 14b. Cron-Job und Reservierungen

Wird ein Bezahlvorgang abgebrochen, bleibt die Ware reserviert, bis die Frist
abläuft (`reservationMinutes`, standardmässig 60 Minuten). Freigegeben wird sie
auf zwei Wegen:

1. **Cron-Job** – `vercel.json` ruft täglich um 3 Uhr `/api/cron/reservierungen`
   auf. Häufiger geht auf dem Vercel-Hobby-Tarif nicht: Dort ist genau ein Lauf
   pro Tag erlaubt. Mit dem Pro-Tarif kann die Zeile auf `*/15 * * * *`
   zurückgestellt werden.
2. **Nebenbei beim Rechnen** – `buildQuote()` gibt abgelaufene Reservierungen
   frei, bevor es die verfügbare Menge ermittelt. Dadurch hängt die
   Verfügbarkeit nicht am Cron-Takt: Sobald jemand den Warenkorb öffnet oder
   bestellt, ist der Bestand aktuell. Der Lauf ist je Instanz auf einmal pro
   Minute gedrosselt, arbeitet in Häppchen von 25 Bestellungen und schluckt
   Fehler – er darf eine Bestellung nie blockieren.

Der Cron-Job ist damit nur noch ein Sicherheitsnetz für Zeiten ohne Verkehr.
`CRON_SECRET` muss gesetzt sein, sonst antwortet die Route mit 503.

---

## 15. Währung und Mehrwertsteuer

### Eine Abrechnungswährung, mehrere Anzeigewährungen

Der Shop rechnet **ausschliesslich in Schweizer Franken**. Jeder Betrag in
Datenbank, Bestellung, Stripe-Session, Rechnung und E-Mail ist ein
Integer-Betrag in Rappen. Es gibt keine zweite Abrechnungswährung – das hält
Zahlungen, Rückerstattungen und die Buchhaltung eindeutig.

Zusätzlich können Besucher oben im Header oder unten im Footer eine
**Anzeigewährung** wählen. Diese rechnet die CHF-Preise nur zur Orientierung
um:

- Umgerechnete Beträge tragen ein sichtbares „ca.“.
- Auf Produktseite, im Warenkorb und im Checkout steht, dass in CHF belastet
  wird; im Checkout steht der CHF-Betrag zusätzlich neben der Gesamtsumme.
- Der Server berechnet weiterhin nur CHF. Die Auswahl beeinflusst keine
  einzige Preisberechnung – auch dann nicht, wenn jemand das Cookie
  manipuliert. Unbekannte Werte fallen still auf CHF zurück.

Die Auswahl liegt im Cookie `rare-scents-currency` und wird schon beim Rendern
serverseitig gelesen. Dadurch stimmt das Server- mit dem Client-Markup überein:
kein Umspringen der Preise, keine Hydration-Warnung.

**Kurse pflegen** – die Kurse sind fest hinterlegt und veralten:

```bash
# Format: <ISO-Code>:<Einheiten je 1 CHF>, mit Komma getrennt
SHOP_DISPLAY_RATES="EUR:1.07,USD:1.24,GBP:0.92"

# Umschalter komplett abschalten – der Shop zeigt dann nur CHF
SHOP_DISPLAY_RATES=""
```

Ohne die Variable gelten die Näherungswerte aus `src/config/currencies.ts`.
Eine neue Anzeigewährung wird dort in `convertibleCurrencies` ergänzt.

### Mehrwertsteuer

`SHOP_TAX_RATE_BP` steht auf `0`, weil Rare Scents keine UID hat und nicht
mehrwertsteuerpflichtig ist. Wer nicht registriert ist, **darf keine
Mehrwertsteuer ausweisen**. Bei `0` blendet der Shop überall die MwSt-Zeilen
aus – Produktseite, Warenkorb, Checkout, Bestellbestätigung, E-Mails und
Adminbereich – und schreibt stattdessen „keine MwSt. (nicht
mehrwertsteuerpflichtig)“.

Sobald die Steuerpflicht eintritt (Umsatz ab CHF 100'000 pro Jahr):

```bash
SHOP_TAX_RATE_BP="810"   # 8,10 % Schweiz
```

Danach zusätzlich die UID in `siteConfig.contact.registrationNumber` und die
MwSt-Nummer in `siteConfig.contact.vatId` eintragen. Impressum, Footer und alle
Preisangaben passen sich automatisch an.

Der Steuersatz wird in Basispunkten geführt (810 = 8,10 %), damit auch krumme
Sätze ohne Fliesskommazahlen abgebildet werden können. Die im Bruttopreis
enthaltene Steuer berechnet `includedTaxCents()` in `src/lib/money.ts`.

---

## Lizenz und Herkunft der Inhalte

Der Programmcode steht euch zur freien Verwendung für euren Shop zur Verfügung.
Die Demo-Produktnamen (Golden Amber, Midnight Oud, Velvet Rose, Noir Vanilla,
Citrus Élan, Royal Essence) sind frei erfunden. Die Abbildungen unter
`public/produkte/` wurden eigens als SVG erzeugt – es wurden keine fremden
Produktfotos und keine geschützten Logos verwendet.
