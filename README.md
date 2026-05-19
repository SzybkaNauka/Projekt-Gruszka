# Gruszka Katapulta

Kampania ma 50 recznie zbalansowanych poziomow w 5 rozdzialach:
- 1-10: Startowa Farma
- 11-20: Drugi Bieg
- 21-30: Proba Mistrza
- 31-40: Very Hard
- 41-50: Impossible

Aktywne pojazdy to Drewniana Katapulta, Dyniowy Wozek, Kamienny Taran, Rakietowa Taczka i Zlota Katapulta. Sprezynowe wozki/pady nie sa uzywane w kampanii.

Supabase ranking obsluguje `level_id` od 1 do 50 dla `level_scores` i `best_level_scores`.

Vite + React + Phaser + Matter Physics + Capacitor. Gra działa offline jako gość, a funkcje online korzystają z Supabase.

## Konfiguracja

1. Skopiuj `.env.example` do `.env`.
2. Ustaw:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. W Supabase SQL Editor uruchom `supabase/schema.sql`.

Nie używaj service role key w frontendzie.

## Web

```bash
npm install
npm run dev
```

## Build / PWA

```bash
npm run build
```

PWA używa `public/manifest.webmanifest` oraz `public/sw.js`. Po pierwszym wejściu app shell jest cache'owany. Zapytania do Supabase nie są agresywnie cache'owane.

## Android / iOS Capacitor

```bash
npm run build
npm run cap:sync
```

Potem:

```bash
npm run cap:open:android
npm run cap:open:ios
```

Auth Supabase działa w WebView jako web auth.

## Online Features

- Email/password login
- Magic link
- Profile
- Global leaderboard
- Friends leaderboard
- Pending offline scores
- Friend requests

## QA / dev helpers

W trybie developerskim mozesz szybko testowac kampanie:

```text
http://localhost:5173/?level=1
http://localhost:5173/?level=25
http://localhost:5173/?unlockAll=1
http://localhost:5173/?level=37&debug=1
```

- `level` odpala wskazany poziom, clampowany do 1-50.
- `unlockAll=1` lokalnie odblokowuje kampanie do poziomu 50.
- `debug=1` wlacza debug helpers i oznacza wynik jako niekwalifikowany do rankingu online.
- W dev console uruchamia sie `runCampaignSanityCheck()` i wypisuje liczbe warnings/errors.

Jesli Supabase ma stara baze z constraintem `level_id` 1-10, odpal ponownie `supabase/schema.sql` albo dodaj migracje zmieniajaca zakres na 1-50 dla `level_scores` i `best_level_scores`.

Gra nadal działa bez konta i bez internetu. Wyniki offline trafiają do kolejki `pendingScores` w localStorage i są wysyłane po odzyskaniu internetu oraz zalogowaniu.

## Publiczny nick (username) vs email

- Email służy wyłącznie do logowania i nie jest pokazywany publicznie w grze.
- Każdy gracz ma publiczny `username` (nick) widoczny w rankingu, profilu, znajomych i na chacie.
- `username` musi być unikalny i ma format 3–20 znaków, tylko małe litery, cyfry i `_`.
- `username` nie może wyglądać jak adres email.
- Podczas rejestracji prosimy podać `email`, `hasło` i `username` — `username` będzie widoczny publicznie.

Upewnij się, że tabela `profiles` w Supabase posiada kolumnę `username text unique not null` (to jest już zawarte w `supabase/schema.sql`).

## Deploy na Vercel

1. Wejdź na https://vercel.com i zaloguj się na konto GitHub.
2. Kliknij New Project → Import Git Repository → Wybierz `https://github.com/SzybkaNauka/Projekt-Gruszka`.
3. Framework Preset: `Vite`.
4. Install Command: `npm install`.
5. Build Command: `npm run build`.
6. Output Directory: `dist`.
7. Branch: `main`.
8. Dodaj Environment Variables (w ustawieniach projektu):

   Supabase:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

   Firebase (jeśli używasz chatu):
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_DATABASE_URL`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_FIREBASE_MEASUREMENT_ID`

9. Kliknij Deploy.

Po deployu, w Supabase -> Authentication -> URL Configuration ustaw `Site URL` i `Redirect URLs` dla domeny Vercel (np. `https://twoj-projekt.vercel.app`) oraz `http://localhost:5173` do testów lokalnych.

Jeśli używasz Firebase Realtime Database dla chatu: dodaj domenę `twoj-projekt.vercel.app` do Authorized domains w Firebase Auth i wgraj `firebase.database.rules.json` do konsoli.
