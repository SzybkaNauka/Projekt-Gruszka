# Gruszka Katapulta

Kampania ma 50 recznie zbalansowanych poziomow w 5 rozdzialach:
- 1-10: Startowa Farma
- 11-20: Drugi Bieg
- 21-30: Proba Mistrza
- 31-40: Very Hard
- 41-50: Impossible

Aktywne pojazdy to Drewniana Katapulta, Dyniowy Wozek, Kamienny Taran, Rakietowa Taczka i Zlota Katapulta. Sprezynowe wozki/pady nie sa uzywane w kampanii.

Supabase ranking obsluguje `level_id` od 1 do 50 dla `level_scores` i `best_level_scores`.

## Upgrade kampanii

- Kampania ma 50 Zlotych Gwiazd Premium: po jednej na kazdym poziomie.
- Gwiazda Premium nie jest platna, nie jest waluta i nie ma zwiazku ze sklepem.
- To opcjonalny, trudny collectible dla graczy, ktorzy chca powtarzac mapy i robic lepsze runy.
- Kazda mapa ma 10 dodatkowych sekretow, skrotow, zagwozdek, ryzykownych tras albo mikro-wyzwan.
- Lacznie kampania zawiera 500 wpisow `extraChallenges`.
- Zlota Gwiazda Premium daje duzy bonus punktowy zalezny od tieru poziomu.
- Poziomy maja wiecej sekretow, combo wyzwan, ryzykownych tras, ukladow monet i opcjonalnych decyzji.

W grze: na kazdym poziomie ukryta jest jedna Zlota Gwiazda Premium. Jest bardzo trudna do zdobycia, ale daje duzy bonus.

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
- DUEL PvP arcade realtime: pokoje 1v1-5v5, ghosty graczy, power-upy, trap eventy, team score i zaproszenia po username.

## DUEL PvP

DUEL PvP to nie jest live ranking. Gracze jada na tej samej mapie PvP, widza przeciwnikow jako ghost/pojazdy, zbieraja power-upy i wysylaja eventy atakow przez Supabase Realtime.

- Snapshot pozycji/progresu idzie co ok. 150 ms.
- Fizyka zostaje lokalna, bez synchronizacji Matter co klatke.
- Eventy `powerup_used`, `trap_spawned`, `attack_hit`, `player_finished` i podobne sa zapisywane w `duel_events`.
- Mobile ma osobny przycisk `POWER` nad `SKOK`.
- Desktop uzywa `E` albo `Shift` do POWER.
- Email nie jest publiczny; DUEL pokazuje tylko username/display_name/avatar.
- `supabase/schema.sql` dodaje `duel_rooms`, `duel_players`, `duel_events`, `duel_invites` oraz flagi `allow_random_invites`, `last_seen_at`, `duel_status`.

TODO po stronie backendu, gdy PvP bedzie competitive: Edge Function do finalizacji wyniku, server-side anti-cheat i podpisywane eventy.

## Jak testowac DUEL 1v1 lokalnie

1. Uruchom aplikacje i otworz ja w dwoch oknach, najlepiej normalne okno + incognito albo dwie przegladarki.
2. Zaloguj sie na dwa rozne konta.
3. Konto A tworzy DUEL `1v1`.
4. Konto A w `DUEL TEST TOOLS` klika `Kopiuj link`.
5. Konto B otwiera link w drugim oknie: `/?duelRoom=KOD&playtest=1`.
6. Jesli Konto B nie jest zalogowane, aplikacja poprosi o logowanie i po logowaniu wroci do join flow.
7. Konto B potwierdza dolaczenie do pokoju.
8. Oba konta klikaja `Gotowy`.
9. Host klika `Start DUEL`.
10. Oba okna powinny zobaczyc ten sam countdown liczony z `duel_rooms.start_at`.
11. Po countdownie oba okna automatycznie przechodza do gry na tym samym levelu.
12. W grze powinien byc widoczny ghost przeciwnika z kolorem teamu.
13. Zbierz power-up i uzyj `POWER` na telefonie albo `E`/`Shift` na desktopie.
14. Drugi klient powinien zobaczyc lokalny efekt ataku albo pulapke.
15. Po mecie wynik DUEL pokazuje team score i statystyki PvP.
16. Host klika `Stworz rewanz`, co tworzy nowy prywatny pokoj i wysyla zaproszenia do poprzednich graczy.

W trybie `?playtest=1`, `?debug=1` albo w dev buildzie lobby pokazuje `DUEL TEST TOOLS`:
- kopiowanie kodu pokoju;
- kopiowanie linku do pokoju;
- kopiowanie statusu pokoju jako JSON;
- reset mojego udzialu w pokoju;
- anulowanie pokoju przez hosta;
- force refresh room state.

## Jesli DUEL nie dziala przez RLS

1. Upewnij sie, ze zalogowany user ma rekord `profiles.username`.
2. Uruchom najnowszy `supabase/schema.sql`, bo DUEL wymaga helperow:
   - `is_duel_room_player(room_id)`
   - `is_duel_room_player(room_id, user_id)`
   - `is_duel_room_host(room_id)`
   - `is_duel_room_host(room_id, user_id)`
   - `has_duel_invite(room_id)`
   - `has_duel_invite(room_id, user_id)`
3. User A musi moc stworzyc publiczny pokoj, User B musi moc zobaczyc go po kodzie i dolaczyc.
4. Obaj gracze musza widziec `duel_players` swojego pokoju.
5. Eventy `duel_events` sa widoczne tylko dla graczy pokoju i mozna je wysylac dopiero, gdy pokoj ma status `running`.
6. Wynik DUEL ma unique `duel_results(room_id)`, wiec kilka klientow nie powinno utworzyc duplikatu finalizacji.

## DUEL finalization Edge Function

Docelowa finalizacja DUEL dziala przez Supabase Edge Function `finalize-duel`.

Deploy:

```bash
supabase functions deploy finalize-duel
supabase secrets set SUPABASE_URL=https://PROJECT.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```

Test:

```bash
curl -X POST "https://PROJECT.supabase.co/functions/v1/finalize-duel" \
  -H "Authorization: Bearer USER_JWT" \
  -H "Content-Type: application/json" \
  -d "{\"roomId\":\"ROOM_UUID\"}"
```

Frontend uzywa anon key i wywoluje `finalizeDuelViaEdgeFunction(roomId)`. Jesli Edge Function nie jest skonfigurowana, dev/playtest fallback uzywa klientowej finalizacji tylko do testow.

## Realny skrypt QA DUEL

1v1:
- Browser A: normalne okno Chrome, konto A.
- Browser B: incognito albo inna przegladarka, konto B.
- A tworzy DUEL 1v1 albo klika `Szybki DUEL`.
- A kopiuje link z `DUEL TEST TOOLS`.
- B otwiera link, loguje sie, potwierdza dolaczenie.
- Obaj klikaja `Gotowy`.
- Host klika `Start DUEL`.
- Sprawdz: wspolny countdown, auto-start, ghost przeciwnika, POWER, efekt u drugiego gracza, meta/fail, result, historia, rating, rewanż.

2v2:
- Jesli nie masz 4 kont, sprawdz przynajmniej lobby: team slots, brak startu przy 2 vs 0, brak startu przy nierownych teamach.

Mobile:
- Otworz link na telefonie.
- Sprawdz D-pad, `SKOK`, osobny `POWER`, overlay i brak zaslaniania przyciskow.

RLS:
- User spoza pokoju nie powinien widziec `duel_events` pokoju.
- User spoza pokoju nie powinien insertowac eventu.
- User nie powinien update'owac cudzego `duel_players`.

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

Premium Star online:

```sql
alter table level_scores
add column if not exists premium_star_collected boolean default false;

alter table best_level_scores
add column if not exists premium_star_collected boolean default false;
```

Frontend zapisuje Premium Star lokalnie w `premiumStarsByLevel`. Wyniki online wysylaja opcjonalne pole `premium_star_collected`; jesli baza nie ma jeszcze kolumny, zapis wyniku ma fallback bez tego pola.

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
## Retention / Live Ops Playtest

Szczegoly nowego etapu retencji, Daily/Weekly, kosmetykow, Pestek, sklepu, analytics, error reporting i checklisty publikacyjnej sa w [docs/liveops-retention.md](docs/liveops-retention.md).

## Branding White Raven Studio

White Raven Studio jest warstwa brandingu startowego gry. Slogan studia:

```text
Gry • Aplikacje • Cyfrowe projekty
```

Kontakt i linki publiczne sa konfigurowane przez zmienne:

```env
VITE_CONTACT_EMAIL=
VITE_STUDIO_WEBSITE=
VITE_STUDIO_SOCIAL_URL=
VITE_ANDROID_APK_URL=
VITE_IOS_TESTFLIGHT_URL=
```

Komponenty brandingu sa w `src/components/StudioSplash.jsx`, `src/components/WhiteRavenLogo.jsx` oraz `src/components/StudioAboutPanel.jsx`.

## Legal documents

Dokumenty prawne sa w `src/legal/`:
- regulamin: `termsOfService.js`;
- polityka prywatnosci: `privacyPolicy.js`;
- zasady spolecznosci i fair play: `communityRules.js`;
- wersje dokumentow: `legalVersions.js`.

UI dokumentow i zgody first run sa w `src/components/legal/LegalPanel.jsx` oraz `src/components/FirstRunConsentPanel.jsx`. Pierwsze uruchomienie zapisuje lokalnie:

```text
acceptedTermsVersion
acceptedPrivacyVersion
acceptedCommunityVersion
analyticsConsent
marketingConsent
```

Zmiana `TERMS_VERSION`, `PRIVACY_VERSION` albo `COMMUNITY_VERSION` wymusi ponowna akceptacje wymaganych dokumentow. Zgody lokalne mozna zresetowac w devtools przez wyczyszczenie localStorage albo usuniecie powyzszych kluczy.

## Important legal note

Dokumenty prawne sa szablonem i przed publikacja komercyjna powinny zostac sprawdzone przez prawnika. Szczegolnie wazne jest to przy:
- platnosciach;
- reklamach;
- dzieciach/mlodszych uzytkownikach;
- publikacji w App Store/Google Play;
- przetwarzaniu danych;
- newsletterze.

## Final smoke test przed wyslaniem linka

Web:
- Vercel link otwiera sie.
- Splash dziala i da sie go pominac.
- First-run consent zapisuje wymagane zgody.
- Menu glowne dziala i nie pokazuje dev tools bez `?playtest=1` / `?debug=1`.
- Regulamin, prywatnosc i zasady spolecznosci otwieraja sie.
- Gra jako gosc dziala.
- Level 1 dziala.
- Win screen i lose screen dzialaja.
- Level select dziala.
- Premium Stars nie crashuja gry.
- Nie ma niebieskiego ekranu ani pustego canvasa.

Mobile:
- Link dziala na Android Chrome.
- Link dziala na iPhone Safari.
- PWA / dodaj do ekranu glownego dziala.
- D-pad dziala.
- SKOK dziala.
- POWER w DUEL dziala.
- Pelny ekran / instalacja panel dziala.
- Menu jest czytelne.

Auth:
- Rejestracja dziala.
- Username jest unikalny.
- Username nie moze byc emailem.
- Email nie jest publiczny.
- Login dziala.
- Guest mode dziala.
- Wylogowanie nie kasuje lokalnego progresu.

Online:
- Ranking laduje sie.
- Wynik wysyla sie online.
- Znajomi dzialaja.
- Random players nie pokazuja emaila.
- Privacy settings dzialaja.

DUEL:
- 1v1 dwa konta.
- Room code.
- Invite link.
- Ready.
- Countdown.
- Auto-start.
- Ghost.
- Power-up.
- Result.
- Rematch.
- History.

Legal:
- Zgody zapisuja sie.
- Zmiana wersji dokumentow pokazuje panel ponownie.
- Contact panel dziala.
- Support report copy dziala.

Deploy:
- `npm run build`.
- `npm run cap:sync`.
- Vercel deployment.
- Supabase URL Configuration.
- Edge Function deployed.
- RLS applied.

## Supabase production checklist

Sprawdz:
- `schema.sql` odpalone.
- RLS enabled.
- `user_consents` dziala.
- `support_reports` dziala.
- `profiles.username` jest unique.
- `level_scores` przyjmuje poziomy 1-50.
- DUEL tables istnieja.
- DUEL helper functions istnieja.
- Edge Function `finalize-duel` deployed.
- Sekrety ustawione: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
- Auth URL Configuration: `Site URL = Vercel URL`.
- Redirect URLs: localhost + Vercel.
- Realtime enabled dla duel tables.

W aplikacji Playtest Panel sprawdza tylko status frontendu: Supabase anon configured, session i user profile. Nie sprawdza service role key.

## Po deployu na Vercel

1. Otworz deployment URL.
2. Zrob hard refresh.
3. Sprawdz PWA.
4. Sprawdz manifest.
5. Sprawdz console.
6. Sprawdz auth redirect.
7. Sprawdz first-run consent na czystej przegladarce/incognito.

Service worker uzywa cache name powiazanego z wersja playtest. Jesli tester widzi stara wersje, popros o hard refresh albo usuniecie danych strony/PWA i ponowne otwarcie linka.

## Gotowa wiadomosc do testerow

```text
Hej! Testujemy "Gruszka Katapulta" od White Raven Studio.

Link:
[LINK]

Co sprawdzic:
1. Wejdz w link i zaakceptuj regulamin.

2. Kliknij "Graj" i przejdz 1-3 poziomy.

3. Na telefonie sprawdz sterowanie:
   lewa reka = D-pad,
   prawa reka = SKOK.

4. Zaloz konto i ustaw nick.
   Email nie jest publiczny.

5. Sprawdz ranking, profil i znajomych.

6. Jesli mozesz, sprawdz DUEL PvP z druga osoba.

7. Zainstaluj jako PWA / dodaj do ekranu glownego.

8. Jesli cos sie zepsuje, kliknij "Kopiuj raport bledu" i wyslij mi:
   - raport,
   - screen,
   - model telefonu,
   - przegladarke,
   - co kliknales przed bledem.

Dzieki za testy!
```
