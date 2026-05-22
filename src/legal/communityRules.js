import { COMMUNITY_VERSION } from './legalVersions.js';

export const communityRules = {
  title: 'ZASADY SPOLECZNOSCI I FAIR PLAY',
  version: COMMUNITY_VERSION,
  short: 'Graj fair. Nie cheatowac. Nie obrazac. Nie spamowac. Szanuj innych.',
  sections: [
    ['Zasady', [
      'Szanuj innych graczy.',
      'Nie obrazaj, nie nekaj, nie groz.',
      'Nie spamuj zaproszeniami, wiadomosciami ani zgloszeniami.',
      'Nie uzywaj cheatow, exploitow ani modyfikacji klienta.',
      'Nie podszywaj sie pod innych.',
      'Nie publikuj tresci nielegalnych, obrazliwych, dyskryminujacych ani seksualnych.',
      'W DUEL graj fair.',
      'Zglaszaj bledy zamiast je wykorzystywac.',
      'Studio moze usuwac tresci i blokowac konta naruszajace zasady.',
      'Najwazniejsze: gramy dla zabawy, rywalizacji i gruszkowego chaosu.',
    ]],
    ['Wersja', [`Wersja zasad: ${COMMUNITY_VERSION}`]],
  ],
};
