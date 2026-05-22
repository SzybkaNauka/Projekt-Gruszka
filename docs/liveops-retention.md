# Retention / Live Ops Playtest

Menu glowne ma teraz pierwszy pelny loop retencji:

- **Daily Challenge**: jeden deterministyczny poziom dziennie, modifier, ranking dzienny i nagroda za wynik.
- **Weekly Tournament**: tygodniowy zestaw 5 tras, ranking i preview nagrod kosmetycznych.
- **Season Pass**: kosmetyczny progres XP 1-50. Premium pass jest tylko placeholderem pod przyszlosc.
- **Kosmetyki**: skorki gruszki, pojazdow, traile, ramki profilu i animacje zwyciestwa.
- **Pestki**: soft currency za granie, streak, Daily i przyszle eventy. Pestki kupuja tylko kosmetyki.
- **Sklep**: sklep kosmetyczny za Pestki, bez prawdziwych platnosci.
- **Daily streak**: raz dziennie nagroda dla zalogowanego gracza.

Playtest analytics trafiaja do `playtest_events` bez emaili. Klient zapisuje m.in. app open, game start, level win/fail, DUEL start/finish, daily start/finish, shop open i cosmetic equip. Gracz moze wylaczyc analityke w menu. Lekki error reporting trafia do `client_errors`, z limitem raportow na sesje.

## Live Ops SQL

Po tym etapie odpal `supabase/schema.sql`. Nowe tabele:

- `daily_challenges`, `daily_challenge_scores`
- `weekly_tournaments`, `weekly_tournament_scores`
- `player_xp`, `season_rewards`
- `cosmetics`, `player_cosmetics`, `player_loadout`
- `player_wallets`, `wallet_transactions`, `shop_items`
- `playtest_events`, `client_errors`, `player_streaks`, `global_achievements`

RLS ogranicza zapisy danych gracza do wlasciciela. Leaderboardy, kosmetyki i aktywne itemy sklepu sa czytelne publicznie, ale email nigdy nie jest publikowany.

## Onboarding pierwszego gracza

Pierwsze uruchomienie pokazuje krotki panel:

1. Gosc moze od razu kliknac Graj.
2. Konto daje DUEL, ranking, nagrody i progres online.
3. Sterowanie tlumaczy lewa reke, SKOK oraz POWER tylko w DUEL.

## Monetyzacja future plan

- Rewarded ads tylko poza aktywna gra i nigdy w trakcie DUEL: Pestki, dodatkowa proba Daily, refresh kosmetykow, opcjonalny revive w singleplayer.
- Remove ads i cosmetic packs moga wejsc pozniej przez App Store / Google Play / RevenueCat.
- Season pass musi zostac kosmetyczny: skorki, traile, ramki, victory animations, DUEL emotes.
- Zero platnych power-upow PvP, platnej przewagi, wymaganych platnych poziomow i lootboxow za realne pieniadze.

## Roadmap do zarabiania

Etap 1: web/PWA playtest, feedback, analytics, crash reporting.

Etap 2: Daily/Weekly, cosmetics, soft currency, DUEL polish.

Etap 3: App Store / Google Play, rewarded ads, remove ads, season pass, cosmetic packs.

Etap 4: short video push, tournaments, community events, seasonal skins.

## Final Publish Polish Checklist

- Singleplayer startuje bez niebieskiego ekranu.
- DUEL nadal dziala: lobby, ready, countdown, gra, POWER, wynik.
- Mobile controls maja osobne D-pad, SKOK i POWER.
- Daily Challenge laduje dzisiejszy poziom i zapisuje wynik zalogowanego gracza.
- Weekly Tournament pokazuje 5 tras i leaderboard.
- Shop nie daje przewagi gameplayowej.
- Analytics i error reporting nie zapisuja emaili.
- `npm run build`, `npm run cap:sync` i `runCampaignSanityCheck` przechodza przed publikacja.
