import { PREMIUM_STAR_SCORE_BY_TIER } from './constants.js';

const legacy = {
  pears: ['normal'],
  blocks: [],
  enemies: [],
  items: [],
};

const tierByWorld = ['starter', 'rookiePlus', 'advanced', 'veryHard', 'impossible'];
const tierSettings = {
  starter: { radius: 245, grace: 980, launch: 390, length: 3500, bonus: 3600, camera: 380, score: 1 },
  rookiePlus: { radius: 205, grace: 760, launch: 330, length: 4600, bonus: 5200, camera: 420, score: 1.25 },
  advanced: { radius: 165, grace: 600, launch: 285, length: 5700, bonus: 7600, camera: 470, score: 1.6 },
  veryHard: { radius: 132, grace: 470, launch: 250, length: 6800, bonus: 10400, camera: 530, score: 2.1 },
  impossible: { radius: 112, grace: 390, launch: 220, length: 7900, bonus: 14500, camera: 590, score: 3 },
};

const themeCameraBoost = {
  pumpkinHighway: 120,
  rocketTrack: 170,
  bossArena: 110,
};

const themeCycle = [
  { theme: 'knightFarm', pear: 'knight', start: 'wooden' },
  { theme: 'skyDitches', pear: 'winged', start: 'wooden' },
  { theme: 'superTrack', pear: 'super', start: 'pumpkin' },
  { theme: 'pirateBridges', pear: 'pirate', start: 'wooden' },
  { theme: 'pumpkinHighway', pear: 'rider', start: 'pumpkin' },
  { theme: 'quarry', pear: 'gladiator', start: 'stone' },
  { theme: 'stuntYard', pear: 'stunt', start: 'wooden' },
  { theme: 'rocketTrack', pear: 'rocket', start: 'rocket' },
  { theme: 'vegetableFortress', pear: 'ninja', start: 'pumpkin' },
  { theme: 'bossArena', pear: 'royal', start: 'wooden' },
];

const difficultyByWorld = ['easy', 'normal', 'hard', 'veryHard', 'impossible'];

const challengeTypes = [
  'secret_route',
  'risk_reward_shortcut',
  'premium_star_challenge',
  'near_miss_corridor',
  'coin_arc_puzzle',
  'fake_safe_path',
  'perfect_landing_bonus_zone',
  'vehicle_mastery_section',
  'hidden_collectible_chain',
  'micro_puzzle',
  'combo_gate',
  'no_damage_lane',
  'speed_lane',
  'trick_jump',
  'recovery_zone',
  'visual_gag',
  'level_identity_gimmick',
  'moving_obstacle_timing',
  'boss_warning_pattern',
  'safe_lane',
];

const themeChallengeKits = {
  knightFarm: {
    label: 'rycerska farma',
    nouns: ['brama chorągiewek', 'beczki treningowe', 'kukła rycerza', 'płot turniejowy', 'mini zamek'],
    skills: ['precyzyjny przejazd przez bramę', 'ryzykowne minięcie płotu', 'utrzymanie środka trasy', 'czytanie chorągiewek'],
    visual: ['chorągiewki prowadzące linię', 'złoty pył za beczkami', 'tarcze treningowe przy sekretach'],
  },
  skyDitches: {
    label: 'skrzydlata dolina',
    nouns: ['chmurna półka', 'piórkowy łuk', 'wysoki rów', 'dolna bezpieczna nitka', 'wietrzna brama'],
    skills: ['kontrola wysokości lotu', 'późny skok nad rowem', 'miękkie lądowanie', 'wybór górnej trasy'],
    visual: ['pióra przy idealnym torze', 'monety w chmurach', 'błękitne znaczniki lądowania'],
  },
  superTrack: {
    label: 'super trasa',
    nouns: ['szybki pas', 'slalom ostrzegawczy', 'combo brama', 'linia turbo', 'fałszywie łatwy zjazd'],
    skills: ['jazda bez hamowania', 'timing skoku przy prędkości', 'utrzymanie combo', 'near miss przy przeszkodach'],
    visual: ['czerwone strzałki szybkości', 'iskry przy skrócie', 'monety w prostej linii turbo'],
  },
  pirateBridges: {
    label: 'pirackie mosty',
    nouns: ['skrzynia łupu', 'pomost nad wodą', 'beczki korsarzy', 'sekretny skarb', 'ryzykowny trap'],
    skills: ['skok przez wodę', 'wybór pomostu', 'omijanie beczek', 'lądowanie na wąskiej nitce'],
    visual: ['monety jak łup', 'deski wskazujące skrót', 'piracka tabliczka przy ryzyku'],
  },
  pumpkinHighway: {
    label: 'dyniowa autostrada',
    nouns: ['tunel dyniowy', 'pas driftu', 'szeroki slalom', 'płotowy skrót', 'linia bez hamowania'],
    skills: ['płynny drift góra-dół', 'czytanie szybkiej nitki', 'near miss w slalomie', 'utrzymanie tempa'],
    visual: ['pomarańczowe swiatła pasa', 'dynie kibicujące przy skrócie', 'monety jako linia driftu'],
  },
  quarry: {
    label: 'kamieniołom',
    nouns: ['krucha barykada', 'kamienny tunel', 'ściana do ominięcia', 'pyłowa zatoka', 'ścieżka tarana'],
    skills: ['decyzja taranować czy ominąć', 'stabilna jazda ciężkim pojazdem', 'no-damage przez tunel', 'perfect crash bonus'],
    visual: ['pył nad kamieniami', 'pęknięte znaki ostrzegawcze', 'szare monety przy sekrecie'],
  },
  stuntYard: {
    label: 'kaskaderskie rampy',
    nouns: ['mała platforma', 'rampa pokazowa', 'sekwencja stunt', 'awaryjne lądowisko', 'ukryta linia tricku'],
    skills: ['dobry moment wybicia', 'lądowanie na małej platformie', 'sekwencja skoków', 'ratowanie brzydkiego lądowania'],
    visual: ['światła rampy', 'gwiazdki kaskaderskie', 'linie monet nad rampą'],
  },
  rocketTrack: {
    label: 'rakietowy tor',
    nouns: ['ciasna brama', 'rakietowy near miss', 'ostatni moment skoku', 'speed trail', 'bezpieczna boczna nitka'],
    skills: ['reakcja przy dużej prędkości', 'perfekcyjny skręt', 'skok w ostatniej chwili', 'kontrola rakietowego tempa'],
    visual: ['czerwone warningi', 'smuga ognia przy bonusie', 'monety jak pas startowy'],
  },
  vegetableFortress: {
    label: 'warzywna forteca',
    nouns: ['sekretny korytarz', 'mur ninja', 'cicha ścieżka', 'fałszywy skrót', 'brama combo'],
    skills: ['ciasne przejście bez obrażeń', 'wybór ukrytej trasy', 'near miss między murami', 'cierpliwe czytanie fortecy'],
    visual: ['ciemne znaczniki sekretu', 'warzywne cienie', 'złoty błysk w murze'],
  },
  bossArena: {
    label: 'arena brokuła',
    nouns: ['boss pattern', 'złota finałowa trasa', 'taunt brokuła', 'sekret areny', 'legendary finish'],
    skills: ['czytanie powtarzalnego patternu', 'perfect boss dodge', 'ryzykowny finałowy skok', 'utrzymanie spokoju w arenie'],
    visual: ['brokułowa tabliczka z drwiną', 'złote monety przy arenie', 'finałowy blask mety'],
  },
};

const pearBaseThemes = {
  knight: { name: 'Rycerska Gruszka', colorAccent: 0xb8c4d6, faceStyle: 'brave', trailStyle: 'spark', abilityFlavorText: 'RYCERSKI SKOK!', visualParts: ['helmet', 'shield', 'sword'] },
  winged: { name: 'Skrzydlata Gruszka', colorAccent: 0xf4f7ff, faceStyle: 'wide', trailStyle: 'feathers', abilityFlavorText: 'LOT GRUSZKI!', visualParts: ['wings'] },
  super: { name: 'Supergruszka', colorAccent: 0xd64839, faceStyle: 'hero', trailStyle: 'power', abilityFlavorText: 'SUPER LOT!', visualParts: ['cape', 'emblem'] },
  pirate: { name: 'Piracka Gruszka', colorAccent: 0x704327, faceStyle: 'pirate', trailStyle: 'drops', abilityFlavorText: 'ARRR!', visualParts: ['eyepatch', 'hat', 'saber'] },
  rider: { name: 'Dyniowy Rajder', colorAccent: 0xf08a25, faceStyle: 'fast', trailStyle: 'dust', abilityFlavorText: 'TURBO GRUSZKA!', visualParts: ['goggles', 'helmet', 'scarf'] },
  gladiator: { name: 'Kamienna Gruszka Gladiator', colorAccent: 0x858a91, faceStyle: 'tough', trailStyle: 'stoneDust', abilityFlavorText: 'KAMIENNA SILA!', visualParts: ['gladiatorHelmet', 'hammer'] },
  stunt: { name: 'Gruszka Kaskader', colorAccent: 0x6bd6ff, faceStyle: 'excited', trailStyle: 'stars', abilityFlavorText: 'KASKADERSKI LOT!', visualParts: ['headband', 'helmet'] },
  rocket: { name: 'Rakietowa Gruszka', colorAccent: 0xd64839, faceStyle: 'pilot', trailStyle: 'flame', abilityFlavorText: 'RAKIETA!', visualParts: ['pilotHelmet', 'jetpack'] },
  ninja: { name: 'Ninja Gruszka', colorAccent: 0x22242b, faceStyle: 'focused', trailStyle: 'shadow', abilityFlavorText: 'NINJA GRUSZKA!', visualParts: ['ninjaMask', 'backSword'] },
  royal: { name: 'Krolewska Gruszka', colorAccent: 0xf4d75c, faceStyle: 'royal', trailStyle: 'gold', abilityFlavorText: 'KROL GRUSZEK!', visualParts: ['crown', 'goldCape'] },
};

const levelNames = [
  'Rycerska Farma', 'Skrzydlata Dolina', 'Super Trasa', 'Pirackie Mosty', 'Dyniowa Autostrada',
  'Kamieniołom Gladiatora', 'Kaskaderska Trasa', 'Rakietowy Tor', 'Warzywna Forteca', 'Brokuł Boss Run',
  'Drugi Patrol Farmy', 'Wiatr pod Skrzydłami', 'Super Sprint', 'Pirackie Rowy', 'Dyniowy Drift',
  'Taran Test', 'Kaskaderskie Rampy', 'Rakietowa Próba', 'Cichy Mur', 'Mini Boss Brokuła',
  'Rycerski Szturm', 'Skrzydła nad Przepaścią', 'Super Prędkość', 'Piracka Burza', 'Autostrada Bez Hamulców',
  'Kamienny Labirynt', 'Kaskader Pro', 'Rakietowy Slalom', 'Forteca Ninja', 'Brokuł Kontratakuje',
  'Rycerska Próba Mistrza', 'Skrzydlata Otchłań', 'Superreakcja', 'Piracki Koszmar', 'Dyniowa Furia',
  'Taran Mistrza', 'Kaskaderska Rzeźnia', 'Rakietowy Obłęd', 'Forteca Cieni', 'Brokuł Rage Mode',
  'Rycerska Masakra', 'Skrzydła albo Śmierć', 'Supergruszka: Limit', 'Piracki Sztorm', 'Dyniowa Śmierć',
  'Kamienny Egzekutor', 'Kaskader Impossible', 'Rakietowy Koniec', 'Forteca Bez Litości', 'Brokuł Ostateczny',
];

function coinLine(startX, y, count, step = 76, wave = 0) {
  return Array.from({ length: count }, (_, index) => ({
    x: startX + index * step,
    y: y + Math.sin(index * 0.9) * wave,
  }));
}

function coinArc(startX, startY, count, stepX, lift = 92) {
  return Array.from({ length: count }, (_, index) => {
    const t = count <= 1 ? 0 : index / (count - 1);
    return {
      x: startX + index * stepX,
      y: startY - Math.sin(Math.PI * t) * lift,
    };
  });
}

function zoneCenter(zone) {
  if (typeof zone === 'number') return zone;
  return ((zone?.start || 0) + (zone?.end || 0)) / 2;
}

function transfer({
  id,
  launchStart,
  launchEnd,
  x,
  y,
  type,
  arc = 'medium',
  landingDifficulty = 'normal',
  radius = 118,
  grace = 520,
  stabilization = 800,
}) {
  return {
    id,
    launchZoneX: { start: launchStart, end: launchEnd },
    targetVehicleX: x,
    targetVehicleY: y,
    targetVehicleType: type,
    requiredArc: arc,
    arcHint: arc,
    difficulty: landingDifficulty,
    landingDifficulty,
    safeCatchRadius: radius,
    failGraceDistance: grace,
    stabilizationAfterLandingMs: stabilization,
    catchZone: { x, y: y - 58, radius },
    coinArc: true,
  };
}

function themeForLevel(id) {
  const base = themeCycle[(id - 1) % 10];
  const tier = Math.floor((id - 1) / 10) + 1;
  const theme = pearBaseThemes[base.pear];
  return {
    id: base.pear,
    tier,
    name: `${theme.name} T${tier}`,
    colorAccent: tier >= 5 ? 0xffd85d : theme.colorAccent,
    faceStyle: theme.faceStyle,
    trailStyle: tier >= 4 ? `${theme.trailStyle}Intense` : theme.trailStyle,
    abilityFlavorText: theme.abilityFlavorText,
    visualParts: tier >= 3 ? [...new Set([...theme.visualParts, 'emblem'])] : theme.visualParts,
  };
}

function vehicleSequence(id, transferCount) {
  const pattern = [
    ['wooden', 'pumpkin', 'wooden', 'stone'],
    ['pumpkin', 'wooden', 'rocket', 'golden'],
    ['stone', 'wooden', 'pumpkin', 'rocket'],
    ['rocket', 'pumpkin', 'stone', 'golden'],
    ['pumpkin', 'stone', 'rocket', 'golden'],
  ][Math.floor((id - 1) / 10)];
  return pattern.slice(0, transferCount);
}

function obstacleFor(theme, index, tierName) {
  const easy = tierName === 'starter' || tierName === 'rookiePlus';
  const sets = {
    knightFarm: ['fence', 'crate', 'rock', easy ? 'crate' : 'spikes'],
    skyDitches: ['crate', 'fence', 'rock', easy ? 'fence' : 'veggieMine'],
    superTrack: ['crate', 'onionSlick', 'rotatingBeam', easy ? 'rock' : 'spikes'],
    pirateBridges: ['crate', 'fence', 'veggieMine', 'rotatingBeam'],
    pumpkinHighway: ['crate', 'onionSlick', 'rock', easy ? 'fence' : 'spikes'],
    quarry: ['crate', 'broccoliBarricade', 'rock', 'stoneWall'],
    stuntYard: ['crate', 'fence', 'rotatingBeam', easy ? 'rock' : 'veggieMine'],
    rocketTrack: ['veggieMine', 'fence', 'spikes', 'rotatingBeam'],
    vegetableFortress: ['fence', 'onionSlick', 'broccoliBarricade', 'rotatingBeam'],
    bossArena: ['rotatingBeam', 'broccoliBarricade', 'veggieMine', 'stoneWall'],
  };
  return (sets[theme] || sets.knightFarm)[index % 4];
}

function buildObstacles({ id, theme, tierName, routeLength, road, transfers }) {
  const countByTier = { starter: 4, rookiePlus: 6, advanced: 8, veryHard: 10, impossible: 12 };
  const count = tierName === 'starter' ? (id <= 2 ? 2 : id <= 5 ? 3 : 4) : countByTier[tierName];
  const protectedZones = transfers.map((item) => ({ start: item.targetVehicleX - 150, end: item.targetVehicleX + 390 }));
  const obstacles = [];
  let x = 720;
  for (let i = 0; i < count; i += 1) {
    x += 250 + ((i + id) % 3) * 85;
    if (x > routeLength - 520) break;
    const protectedZone = protectedZones.find((zone) => x > zone.start && x < zone.end);
    if (protectedZone) x = protectedZone.end + 80;
    if (x > routeLength - 520) break;
    const type = obstacleFor(theme, i + id, tierName);
    const lane = i % 2 === 0 ? road.top + 110 + ((id + i) % 3) * 20 : road.bottom - 82 - ((id + i) % 3) * 18;
    const deadly = ['spikes', 'veggieMine', 'stoneWall'].includes(type);
    const hint = type === 'broccoliBarricade' || type === 'crate' || type === 'fence' ? (theme === 'quarry' ? 'TARANUJ!' : undefined) : deadly ? 'UWAGA!' : undefined;
    obstacles.push({ type, x, y: lane, deadly, hint });
  }
  return obstacles;
}

function buildAirCurrents({ world, transferIndex, launchCenter, targetX, road }) {
  if (world < 2) return [];
  const direction = (transferIndex + world) % 2 === 0 ? 'up' : 'down';
  const opposite = direction === 'up' ? 'down' : 'up';
  const midX = launchCenter + (targetX - launchCenter) * 0.52;
  const roadCenter = (road.top + road.bottom) / 2;
  const y = roadCenter + (direction === 'up' ? 42 : -42);
  const strength = 0.32 + world * 0.035;
  const currents = [{
    id: `air-${world}-${transferIndex}-main`,
    x: midX,
    y,
    width: 360 + world * 34,
    height: 252,
    direction,
    strength,
  }];

  if (world >= 3) {
    currents.push({
      id: `air-${world}-${transferIndex}-counter`,
      x: midX + 250 + transferIndex * 18,
      y: roadCenter + (opposite === 'up' ? 34 : -34),
      width: 260 + world * 22,
      height: 220,
      direction: opposite,
      strength: strength * 0.76,
    });
  }

  return currents;
}

function slug(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
}

function challengeDifficulty(world, offset = 0) {
  return difficultyByWorld[Math.min(difficultyByWorld.length - 1, Math.max(0, world + offset))];
}

function buildPremiumStar({ id, world, tierName, road, transitions, finishX, theme }) {
  const transfer = transitions[Math.min(transitions.length - 1, Math.max(0, Math.floor(transitions.length / 2)))];
  const launchCenter = zoneCenter(transfer?.launchZoneX || 900);
  const riskyX = Math.round((launchCenter + (transfer?.targetVehicleX || finishX)) / 2 + 80 + world * 24);
  const highLane = (id + world) % 2 === 0;
  const y = Math.round(highLane ? road.top + 64 + world * 6 : road.bottom - 72 - world * 4);
  const requiresByTheme = {
    knightFarm: 'secret_route',
    skyDitches: 'risky_jump',
    superTrack: 'near_miss',
    pirateBridges: 'secret_route',
    pumpkinHighway: 'combo_gate',
    quarry: 'vehicle_swap',
    stuntYard: 'perfect_landing',
    rocketTrack: 'risky_jump',
    vegetableFortress: 'no_damage_lane',
    bossArena: 'boss_pattern',
  };
  return {
    x: Math.min(finishX - 280, Math.max(620, riskyX)),
    y,
    difficulty: challengeDifficulty(world, 1),
    scoreBonus: PREMIUM_STAR_SCORE_BY_TIER[tierName] || 2500,
    requires: requiresByTheme[theme] || 'risky_jump',
    hint: highLane
      ? 'Wisi wysoko nad bezpieczną linią. Wcześniejszy skok i czysty tor dają szansę.'
      : 'Leży nisko przy ryzykownej nitce. Trzeba zejść po nią bez utraty kontroli.',
    visualStyle: 'gold_glow',
  };
}

function buildExtraChallenges({ id, world, tierName, theme, road, transitions, premiumStar, finishX }) {
  const kit = themeChallengeKits[theme] || themeChallengeKits.knightFarm;
  const transfer = transitions[0] || { launchZoneX: { start: 900, end: 1120 }, targetVehicleX: 1450 };
  const launchCenter = zoneCenter(transfer.launchZoneX);
  const baseDifficulty = challengeDifficulty(world);
  const hardDifficulty = challengeDifficulty(world, 1);
  const scoreBase = 260 + world * 180 + (id % 10) * 35;
  const challengeSeeds = [
    {
      type: 'coin_arc_puzzle',
      title: `Łuk ${kit.nouns[0]}`,
      desc: `Monety układają się w czytelny, ale punktowany tor przez ${kit.label}.`,
      x: `${Math.round(launchCenter - 160)}-${Math.round(launchCenter + 280)}`,
      skill: kit.skills[0],
      visual: kit.visual[0],
      difficulty: baseDifficulty,
      reward: { score: scoreBase, combo: true },
    },
    {
      type: 'premium_star_challenge',
      title: 'Polowanie na Złotą Gwiazdę',
      desc: `Opcjonalny wariant trasy prowadzi do Złotej Gwiazdy Premium i wymaga świadomego ryzyka.`,
      x: `x=${premiumStar.x}, y=${premiumStar.y}`,
      skill: kit.skills[1] || 'precyzyjny skok',
      visual: 'złoty glow i monety ostrzegawcze',
      difficulty: premiumStar.difficulty,
      reward: { score: premiumStar.scoreBonus, premiumStarProgress: true },
    },
    {
      type: 'secret_route',
      title: `Sekret: ${kit.nouns[1]}`,
      desc: `Ukryta boczna linia daje więcej punktów, ale wymaga odejścia od najłatwiejszego toru.`,
      x: `${Math.round(launchCenter + 260)}-${Math.round(launchCenter + 620)}`,
      skill: kit.skills[2] || 'wybór alternatywnej trasy',
      visual: kit.visual[1],
      difficulty: baseDifficulty,
      reward: { score: scoreBase + 240, combo: true },
    },
    {
      type: 'risk_reward_shortcut',
      title: `Skrót przez ${kit.nouns[2]}`,
      desc: `Krótsza linia pozwala oszczędzić czas, ale mocno podnosi ryzyko utraty combo.`,
      x: `${Math.round(launchCenter + 520)}-${Math.round(launchCenter + 880)}`,
      skill: kit.skills[3] || 'szybka decyzja',
      visual: kit.visual[2],
      difficulty: hardDifficulty,
      reward: { score: scoreBase + 360, combo: true },
    },
    {
      type: world >= 2 ? 'air_current_read' : 'near_miss_corridor',
      title: world >= 2 ? 'Czytanie prądu powietrza' : `Korytarz przy ${kit.nouns[3]}`,
      desc: world >= 2
        ? 'Sekcja uczy wykorzystania stałego prądu powietrza zamiast walki z nim.'
        : 'Wąska linia przy przeszkodach nagradza bliskie minięcia i spokojną rękę.',
      x: `${Math.round(launchCenter + 720)}-${Math.round(launchCenter + 1080)}`,
      skill: world >= 2 ? 'kontrola wysokości w locie' : 'near miss bez paniki',
      visual: world >= 2 ? 'półprzezroczyste strefy wiatru' : 'żółte znaczniki ryzyka',
      difficulty: hardDifficulty,
      reward: { score: scoreBase + 420, combo: true },
    },
    {
      type: 'perfect_landing_bonus_zone',
      title: 'Małe idealne lądowanie',
      desc: `Niewielka strefa po przesiadce nagradza czyste lądowanie dodatkowym bonusem.`,
      x: `${Math.round((transfer.targetVehicleX || launchCenter + 430) - 80)}-${Math.round((transfer.targetVehicleX || launchCenter + 430) + 120)}`,
      skill: 'perfect landing',
      visual: 'mały złoty znacznik przy pojeździe',
      difficulty: baseDifficulty,
      reward: { score: scoreBase + 520, combo: true },
    },
    {
      type: 'vehicle_mastery_section',
      title: `Mistrzostwo: ${kit.nouns[4]}`,
      desc: `Ten fragment premiuje styl jazdy pojazdu poziomu: stabilność, drift, taran albo prędkość.`,
      x: `${Math.round(launchCenter + 980)}-${Math.round(launchCenter + 1400)}`,
      skill: 'opanowanie pojazdu',
      visual: 'tematyczne znaki przy trasie',
      difficulty: baseDifficulty,
      reward: { score: scoreBase + 560, combo: true },
    },
    {
      type: 'hidden_collectible_chain',
      title: 'Łańcuch pestek sekretu',
      desc: `Seria trudniej ustawionych monet prowadzi do małego bonusu i lepszego wejścia w końcówkę.`,
      x: `${Math.round(finishX - 1050)}-${Math.round(finishX - 620)}`,
      skill: 'utrzymanie linii monet',
      visual: 'monety schowane poza główną nitką',
      difficulty: hardDifficulty,
      reward: { score: scoreBase + 680, combo: true },
    },
    {
      type: id % 10 === 0 ? 'boss_warning_pattern' : 'micro_puzzle',
      title: id % 10 === 0 ? 'Czytelny pattern bossa' : 'Góra czy dół?',
      desc: id % 10 === 0
        ? 'Boss ma powtarzalny wzór ostrzeżeń, który da się opanować przy powtórkach.'
        : 'Krótka decyzja rozdziela trasę na bezpieczną linię i punktowany wariant ryzyka.',
      x: `${Math.round(finishX - 760)}-${Math.round(finishX - 360)}`,
      skill: id % 10 === 0 ? 'zapamiętanie patternu' : 'szybki wybór trasy',
      visual: id % 10 === 0 ? 'brokułowe ostrzeżenia' : 'dwie gałęzie monet',
      difficulty: hardDifficulty,
      reward: { score: scoreBase + 760, combo: id % 10 !== 0 },
    },
    {
      type: id % 5 === 0 ? 'speed_lane' : 'visual_gag',
      title: id % 5 === 0 ? 'Linia bez hamowania' : `Smaczek: ${kit.label}`,
      desc: id % 5 === 0
        ? 'Najbardziej punktowana końcówka wymaga wejścia w metę z pełnym tempem.'
        : `Mały wizualny sekret buduje charakter mapy i wskazuje opcjonalne ryzyko.`,
      x: `${Math.round(finishX - 420)}-${Math.round(finishX - 120)}`,
      skill: id % 5 === 0 ? 'utrzymanie prędkości' : 'uważna obserwacja mapy',
      visual: id % 5 === 0 ? 'szybkie znaczniki mety' : kit.visual[id % kit.visual.length],
      difficulty: baseDifficulty,
      reward: { score: scoreBase + 300, combo: id % 5 === 0 },
    },
  ];

  return challengeSeeds.map((challenge, index) => ({
    id: `l${id}_${slug(challenge.type)}_${index + 1}`,
    type: challenge.type,
    name: challenge.title,
    description: challenge.desc,
    difficulty: challenge.difficulty,
    reward: {
      score: challenge.reward.score,
      combo: Boolean(challenge.reward.combo),
      premiumStarProgress: Boolean(challenge.reward.premiumStarProgress),
    },
    placementHint: challenge.x,
    requiredSkill: challenge.skill,
    visualHint: challenge.visual,
    mandatory: false,
  }));
}

function buildLevel(id) {
  const world = Math.floor((id - 1) / 10);
  const tierName = tierByWorld[world];
  const tier = tierSettings[tierName];
  const themeConfig = themeCycle[(id - 1) % 10];
  const transferCount = id <= 3 ? 1 : id <= 10 ? 2 : id <= 20 ? 2 : id <= 30 ? 3 : id <= 40 ? 3 : 4;
  const length = tier.length + ((id - 1) % 10) * 135 + transferCount * 210;
  const road = { top: 225 + (id % 3) * 8, bottom: 620 - (id % 2) * 8 };
  const startY = id % 2 === 0 ? road.top + 125 : road.bottom - 110;
  const pearTheme = themeForLevel(id);
  const targetTypes = id === 50 ? ['pumpkin', 'stone', 'rocket', 'golden'] : vehicleSequence(id, transferCount);
  const transitions = [];
  const vehicles = [];
  const gaps = [];
  const airCurrents = [];
  const coins = [
    ...coinLine(430, startY, 6 + Math.min(5, world), 78, 18 + world * 5),
  ];
  const segment = (length - 980) / (transferCount + 1);
  for (let i = 0; i < transferCount; i += 1) {
    const launchCenter = 900 + segment * (i + 1);
    const launchWidth = Math.max(180, tier.launch - i * 14);
    const targetX = launchCenter + 430 + world * 45 + i * 45;
    const targetY = i % 2 === 0 ? road.top + 118 + ((id + i) % 2) * 30 : road.bottom - 98 - ((id + i) % 2) * 28;
    const type = targetTypes[i] || 'wooden';
    const radius = Math.max(92, tier.radius - i * 10 - world * 4) + (type === 'golden' ? 28 : 0);
    const grace = Math.max(330, tier.grace - i * 38) + (type === 'golden' ? 120 : 0);
    const arc = targetY < startY - 70 ? 'high' : i % 2 === 0 ? 'medium' : 'low';
    transitions.push(transfer({
      id: `l${id}-t${i + 1}`,
      launchStart: launchCenter - launchWidth / 2,
      launchEnd: launchCenter + launchWidth / 2,
      x: targetX,
      y: targetY,
      type,
      arc,
      landingDifficulty: world <= 0 ? 'easy' : world <= 2 ? 'normal' : world === 3 ? 'hard' : 'extreme',
      radius,
      grace,
      stabilization: tierName === 'starter' ? 1000 : tierName === 'rookiePlus' ? 850 : tierName === 'advanced' ? 700 : tierName === 'veryHard' ? 550 : 450,
    }));
    vehicles.push({
      id: `l${id}-v${i + 2}`,
      type,
      x: targetX,
      y: targetY,
      required: true,
    });
    airCurrents.push(...buildAirCurrents({ world, transferIndex: i, launchCenter, targetX, road }));
    gaps.push({
      x: launchCenter + 150,
      width: 180 + world * 45 + i * 18,
      type: themeConfig.theme === 'quarry' || themeConfig.theme === 'bossArena' ? 'kwas' : i % 2 ? 'przepasc' : 'row',
    });
    coins.push(...coinArc(launchCenter - 90, startY, 7 + Math.min(3, world), 78 + world * 4, 58 + world * 16));
    coins.push(...coinLine(targetX + 210, targetY, 4 + Math.min(3, world), 70, 18 + world * 4));
  }
  const obstacles = buildObstacles({ id, theme: themeConfig.theme, tierName, routeLength: length, road, transfers: transitions });
  const finishX = length - 240;
  const premiumStar = buildPremiumStar({ id, world, tierName, road, transitions, finishX, theme: themeConfig.theme });
  const extraChallenges = buildExtraChallenges({ id, world, tierName, theme: themeConfig.theme, road, transitions, premiumStar, finishX });
  const finishBonus = tier.bonus + id * 230;
  const cameraLookahead = tier.camera + (themeCameraBoost[themeConfig.theme] || 0);
  const oneStar = finishBonus;
  const twoStars = Math.round(finishBonus + length * 0.55 * tier.score + transferCount * 420);
  const threeStars = Math.round(finishBonus + (id === 50 ? 25000 : 10000 + world * 2500) + length * 0.42 * tier.score + transferCount * 850);
  return {
    id,
    name: levelNames[id - 1],
    difficultyTier: tierName,
    theme: themeConfig.theme,
    pearTheme,
    targetTimeMs: Math.round(length * (tierName === 'impossible' ? 90 : 110)),
    starThresholds: {
      one: oneStar,
      two: twoStars,
      three: threeStars,
    },
    route: {
      length,
      startVehicle: themeConfig.start,
      startY,
      finishX,
      finishBonus,
      perfectFinishBonus: id === 50 ? 25000 : 10000 + world * 2500,
      boss: id % 10 === 0,
      cameraOffset: cameraLookahead,
      cameraLookahead,
      road,
      gaps,
      transitions,
      transfers: transitions,
      vehicles,
      coins,
      collectibles: coins,
      obstacles,
      airCurrents,
      signs: transitions.map((item) => ({ type: 'jump', x: item.launchZoneX.start, text: 'SKACZ!' })),
      background: { theme: themeConfig.theme, tier: world + 1 },
      scoring: { scoreMultiplier: tier.score },
      pearTheme,
      bossDrops: id % 10 === 0 ? [
        { at: 900 + world * 180, lane: road.top + 110, type: 'fallingTomato' },
        { at: 2100 + world * 240, lane: road.bottom - 100, type: 'broccoliBarricade' },
        { at: 3600 + world * 260, lane: road.top + 135, type: 'fallingTomato' },
        { at: 5200 + world * 320, lane: road.bottom - 105, type: 'broccoliBarricade' },
      ] : undefined,
    },
    premiumStar,
    extraChallenges,
    ...legacy,
  };
}

export const levels = Array.from({ length: 50 }, (_, index) => buildLevel(index + 1));
