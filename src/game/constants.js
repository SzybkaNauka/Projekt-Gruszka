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
