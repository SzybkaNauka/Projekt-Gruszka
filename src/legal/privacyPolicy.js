import { PRIVACY_VERSION } from './legalVersions.js';

export const privacyPolicy = {
  title: 'POLITYKA PRYWATNOŚCI "GRUSZKA KATAPULTA"',
  version: PRIVACY_VERSION,
  sections: [
    ['Administrator', ['Administratorem danych jest White Raven Studio.', 'Kontakt zostanie uzupelniony.']],
    ['Jakie dane mozemy przetwarzac', [
      'Email uzywany do logowania.',
      'Publiczny nick/username, display name, avatar/profil.',
      'Wyniki, poziomy, statystyki, osiagniecia.',
      'Dane DUEL PvP: pokoje, wyniki, status, snapshoty, eventy.',
      'Lista znajomych i zaproszenia.',
      'Wiadomosci czatu, jesli funkcja jest dostepna.',
      'Dane techniczne: typ urzadzenia, przegladarka, bledy, logi techniczne.',
      'Anonimowe lub pseudonimowe eventy playtestowe, jesli uzytkownik wyrazi zgode albo jesli sa potrzebne technicznie do dzialania uslugi.',
    ]],
    ['Czego nie pokazujemy publicznie', [
      'Email nie jest pokazywany w rankingu, profilu publicznym, DUEL, znajomych ani czacie.',
      'Publicznie widoczny moze byc nick, avatar, wynik, statystyki i osiagniecia.',
    ]],
    ['Po co przetwarzamy dane', [
      'Obsluga konta i logowanie.',
      'Zapis postepu, ranking, DUEL PvP, znajomi i czat.',
      'Bezpieczenstwo, zapobieganie oszustwom, naprawa bledow i rozwoj gry.',
      'Kontakt z uzytkownikiem, jesli uzytkownik go zainicjuje.',
    ]],
    ['Uslugi zewnetrzne', [
      'Supabase - logowanie, baza danych, profile, rankingi, DUEL, znajomi.',
      'Firebase - chat lub funkcje realtime, jesli wlaczone.',
      'Vercel/hosting - udostepnianie wersji web.',
      'Narzedzia analityczne lub error reporting, jesli zostana wlaczone.',
    ]],
    ['LocalStorage i PWA', [
      'Gra zapisuje lokalnie na urzadzeniu postep goscia, ustawienia, dzwiek, performance mode, zgody, identyfikator goscia, lokalne wyniki i dane potrzebne do PWA.',
    ]],
    ['Zgody', [
      'Niektore funkcje, takie jak anonimowe statystyki playtestowe lub marketing/newsletter, moga wymagac osobnej zgody.',
      'Zgode mozna wycofac w ustawieniach gry.',
    ]],
    ['Prawa uzytkownika', [
      'Uzytkownik moze poprosic o dostep do danych, poprawienie danych, usuniecie konta, ograniczenie przetwarzania, przeniesienie danych, wycofanie zgody lub sprzeciw wobec niektorych dzialan.',
      'Kontakt zostanie uzupelniony.',
    ]],
    ['Usuniecie konta', [
      'Uzytkownik moze poprosic o usuniecie konta i danych online.',
      'Dane lokalne zapisane w przegladarce mozna usunac przez ustawienia przegladarki lub funkcje resetu danych w grze.',
    ]],
    ['Bezpieczenstwo', [
      'Stosujemy podstawowe zabezpieczenia, takie jak konta, RLS, ograniczenia dostepu i walidacja danych, ale zadna usluga online nie jest w 100% wolna od ryzyka.',
    ]],
    ['Uzytkownicy mlodsi', [
      'Jesli gra bedzie kierowana do mlodszych uzytkownikow, przed publikacja nalezy doprecyzowac zasady zgod opiekunow, ograniczen wiekowych i przetwarzania danych dzieci.',
    ]],
    ['Zmiany polityki', [
      'Polityka moze byc aktualizowana.',
      'Po istotnych zmianach uzytkownik moze zostac poproszony o ponowne zapoznanie sie z dokumentem.',
    ]],
    ['Wersja', [`Wersja polityki: ${PRIVACY_VERSION}`]],
  ],
};
