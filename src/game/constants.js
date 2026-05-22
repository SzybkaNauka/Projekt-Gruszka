export const WORLD_WIDTH = 1280;
export const WORLD_HEIGHT = 720;
export const GROUND_Y = 660;
export const LEVEL_WORLD_WIDTH = 3600;

export const START_PEAR_COUNT = 3;
export const SLING_ANCHOR = { x: 185, y: 500 };
export const SLING_LEFT = { x: 150, y: 452 };
export const SLING_RIGHT = { x: 220, y: 452 };

export const MIN_PULL_DISTANCE = 30;
export const MAX_PULL_DISTANCE = 160;
export const POWER_MULTIPLIER = 0.105;
export const MAX_VELOCITY = 19;

export const MIN_BLOCK_IMPACT = 3.5;
export const MIN_ENEMY_IMPACT = 5.0;
export const ENEMY_SPAWN_IMMUNITY_MS = 500;
export const PEAR_SLEEP_SPEED = 0.24;

export const VEHICLE_BASE_SPEED = 7.2;
export const VEHICLE_MAX_SPEED = 13.5;
export const VEHICLE_ACCELERATION = 0.015;
export const VEHICLE_TURN_FORCE = 0.12;
export const VEHICLE_STABILITY = 0.82;
export const EARLY_LEVEL_CATCH_RADIUS_MULTIPLIER = 1.28;
export const EARLY_LEVEL_STABILITY_BONUS = 0.22;
export const LANDING_STABILIZE_TIME = 1200;
export const OUT_OF_SCREEN_GRACE_TIME = 2400;
export const FAIL_GRACE_DISTANCE_EASY = 980;
export const FAIL_GRACE_DISTANCE_NORMAL = 650;
export const FAIL_GRACE_DISTANCE_HARD = 460;
export const CAMERA_LOOKAHEAD_EASY = 360;
export const CAMERA_LOOKAHEAD_FAST = 500;
export const VEHICLE_TURN_FORCE_EASY = 0.145;
export const VEHICLE_TURN_FORCE_NORMAL = 0.125;
export const VEHICLE_TURN_FORCE_HARD = 0.112;
export const VEHICLE_MIN_FORWARD_SPEED = 4.8;
export const VEHICLE_FORWARD_RECOVERY_FORCE = 0.42;
export const VEHICLE_MAX_BACKWARD_SPEED = -0.35;
export const VEHICLE_MAX_ANGULAR_VELOCITY = 0.12;
export const VEHICLE_ANTI_FLIP_FORCE = 0.18;
export const VEHICLE_UPRIGHT_FORCE = 0.16;
export const VEHICLE_LANDING_STABILIZE_TIME = 1350;
export const VEHICLE_DEFAULT_GRIP = 0.86;
export const VEHICLE_DEFAULT_SUSPENSION = 0.42;
export const VEHICLE_ARCADE_CONTROL_MULTIPLIER = 1.16;
export const VEHICLE_AIR_CONTROL_LIMIT = 0.35;
export const VEHICLE_GROUND_CHECK_DISTANCE = 44;
export const PEAR_MAX_DAMAGE = 100;
export const PEAR_SAFE_LANDING_SPEED = 8.4;
export const PEAR_LAUNCH_FORCE = 12.5;
export const PEAR_LAUNCH_ARC = 5.8;
export const PEAR_FLIGHT_GRAVITY = 0.19;
export const CAMERA_FOLLOW_OFFSET = 240;
export const NEAR_MISS_DISTANCE = 54;
export const COMBO_TIMEOUT = 1400;
export const DEBUG_LEVEL_HELPERS = false;
export const MAX_LEVEL = 50;
export const PREMIUM_STAR_SCORE_BY_TIER = {
  starter: 2500,
  rookiePlus: 4000,
  advanced: 6500,
  veryHard: 9000,
  impossible: 15000,
};
export const PREMIUM_STAR_GLOW = {
  color: 0xffd34a,
  outerColor: 0xfff3a6,
  pulseAlpha: 0.72,
  radius: 38,
};
export const PREMIUM_STAR_COLLECTION_TEXT = [
  'GWIAZDA PREMIUM!',
  'ZŁOTY RYZYKANT!',
  'KOZACKI SEKRET!',
];
export const LEVEL_TIER_CONFIG = {
  starter: {
    catchRadiusMultiplier: 1.6,
    failGraceMultiplier: 1.6,
    vehicleStabilityMultiplier: 1.35,
    cameraLookaheadMultiplier: 1.1,
    obstacleSpacingMultiplier: 1.4,
    landingStabilizeMs: 1000,
    maxEarlySpeedMultiplier: 0.85,
    scoreMultiplier: 1,
  },
  rookiePlus: {
    catchRadiusMultiplier: 1.35,
    failGraceMultiplier: 1.35,
    vehicleStabilityMultiplier: 1.2,
    cameraLookaheadMultiplier: 1.15,
    obstacleSpacingMultiplier: 1.2,
    landingStabilizeMs: 850,
    maxEarlySpeedMultiplier: 0.95,
    scoreMultiplier: 1.25,
  },
  advanced: {
    catchRadiusMultiplier: 1.1,
    failGraceMultiplier: 1.1,
    vehicleStabilityMultiplier: 1,
    cameraLookaheadMultiplier: 1.2,
    obstacleSpacingMultiplier: 1,
    landingStabilizeMs: 700,
    maxEarlySpeedMultiplier: 1.05,
    scoreMultiplier: 1.6,
  },
  veryHard: {
    catchRadiusMultiplier: 0.9,
    failGraceMultiplier: 0.9,
    vehicleStabilityMultiplier: 0.9,
    cameraLookaheadMultiplier: 1.25,
    obstacleSpacingMultiplier: 0.85,
    landingStabilizeMs: 550,
    maxEarlySpeedMultiplier: 1.15,
    scoreMultiplier: 2.1,
  },
  impossible: {
    catchRadiusMultiplier: 0.75,
    failGraceMultiplier: 0.8,
    vehicleStabilityMultiplier: 0.82,
    cameraLookaheadMultiplier: 1.35,
    obstacleSpacingMultiplier: 0.75,
    landingStabilizeMs: 450,
    maxEarlySpeedMultiplier: 1.25,
    scoreMultiplier: 3,
  },
};

export const PRE_START_COUNTDOWN_MS = 5000;

export const DUEL_EVENT_SEND_INTERVAL_MS = 150;
export const DUEL_POSITION_SEND_INTERVAL_MS = 150;
export const DUEL_SCORE_SEND_INTERVAL_MS = 750;
export const DUEL_COUNTDOWN_MS = 5000;
export const DUEL_ATTACK_GRACE_MS = 3000;
export const DUEL_HIT_INVULNERABILITY_MS = 1200;
export const DUEL_GLOBAL_POWERUP_COOLDOWN_MS = 800;
export const DUEL_MAX_HELD_POWERUPS = 1;
export const DUEL_POWERUP_RESPAWN_MS = 8000;
export const DUEL_TRAP_WARNING_MS = 800;
export const DUEL_EVENT_TTL_MS = 10000;
export const DUEL_STALE_SNAPSHOT_MS = 3000;

export const DUEL_MODES = {
  '1v1': { label: '1v1', maxPlayers: 2, teamSize: 1 },
  '2v2': { label: '2v2', maxPlayers: 4, teamSize: 2 },
  '3v3': { label: '3v3', maxPlayers: 6, teamSize: 3 },
  '4v4': { label: '4v4', maxPlayers: 8, teamSize: 4 },
  '5v5': { label: '5v5', maxPlayers: 10, teamSize: 5 },
};

export const DUEL_POWERUPS = {
  rotten_tomato: { id: 'rotten_tomato', type: 'rotten_tomato', pvpType: 'offensive', name: 'Zgnily Pomidor', category: 'attack', rarity: 'common', cooldownMs: 6000, durationMs: 1500, targetMode: 'nearest_enemy', effectStrength: 0.35, warningMs: 0, icon: 'POM', description: 'Splash i krotki slow na najblizszego przeciwnika.', color: 0xe64135 },
  onion_tear: { id: 'onion_tear', type: 'onion_tear', pvpType: 'offensive', name: 'Cebulowa Lza', category: 'trap', rarity: 'common', cooldownMs: 7000, durationMs: 2600, targetMode: 'trap_ahead', effectStrength: 0.42, warningMs: 800, icon: 'CEB', description: 'Sliska plama przed celem.', color: 0xd5b2ff },
  carrot_spike: { id: 'carrot_spike', type: 'carrot_spike', pvpType: 'offensive', name: 'Marchewkowy Kolec', category: 'trap', rarity: 'common', cooldownMs: 6000, durationMs: 5000, targetMode: 'trap_behind', effectStrength: 0.45, warningMs: 800, icon: 'KOL', description: 'Male kolce za graczem.', color: 0xff8a22 },
  broccoli_wall: { id: 'broccoli_wall', type: 'broccoli_wall', pvpType: 'offensive', name: 'Brokulowa Barykada', category: 'trap', rarity: 'rare', cooldownMs: 9000, durationMs: 5200, targetMode: 'trap_ahead', effectStrength: 0.58, warningMs: 800, icon: 'BRO', description: 'Omijalna barykada na trasie.', color: 0x3e9b45 },
  pumpkin_mine: { id: 'pumpkin_mine', type: 'pumpkin_mine', pvpType: 'offensive', name: 'Dyniowa Mina', category: 'trap', rarity: 'rare', cooldownMs: 10000, durationMs: 6500, targetMode: 'trap_behind', effectStrength: 0.7, warningMs: 900, icon: 'MIN', description: 'Mina z knockiem i przerwaniem combo.', color: 0xf08a25 },
  pear_shield: { id: 'pear_shield', type: 'pear_shield', pvpType: 'defensive', name: 'Tarcza Gruszki', category: 'defense', rarity: 'rare', cooldownMs: 8000, durationMs: 3000, targetMode: 'self', effectStrength: 1, warningMs: 0, icon: 'TAR', description: 'Blokuje nastepny ofensywny efekt.', color: 0x6bd6ff },
  anti_slip: { id: 'anti_slip', type: 'anti_slip', pvpType: 'defensive', name: 'Anty-poslizg', category: 'defense', rarity: 'rare', cooldownMs: 7000, durationMs: 4000, targetMode: 'self', effectStrength: 0.75, warningMs: 0, icon: 'ANT', description: 'Zmniejsza poslizg po cebuli.', color: 0x9df75b },
  reflect_attack: { id: 'reflect_attack', type: 'reflect_attack', pvpType: 'defensive', name: 'Odbicie Ataku', category: 'defense', rarity: 'epic', cooldownMs: 11000, durationMs: 3500, targetMode: 'self', effectStrength: 1, warningMs: 0, icon: 'ODB', description: 'Nastepny atak wraca do nadawcy.', color: 0xfff3a6 },
  turbo_juice: { id: 'turbo_juice', type: 'turbo_juice', pvpType: 'boost', name: 'Turbo Sok', category: 'boost', rarity: 'common', cooldownMs: 7000, durationMs: 1600, targetMode: 'self', effectStrength: 0.55, warningMs: 0, icon: 'TUR', description: 'Krotki ryzykowny speed boost.', color: 0xffd34a },
  magnet_seed: { id: 'magnet_seed', type: 'magnet_seed', pvpType: 'boost', name: 'Magnetyczna Pestka', category: 'boost', rarity: 'common', cooldownMs: 7000, durationMs: 5000, targetMode: 'self', effectStrength: 0.5, warningMs: 0, icon: 'MAG', description: 'Przyciaga monety przez kilka sekund.', color: 0xf4d75c },
  team_boost: { id: 'team_boost', type: 'team_boost', pvpType: 'team', name: 'Team Boost', category: 'team_support', rarity: 'epic', cooldownMs: 12000, durationMs: 2200, targetMode: 'own_team', effectStrength: 0.5, warningMs: 0, icon: 'T+B', description: 'Boost dla calej druzyny.', color: 0x74e35c },
  veggie_fog: { id: 'veggie_fog', type: 'veggie_fog', pvpType: 'chaos', name: 'Warzywna Mgla', category: 'chaos', rarity: 'rare', cooldownMs: 8000, durationMs: 2000, targetMode: 'enemy_team', effectStrength: 0.28, warningMs: 0, icon: 'MGL', description: 'Lekka mgla dla przeciwnikow.', color: 0xcfd8dc },
  lane_swap: { id: 'lane_swap', type: 'lane_swap', pvpType: 'chaos', name: 'Zamiana Toru', category: 'chaos', rarity: 'epic', cooldownMs: 9000, durationMs: 900, targetMode: 'nearest_enemy', effectStrength: 0.35, warningMs: 400, icon: 'TOR', description: 'Wymusza mala korekte toru.', color: 0xb9b9ff },
  combo_steal: { id: 'combo_steal', type: 'combo_steal', pvpType: 'chaos', name: 'Kradziez Combo', category: 'chaos', rarity: 'epic', cooldownMs: 9000, durationMs: 0, targetMode: 'nearest_enemy', effectStrength: 0.4, warningMs: 0, icon: 'KOM', description: 'Daje bonus atakujacemu bez zabierania score ofierze.', color: 0x8c4bc6 },
  sabotage_jump: { id: 'sabotage_jump', type: 'sabotage_jump', pvpType: 'chaos', name: 'Sabotaz Skoku', category: 'chaos', rarity: 'epic', cooldownMs: 11000, durationMs: 1000, targetMode: 'nearest_enemy', effectStrength: 0.3, warningMs: 500, icon: 'SAB', description: 'Bardzo krotki debuff skoku.', color: 0x22242b },
};

export const DUEL_ACHIEVEMENTS = {
  first_blood: { key: 'first_blood', name: 'Pierwsza Krew', description: 'Pierwsza wygrana DUEL.' },
  master_1v1: { key: 'master_1v1', name: 'Mistrz 1v1', description: '10 wygranych DUEL 1v1.' },
  team_king: { key: 'team_king', name: 'Druzynowy Krol', description: '10 wygranych w trybach team.' },
  mvp_pear: { key: 'mvp_pear', name: 'MVP Gruszka', description: '5 razy MVP w DUEL.' },
  broccoli_slayer: { key: 'broccoli_slayer', name: 'Pogromca Brokulow', description: 'Wygrana na bossowym levelu PvP.' },
  rocket_dominator: { key: 'rocket_dominator', name: 'Rakietowy Dominator', description: 'Wygrana na szybkim levelu PvP.' },
  undefeated: { key: 'undefeated', name: 'Niepokonany', description: '5 zwyciestw z rzedu.' },
  comeback_legend: { key: 'comeback_legend', name: 'Powrot Legendy', description: 'Wygrana po poprzedniej porazce.' },
};
