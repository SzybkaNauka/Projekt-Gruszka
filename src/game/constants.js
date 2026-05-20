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
export const DUEL_ATTACK_GRACE_MS = 3000;
export const DUEL_HIT_INVULNERABILITY_MS = 1200;
export const DUEL_MAX_HELD_POWERUPS = 1;
export const DUEL_POWERUP_RESPAWN_MS = 8000;
export const DUEL_TRAP_WARNING_MS = 800;

export const DUEL_MODES = {
  '1v1': { label: '1v1', maxPlayers: 2, teamSize: 1 },
  '2v2': { label: '2v2', maxPlayers: 4, teamSize: 2 },
  '3v3': { label: '3v3', maxPlayers: 6, teamSize: 3 },
  '4v4': { label: '4v4', maxPlayers: 8, teamSize: 4 },
  '5v5': { label: '5v5', maxPlayers: 10, teamSize: 5 },
};

export const DUEL_POWERUPS = {
  rotten_tomato: { type: 'rotten_tomato', name: 'Zgnily Pomidor', category: 'attack', cooldownMs: 3400, durationMs: 1500, color: 0xe64135 },
  onion_tear: { type: 'onion_tear', name: 'Cebulowa Lza', category: 'trap', cooldownMs: 3800, durationMs: 2600, color: 0xd5b2ff },
  carrot_spike: { type: 'carrot_spike', name: 'Marchewkowy Kolec', category: 'trap', cooldownMs: 4200, durationMs: 5000, color: 0xff8a22 },
  broccoli_wall: { type: 'broccoli_wall', name: 'Brokulowa Barykada', category: 'trap', cooldownMs: 5200, durationMs: 5200, color: 0x3e9b45 },
  pumpkin_mine: { type: 'pumpkin_mine', name: 'Dyniowa Mina', category: 'trap', cooldownMs: 7000, durationMs: 6500, color: 0xf08a25 },
  pear_shield: { type: 'pear_shield', name: 'Tarcza Gruszki', category: 'defense', cooldownMs: 5000, durationMs: 3000, color: 0x6bd6ff },
  anti_slip: { type: 'anti_slip', name: 'Anty-poslizg', category: 'defense', cooldownMs: 4600, durationMs: 4000, color: 0x9df75b },
  reflect_attack: { type: 'reflect_attack', name: 'Odbicie Ataku', category: 'defense', cooldownMs: 8200, durationMs: 3500, color: 0xfff3a6 },
  turbo_juice: { type: 'turbo_juice', name: 'Turbo Sok', category: 'boost', cooldownMs: 4300, durationMs: 1600, color: 0xffd34a },
  magnet_seed: { type: 'magnet_seed', name: 'Magnetyczna Pestka', category: 'boost', cooldownMs: 4800, durationMs: 5000, color: 0xf4d75c },
  team_boost: { type: 'team_boost', name: 'Team Boost', category: 'team_support', cooldownMs: 9000, durationMs: 2200, color: 0x74e35c },
  veggie_fog: { type: 'veggie_fog', name: 'Warzywna Mgla', category: 'chaos', cooldownMs: 5200, durationMs: 2000, color: 0xcfd8dc },
  lane_swap: { type: 'lane_swap', name: 'Zamiana Toru', category: 'chaos', cooldownMs: 5600, durationMs: 900, color: 0xb9b9ff },
  combo_steal: { type: 'combo_steal', name: 'Kradziez Combo', category: 'chaos', cooldownMs: 6200, durationMs: 0, color: 0x8c4bc6 },
  sabotage_jump: { type: 'sabotage_jump', name: 'Sabotaz Skoku', category: 'chaos', cooldownMs: 6800, durationMs: 1000, color: 0x22242b },
};
