import Phaser from 'phaser';
import { levels } from './levels.js';
import { playSound, setAudioEnabled } from './audio.js';
import {
  addConfetti,
  addDustPuff,
  addLevelBackdrop,
  addSparkBurst,
  createCoinSprite,
  createGapSprite,
  createLandingMarker,
  createObstacleSprite,
  createPearSprite,
  createVehicleSprite,
  setPearMood,
} from './visuals.js';
import {
  CAMERA_FOLLOW_OFFSET,
  CAMERA_LOOKAHEAD_EASY,
  CAMERA_LOOKAHEAD_FAST,
  COMBO_TIMEOUT,
  DEBUG_LEVEL_HELPERS,
  EARLY_LEVEL_CATCH_RADIUS_MULTIPLIER,
  EARLY_LEVEL_STABILITY_BONUS,
  FAIL_GRACE_DISTANCE_EASY,
  FAIL_GRACE_DISTANCE_HARD,
  FAIL_GRACE_DISTANCE_NORMAL,
  LANDING_STABILIZE_TIME,
  LEVEL_TIER_CONFIG,
  LEVEL_WORLD_WIDTH,
  MAX_LEVEL,
  NEAR_MISS_DISTANCE,
  OUT_OF_SCREEN_GRACE_TIME,
  PEAR_FLIGHT_GRAVITY,
  PEAR_LAUNCH_ARC,
  PEAR_LAUNCH_FORCE,
  PEAR_MAX_DAMAGE,
  PEAR_SAFE_LANDING_SPEED,
  VEHICLE_ACCELERATION,
  VEHICLE_AIR_CONTROL_LIMIT,
  VEHICLE_ANTI_FLIP_FORCE,
  VEHICLE_ARCADE_CONTROL_MULTIPLIER,
  VEHICLE_BASE_SPEED,
  VEHICLE_DEFAULT_GRIP,
  VEHICLE_DEFAULT_SUSPENSION,
  VEHICLE_FORWARD_RECOVERY_FORCE,
  VEHICLE_GROUND_CHECK_DISTANCE,
  VEHICLE_LANDING_STABILIZE_TIME,
  VEHICLE_MAX_ANGULAR_VELOCITY,
  VEHICLE_MAX_BACKWARD_SPEED,
  VEHICLE_MAX_SPEED,
  VEHICLE_MIN_FORWARD_SPEED,
  VEHICLE_STABILITY,
  VEHICLE_TURN_FORCE,
  VEHICLE_TURN_FORCE_EASY,
  VEHICLE_TURN_FORCE_HARD,
  VEHICLE_TURN_FORCE_NORMAL,
  VEHICLE_UPRIGHT_FORCE,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from './constants.js';

const vehicleTypes = {
  wooden: { label: 'Drewniana Katapulta', color: 0x9b6332, accent: 0x54311c, speed: 0.82, turn: 0.9, stability: 1.35, mass: 1, acceleration: 0.055, grip: 0.94, suspension: 0.5, maxTurnAngle: 7 },
  pumpkin: { label: 'Dyniowy Wózek', color: 0xf08a25, accent: 0x7b3e16, speed: 1.12, turn: 1.08, stability: 1.0, mass: 0.86, acceleration: 0.064, grip: 0.82, suspension: 0.48, maxTurnAngle: 9 },
  stone: { label: 'Kamienny Taran', color: 0x858a91, accent: 0x4a4f56, speed: 0.76, turn: 0.66, stability: 1.7, mass: 1.45, acceleration: 0.044, grip: 0.98, suspension: 0.32, maxTurnAngle: 5 },
  rocket: { label: 'Rakietowa Taczka', color: 0xd64839, accent: 0xffd85d, speed: 1.42, turn: 1.18, stability: 0.98, mass: 0.76, acceleration: 0.075, grip: 0.9, suspension: 0.42, maxTurnAngle: 8 },
  golden: { label: 'Złota Katapulta', color: 0xf4d75c, accent: 0x8d6112, speed: 1.05, turn: 1.05, stability: 1.55, mass: 1, acceleration: 0.06, grip: 0.97, suspension: 0.52, maxTurnAngle: 5 },
};

const prototypeRoute = levels[0].route;
const chaosTexts = ['RYZYKO!', 'GRUSZKA ŻYJE!', 'PRAWIE!', 'WARZYWNY CHAOS!', 'SAŁATKOWA MASAKRA!', 'MEGA LOT!', 'NIE HAMUJ!'];
const obstacleStats = {
  rock: { label: 'kamień', w: 48, h: 42, color: 0x787d84, score: 150, damage: 18, breakable: false },
  crate: { label: 'skrzynka', w: 54, h: 54, color: 0xb77436, score: 150, damage: 14, breakable: true },
  fence: { label: 'płot', w: 86, h: 28, color: 0x8c552b, score: 150, damage: 20, breakable: true },
  spikes: { label: 'kolce', w: 74, h: 34, color: 0x2f3338, score: 0, damage: 120, deadly: true },
  veggieMine: { label: 'warzywna mina', w: 46, h: 46, color: 0x8c4bc6, score: 0, damage: 120, deadly: true },
  onionSlick: { label: 'cebula', w: 120, h: 36, color: 0xd5b2ff, score: 0, damage: 6, slick: true },
  rotatingBeam: { label: 'belka', w: 132, h: 24, color: 0x704327, score: 150, damage: 26, breakable: false, rotating: true },
  fallingTomato: { label: 'pomidor', w: 42, h: 42, color: 0xe64135, score: 150, damage: 24, falling: true },
  broccoliBarricade: { label: 'brokuły', w: 92, h: 58, color: 0x3e9b45, score: 150, damage: 22, breakable: true },
  stoneWall: { label: 'kamienna ściana', w: 76, h: 76, color: 0x555a61, score: 0, damage: 130, deadly: true },
};

const arcSettings = {
  low: { frames: 44, lift: 0.86 },
  medium: { frames: 52, lift: 1 },
  high: { frames: 62, lift: 1.16 },
};

const difficultySettings = {
  easy: { catchMultiplier: 1.18, speedSlack: 8.4 },
  normal: { catchMultiplier: 1, speedSlack: 6.6 },
  hard: { catchMultiplier: 0.92, speedSlack: 5.2 },
  extreme: { catchMultiplier: 0.84, speedSlack: 4.7 },
};

const tierCatchMinimums = {
  starter: 180,
  rookiePlus: 150,
  advanced: 120,
  veryHard: 96,
  impossible: 84,
};

function levelTier(levelNumber) {
  if (levelNumber <= 3) return 'easy';
  if (levelNumber <= 6) return 'normal';
  return 'hard';
}

function tierTurnForce(levelNumber) {
  if (levelNumber <= 3) return VEHICLE_TURN_FORCE_EASY;
  if (levelNumber <= 7) return VEHICLE_TURN_FORCE_NORMAL;
  return VEHICLE_TURN_FORCE_HARD;
}

function tierFailGrace(levelNumber) {
  if (levelNumber <= 2) return FAIL_GRACE_DISTANCE_EASY;
  if (levelNumber <= 6) return FAIL_GRACE_DISTANCE_NORMAL;
  return FAIL_GRACE_DISTANCE_HARD;
}

function zoneCenter(zone) {
  if (typeof zone === 'number') {
    return zone;
  }
  return ((zone?.start || 0) + (zone?.end || 0)) / 2;
}

function zoneLength(zone) {
  if (typeof zone === 'number') {
    return 0;
  }
  return Math.max(0, (zone?.end || 0) - (zone?.start || 0));
}

function inZone(x, zone) {
  if (typeof zone === 'number') {
    return Math.abs(x - zone) < 90;
  }
  return x >= zone.start && x <= zone.end;
}

function runtimeDebugEnabled() {
  if (DEBUG_LEVEL_HELPERS) return true;
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('debug') === '1';
}

function hasForbiddenSpring(value) {
  const text = String(value || '').toLowerCase();
  return text.includes('spring') || text.includes('boing');
}

function floatingText(scene, x, y, text, color = '#fff3a3', size = 24) {
  scene.activeFloatingText = scene.activeFloatingText || 0;
  if (scene.performanceMode && scene.activeFloatingText >= 6) {
    return;
  }
  scene.activeFloatingText += 1;
  const label = scene.add.text(x, y, text, {
    fontFamily: 'Arial, sans-serif',
    fontSize: `${size}px`,
    fontStyle: '900',
    color,
    stroke: '#291b12',
    strokeThickness: 5,
  }).setOrigin(0.5).setDepth(80);

  scene.tweens.add({
    targets: label,
    y: y - 66,
    alpha: 0,
    scale: 1.15,
    duration: 780,
    ease: 'Cubic.easeOut',
    onComplete: () => {
      label.destroy();
      scene.activeFloatingText -= 1;
    },
  });
}

class PearScene extends Phaser.Scene {
  constructor(onGameEvent, initialLevel = 0, soundEnabled = true, performanceMode = false, mobileInputRef = null, showTouchHints = false) {
    super('PearScene');
    this.onGameEvent = onGameEvent;
    this.levelIndex = Phaser.Math.Clamp(initialLevel, 0, levels.length - 1);
    this.soundEnabled = soundEnabled;
    this.performanceMode = performanceMode;
    this.mobileInputRef = mobileInputRef;
    this.showTouchHints = showTouchHints;
    this.prevMobileJump = false;
  }

  create() {
    console.log('[PearScene] create start', { levelIndex: this.levelIndex, showTouchHints: !!this.showTouchHints });
    try {
      setAudioEnabled(this.soundEnabled);
    this.level = levels[this.levelIndex];
    this.route = this.level.route || prototypeRoute;
    this.validateLevelDesign();
    this.score = 0;
    this.combo = 1;
    this.comboCollect = 0;
    this.maxCombo = 1;
    this.pearDamage = 0;
    this.distanceScoreX = 160;
    this.collectedCoins = 0;
    this.nearMissCount = 0;
    this.startTime = this.time.now;
    this.lastComboAt = 0;
    this.lastTurnSoundAt = 0;
    this.lastEngineAt = 0;
    this.launched = false;
    this.gameDone = false;
    this.isPausedByUi = false;
    this.pendingRequiredVehicle = null;
    this.activeTransfer = null;
    this.nearMissMemory = new Set();
    this.warningMemory = {};
    this.offscreenSince = 0;
    this.bossDropIndex = 0;
    this.stabilizeUntil = 0;
    this.segmentDamage = 0;
    this.perfectSegments = 0;
    this.outWarningSince = 0;
    this.lastDustAt = 0;
    this.lastWheelTrackAt = 0;

    this.matter.world.setBounds(0, 0, this.route.length || LEVEL_WORLD_WIDTH, WORLD_HEIGHT, 64, false, false, false, false);
    this.matter.world.setGravity(0, 0);
    this.cameras.main.setBackgroundColor('#91d7ff');
    this.cameras.main.setBounds(0, 0, this.route.length || LEVEL_WORLD_WIDTH, WORLD_HEIGHT);

    this.addWorldArt();
    this.createRoute();
    if (!this.performanceMode) {
      this.addReadabilityMarkers();
    }
    this.addDebugHelpers();
    this.createPear();
    this.createVehicle(this.route.startVehicle || 'wooden', 190, this.route.startY || 430, true);
    this.setupInput();
    this.setupCollisions();
    this.emitHud();
    // Pre-start countdown before gameplay begins
    this.isPreStartCountdown = true;
    this.countdownRemainingMs = PRE_START_COUNTDOWN_MS;
    this.countdownOverlay = this.add.container(0, 0).setDepth(200).setScrollFactor(0);
    this.countdownBg = this.add.rectangle(this.cameras.main.scrollX + WORLD_WIDTH / 2, WORLD_HEIGHT / 2, WORLD_WIDTH, WORLD_HEIGHT, 0x000000, 0.28).setScrollFactor(0).setDepth(201);
    this.countdownTitle = this.add.text(this.cameras.main.scrollX + WORLD_WIDTH / 2, WORLD_HEIGHT / 2 - 80, 'PRZYGOTUJ SIĘ!', {
      fontFamily: 'Arial, sans-serif', fontSize: '28px', fontStyle: '900', color: '#fff9d8', stroke: '#2b2b1d', strokeThickness: 6,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(202);
    this.countdownNumber = this.add.text(this.cameras.main.scrollX + WORLD_WIDTH / 2, WORLD_HEIGHT / 2 + 6, '5', {
      fontFamily: 'Arial, sans-serif', fontSize: '86px', fontStyle: '900', color: '#ffd34a', stroke: '#582e05', strokeThickness: 10,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(202);
    this.countdownLevelInfo = this.add.text(this.cameras.main.scrollX + WORLD_WIDTH / 2, WORLD_HEIGHT / 2 + 86, `Level ${this.level.id} — ${this.level.name}` , {
      fontFamily: 'Arial, sans-serif', fontSize: '18px', fontStyle: '900', color: '#ffffff', stroke: '#2b2b1d', strokeThickness: 4,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(202);
    // optional touch/keyboard hint during countdown
    if (this.showTouchHints) {
      const isTouch = !!this.mobileInputRef;
      const hintText = isTouch ? 'Lewa ręka: sterowanie\nPrawa ręka: SKOK' : 'A/D lub ←→: sterowanie\nSpacja: SKOK';
      this.countdownHint = this.add.text(this.cameras.main.scrollX + WORLD_WIDTH / 2, WORLD_HEIGHT / 2 + 138, hintText, {
        fontFamily: 'Arial, sans-serif', fontSize: '14px', fontStyle: '900', color: '#ffffff', stroke: '#2b2b1d', strokeThickness: 3, align: 'center',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(202);
      this.countdownOverlay.add(this.countdownHint);
    }
    this.countdownOverlay.add([this.countdownBg, this.countdownTitle, this.countdownNumber, this.countdownLevelInfo]);
    if (!this.performanceMode) {
      floatingText(this, 310, 320, this.level.pearTheme?.abilityFlavorText || 'NIE HAMUJ!', '#ffffff', 30);
    }
    if (import.meta.env.DEV) {
      try {
        this.add.text(200, 200, 'PHASER OK', { fontFamily: 'Arial', fontSize: '22px', color: '#ffffff', backgroundColor: 'rgba(0,0,0,0.4)' }).setDepth(9999);
      } catch (e) {
        console.warn('[PearScene] dev text failed', e);
      }
    }
    console.log('[PearScene] create complete', { levelId: this.level?.id, routeLength: this.route?.length });
  } catch (err) {
      console.error('[PearScene] create error', err);
      throw err;
    }

  }
  setPaused(paused) {
    this.isPausedByUi = paused;
    if (paused) {
      this.matter.world.pause();
      this.tweens.pauseAll();
      this.time.timeScale = 0;
    } else if (!this.gameDone) {
      this.matter.world.resume();
      this.tweens.resumeAll();
      this.time.timeScale = 1;
    }
  }

  forceNextPear() {
    this.launchPear();
  }

  addWorldArt() {
    const length = this.route.length || LEVEL_WORLD_WIDTH;
    addLevelBackdrop(this, this.levelIndex, { ...this.route, length }, WORLD_HEIGHT);
    this.add.text(32, 32, 'Gruszka Katapulta', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '24px',
      fontStyle: '900',
      color: '#26442a',
    }).setDepth(5);
  }

  getTierConfig() {
    return LEVEL_TIER_CONFIG[this.level?.difficultyTier] || LEVEL_TIER_CONFIG.starter;
  }

  createRoute() {
    const { top, bottom } = this.route.road;
    const length = this.route.length || LEVEL_WORLD_WIDTH;
    this.add.rectangle(length / 2, (top + bottom) / 2, length, bottom - top, 0x65533b, 1).setDepth(-8);
    this.add.rectangle(length / 2, top, length, 12, 0xe7d18b, 0.8).setDepth(-7);
    this.add.rectangle(length / 2, bottom, length, 12, 0xe7d18b, 0.8).setDepth(-7);

    this.route.gaps?.forEach((gap) => {
      createGapSprite(this, gap, top, bottom);
      this.add.text(gap.x, top + 46, 'WYSTRZEL!', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '24px',
        fontStyle: '900',
        color: '#fff6c9',
        stroke: gap.type === 'kwas' ? '#31551f' : '#20394b',
        strokeThickness: 5,
      }).setOrigin(0.5).setDepth(4);
    });

    this.coins = (this.route.coins || []).map((coin) => {
      const dot = createCoinSprite(this, coin.x, coin.y).setDepth(12);
      dot.setData('collected', false);
      return dot;
    });

    this.targetVehicles = (this.route.vehicles || []).map((data) => this.createVehicle(data.type, data.x, data.y, false, data));
    this.obstacles = (this.route.obstacles || []).map((data, index) => this.createObstacle(data, index)).filter(Boolean);
    this.finish = this.add.rectangle(this.route.finishX, (top + bottom) / 2, 22, bottom - top + 80, 0xffffff, 0.82).setDepth(9);
    this.add.text(this.route.finishX + 54, top + 50, 'META', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '26px',
      fontStyle: '900',
      color: '#1d2d1c',
      stroke: '#fff6c9',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(10);
  }

  addReadabilityMarkers() {
    const road = this.route.road;
    this.route.transitions?.forEach((transition) => {
      const launchCenter = zoneCenter(transition.launchZoneX);
      const launchWidth = zoneLength(transition.launchZoneX);
      this.add.rectangle(launchCenter, road.top + 22, Math.max(80, launchWidth), 10, 0xf4d75c, 0.8).setDepth(11);
      this.add.text(launchCenter, road.top + 48, 'SKACZ!', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '18px',
        fontStyle: '900',
        color: '#fff6c9',
        stroke: '#5f3b10',
        strokeThickness: 4,
      }).setOrigin(0.5).setDepth(12);
      createLandingMarker(this, transition.targetVehicleX, transition.targetVehicleY - 58, { radius: 24 }).setDepth(11);
      this.add.text(transition.targetVehicleX, road.top + 30, 'LĄDUJ', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        fontStyle: '900',
        color: '#eaffdc',
        stroke: '#21451c',
        strokeThickness: 4,
      }).setOrigin(0.5).setDepth(12);
    });

    this.route.obstacles?.forEach((obstacle) => {
      const stats = obstacleStats[obstacle.type];
      if (!obstacle.deadly && !stats?.deadly) {
        return;
      }
      this.add.triangle(obstacle.x, obstacle.y - 54, 0, 26, 16, 0, 32, 26, 0xf05d3f, 0.9).setDepth(12);
      this.add.text(obstacle.x, obstacle.y - 84, 'UWAZAJ!', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '15px',
        fontStyle: '900',
        color: '#ffe1d6',
        stroke: '#5b1510',
        strokeThickness: 4,
      }).setOrigin(0.5).setDepth(12);
    });
  }

  addDebugHelpers() {
    if (!runtimeDebugEnabled()) {
      return;
    }
    const g = this.add.graphics().setDepth(90);
    this.route.transitions?.forEach((transition) => {
      const width = zoneLength(transition.launchZoneX);
      const center = zoneCenter(transition.launchZoneX);
      g.lineStyle(3, 0x74e35c, 0.75);
      g.strokeRect(center - width / 2, this.route.road.top, Math.max(8, width), this.route.road.bottom - this.route.road.top);
      g.lineStyle(2, 0xffffff, 0.7);
      g.lineBetween(center, this.route.road.top, transition.targetVehicleX, transition.targetVehicleY);
      g.lineStyle(3, 0x6bd6ff, 0.75);
      g.strokeCircle(transition.targetVehicleX, transition.targetVehicleY - 58, transition.safeCatchRadius);
    });
    this.debugVehicleText = this.add.text(18, 86, '', {
      fontFamily: 'monospace',
      fontSize: '15px',
      color: '#ffffff',
      backgroundColor: 'rgba(0,0,0,0.45)',
      padding: { x: 8, y: 6 },
    }).setScrollFactor(0).setDepth(99);
  }

  validateLevelDesign() {
    const warnings = [];
    const route = this.route;
    const road = route.road || { top: 220, bottom: 620 };
    const transitions = route.transitions || [];
    const obstacles = route.obstacles || [];
    const allowedVehicles = new Set(Object.keys(vehicleTypes));
    const tierConfig = LEVEL_TIER_CONFIG[this.level?.difficultyTier];
    const serializedLevel = JSON.stringify(this.level).toLowerCase();

    if (this.level.id < 1 || this.level.id > MAX_LEVEL) warnings.push(`level_id poza zakresem 1-${MAX_LEVEL}`);
    if (!tierConfig) warnings.push(`nieznany difficultyTier: ${this.level?.difficultyTier}`);
    if (!this.level.starThresholds) warnings.push('level nie ma starThresholds');
    if (!route.finishX) warnings.push('level nie ma mety / finishX');
    if (!allowedVehicles.has(route.startVehicle)) warnings.push(`nieznany startVehicle: ${route.startVehicle}`);
    if (serializedLevel.includes('spring') || serializedLevel.includes('boing')) {
      warnings.push('level zawiera zakazana mechanike spring/BOING');
    }

    obstacles.forEach((obstacle) => {
      if (obstacle.x < 520) {
        warnings.push(`przeszkoda ${obstacle.type} stoi za blisko startu (${obstacle.x})`);
      }
      if (String(obstacle.type).toLowerCase().includes('spring')) {
        warnings.push(`przeszkoda ${obstacle.type} uzywa zakazanej mechaniki spring`);
      }
    });

    transitions.forEach((transition, index) => {
      const launchCenter = zoneCenter(transition.launchZoneX);
      const launchLength = zoneLength(transition.launchZoneX);
      const dx = transition.targetVehicleX - launchCenter;
      const dy = Math.abs(transition.targetVehicleY - ((road.top + road.bottom) / 2));
      const arc = arcSettings[transition.requiredArc] || arcSettings.medium;
      const frames = Phaser.Math.Clamp(dx / 14, 32, 76) * arc.lift;
      const launchVy = ((transition.targetVehicleY - (road.top + road.bottom) / 2) - 0.5 * PEAR_FLIGHT_GRAVITY * frames * frames) / frames;
      const closestAfterLanding = obstacles
        .filter((obstacle) => obstacle.x > transition.targetVehicleX)
        .reduce((min, obstacle) => Math.min(min, obstacle.x - transition.targetVehicleX), Infinity);

      if (!allowedVehicles.has(transition.targetVehicleType)) warnings.push(`przesiadka ${index + 1}: nieznany pojazd ${transition.targetVehicleType}`);
      if (String(transition.targetVehicleType).toLowerCase().includes('spring')) {
        warnings.push(`przesiadka ${index + 1}: zakazany spring vehicle`);
      }
      if (dx > 980) warnings.push(`przesiadka ${index + 1}: pojazd docelowy za daleko (${Math.round(dx)} px)`);
      if (dy > 230) warnings.push(`przesiadka ${index + 1}: pojazd docelowy za wysoko/nisko (${Math.round(dy)} px)`);
      if (launchLength < 180) warnings.push(`przesiadka ${index + 1}: launchZone jest krótki (${Math.round(launchLength)} px)`);
      if (Math.abs(launchVy) > 9.5) warnings.push(`przesiadka ${index + 1}: wymaga nierealnego kąta (${launchVy.toFixed(2)})`);
      if (closestAfterLanding < 260) warnings.push(`przesiadka ${index + 1}: za mało miejsca po lądowaniu (${Math.round(closestAfterLanding)} px)`);
    });

    const lastObstacleBeforeFinish = obstacles.filter((obstacle) => obstacle.x < route.finishX).at(-1);
    if (lastObstacleBeforeFinish && route.finishX - lastObstacleBeforeFinish.x < 360) {
      warnings.push(`meta za blisko ostatniej przeszkody (${Math.round(route.finishX - lastObstacleBeforeFinish.x)} px)`);
    }

    if (warnings.length > 0) {
      console.warn(`[Gruszka Katapulta] Level ${this.level.id} balance warnings:`, warnings);
    }
  }

  createPear() {
    this.pear = createPearSprite(this, 190, 386, { mood: 'normal', theme: this.level.pearTheme }).setDepth(20);
    this.matter.add.gameObject(this.pear, {
      shape: { type: 'circle', radius: 26 },
      frictionAir: 0.018,
      restitution: 0.18,
      density: 0.003,
      label: 'pear',
    });
    this.pear.setData('kind', 'pear');
    this.pear.setIgnoreGravity(true);
    this.pear.setStatic(true);
  }

  createVehicle(type, x, y, controllable = false, source = {}) {
    let safeType = type;
    if (hasForbiddenSpring(type) || !vehicleTypes[type]) {
      if (runtimeDebugEnabled()) console.error('[Gruszka Katapulta] forbidden/unknown vehicle fallback:', type);
      safeType = 'wooden';
    }
    const stats = vehicleTypes[safeType] || vehicleTypes.wooden;
    const vehicle = createVehicleSprite(this, x, y, safeType, {
      label: stats.label.split(' ')[0],
      controllable,
    }).setDepth(controllable ? 18 : 13);
    this.matter.add.gameObject(vehicle, {
      shape: { type: 'rectangle', width: 112, height: 46 },
      frictionAir: 0.08,
      restitution: 0.08,
      density: 0.004 * stats.mass,
      label: controllable ? 'playerVehicle' : 'targetVehicle',
    });
    vehicle.setData('kind', controllable ? 'playerVehicle' : 'targetVehicle');
    vehicle.setData('vehicleType', safeType);
    vehicle.setData('vehicleLabel', stats.label);
    vehicle.setData('stats', stats);
    vehicle.setData('required', Boolean(source.required));
    vehicle.setData('caught', false);
    vehicle.setData('recoveryUntil', 0);
    vehicle.setData('canReverse', false);
    const transferData = this.route.transitions?.find((transition) => (
      Math.abs(transition.targetVehicleX - x) < 8
      && transition.targetVehicleType === safeType
    ));
    vehicle.setData('transfer', transferData || null);
    if (!controllable && (source.moveY || source.moveX)) {
      this.tweens.add({
        targets: vehicle,
        x: x + (source.moveX || 0),
        y: y + (source.moveY || 0),
        duration: source.moveDuration || 1400,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
    if (controllable) {
      this.vehicle = vehicle;
      this.currentVehicleType = safeType;
      this.currentVehicleLabel = stats.label;
      this.speed = VEHICLE_BASE_SPEED * stats.speed;
    }
    return vehicle;
  }

  createObstacle(data, index) {
    const safeData = { ...data };
    if (hasForbiddenSpring(safeData.type) || !obstacleStats[safeData.type]) {
      if (runtimeDebugEnabled()) console.error('[Gruszka Katapulta] forbidden/unknown obstacle fallback:', safeData.type);
      safeData.type = 'crate';
      safeData.deadly = false;
      safeData.hint = safeData.hint || 'OBJAZD';
    }
    const stats = obstacleStats[safeData.type];
    if (!stats) {
      return null;
    }
    const obj = createObstacleSprite(this, safeData.x, safeData.y, safeData.type, stats, safeData).setDepth(14);
    obj.setData('kind', 'obstacle');
    obj.setData('id', `obstacle-${index}`);
    obj.setData('type', safeData.type);
    obj.setData('stats', { ...stats, deadly: safeData.deadly || stats.deadly });
    if (safeData.hint) {
      this.add.text(safeData.x, safeData.y - 54, safeData.hint, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '17px',
        fontStyle: '900',
        color: '#fff6c9',
        stroke: '#291b12',
        strokeThickness: 4,
      }).setOrigin(0.5).setDepth(15);
    }
    this.matter.add.gameObject(obj, {
      isStatic: !stats.falling,
      isSensor: stats.slick || stats.deadly,
      shape: { type: 'rectangle', width: stats.w, height: stats.h },
      label: `obstacle-${safeData.type}`,
    });
    if (stats.rotating) {
      this.tweens.add({ targets: obj, angle: 360, duration: 1350, repeat: -1, ease: 'Linear' });
    }
    if (stats.falling) {
      obj.setVelocity(0, 1.2);
      obj.setBounce(0.4);
    }
    return obj;
  }

  setupInput() {
    this.keys = this.input.keyboard?.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.LEFT,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      d: Phaser.Input.Keyboard.KeyCodes.D,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
      r: Phaser.Input.Keyboard.KeyCodes.R,
    });
    this.input.keyboard?.on('keydown-SPACE', () => this.launchPear());
    this.input.keyboard?.on('keydown-R', () => this.scene.restart());
    this.pointerSteer = 0;
    this.input.on('pointerdown', (pointer) => {
      if (this.gameDone || this.isPausedByUi) {
        return;
      }
      // Pointer steer for mouse/touch dragging on left/right half remains.
      this.pointerSteer = pointer.x < this.scale.width / 2 ? -1 : 1;
    });
    this.input.on('pointerup', () => {
      this.pointerSteer = 0;
    });
    this.input.on('pointerupoutside', () => {
      this.pointerSteer = 0;
    });
  }

  setupCollisions() {
    this.matter.world.on('collisionstart', (event) => {
      if (this.gameDone || this.isPausedByUi) {
        return;
      }
      event.pairs.forEach((pair) => this.handleCollision(pair));
    });
  }

  handleCollision(pair) {
    const a = pair.bodyA.gameObject;
    const b = pair.bodyB.gameObject;
    if (!a || !b) {
      return;
    }
    const objects = [a, b];
    const pearHit = objects.find((object) => object.getData?.('kind') === 'pear');
    const vehicleHit = objects.find((object) => object.getData?.('kind') === 'targetVehicle');
    const obstacle = objects.find((object) => object.getData?.('kind') === 'obstacle');
    const playerVehicle = objects.find((object) => object.getData?.('kind') === 'playerVehicle');
    const speed = Math.hypot(pair.bodyA.velocity.x - pair.bodyB.velocity.x, pair.bodyA.velocity.y - pair.bodyB.velocity.y);

    if (pearHit && vehicleHit && this.launched) {
      this.tryLandOnVehicle(vehicleHit, speed);
      return;
    }

    if ((pearHit || playerVehicle) && obstacle) {
      this.hitObstacle(obstacle, speed, Boolean(pearHit));
    }
  }

  getNextTransfer() {
    return this.route.transitions?.find((transition) => {
      const vehicle = this.findVehicleForTransfer(transition);
      return vehicle?.active && !vehicle.getData('caught') && transition.targetVehicleX > this.vehicle.x + 180;
    }) || null;
  }

  findVehicleForTransfer(transition) {
    if (!transition) {
      return null;
    }
    return this.targetVehicles.find((vehicle) => (
      vehicle.active
      && !vehicle.getData('caught')
      && Math.abs(vehicle.x - transition.targetVehicleX) < 140
      && vehicle.getData('vehicleType') === transition.targetVehicleType
    )) || null;
  }

  warnPlayer(text, x, y, key = text) {
    if (this.time.now - (this.warningMemory[key] || 0) < 900) {
      return;
    }
    this.warningMemory[key] = this.time.now;
    floatingText(this, x, y, text, '#ffffff', 24);
  }

  logEarlyTransfer(stage, transition, extra = {}) {
    if (!runtimeDebugEnabled() || !transition) {
      return;
    }
    const launchX = zoneCenter(transition.launchZoneX);
    console.warn('[Gruszka Katapulta BALANCE]', {
      level: this.levelIndex + 1,
      stage,
      launchX,
      targetVehicleX: transition.targetVehicleX,
      targetVehicleY: transition.targetVehicleY,
      distance: Math.round(transition.targetVehicleX - launchX),
      catchRadius: this.getCatchRadius(transition),
      failGraceDistance: this.getFailGraceDistance(transition),
      ...extra,
    });
  }

  getCatchRadius(transition) {
    const difficulty = difficultySettings[transition?.landingDifficulty || transition?.difficulty] || difficultySettings.normal;
    const earlyMultiplier = this.levelIndex <= 1 ? EARLY_LEVEL_CATCH_RADIUS_MULTIPLIER : this.levelIndex <= 2 ? 1.12 : 1;
    const radius = (transition?.safeCatchRadius || transition?.catchZone?.radius || 110) * difficulty.catchMultiplier * earlyMultiplier * this.getTierConfig().catchRadiusMultiplier;
    return Math.max(radius, tierCatchMinimums[this.level?.difficultyTier] || 100);
  }

  getFailGraceDistance(transition) {
    return Math.max(transition?.failGraceDistance || 0, tierFailGrace(this.levelIndex + 1)) * this.getTierConfig().failGraceMultiplier;
  }

  getLandingDifficulty(transition) {
    return difficultySettings[transition?.landingDifficulty || transition?.difficulty] || difficultySettings.normal;
  }

  attachPearToVehicle(pear, vehicle, landingRating = 'GOOD') {
    pear.setVelocity(0, 0);
    pear.setAngularVelocity(0);
    pear.setStatic(true);
    pear.setIgnoreGravity(true);
    pear.setPosition(vehicle.x, vehicle.y - 58);
    pear.setData('attachedTo', vehicle);
    this.stabilizeAfterLanding(vehicle, pear, landingRating);
  }

  detachPearForLaunch(pear, vehicle) {
    pear.setData('attachedTo', null);
    pear.setStatic(false);
    pear.setIgnoreGravity(false);
    pear.setPosition(vehicle.x + 50, vehicle.y - 48);
    this.enterVehicleRecovery(vehicle, 420);
  }

  stabilizeAfterLanding(vehicle, pear, landingRating = 'GOOD') {
    const baseDuration = Math.max(VEHICLE_LANDING_STABILIZE_TIME, this.getTierConfig().landingStabilizeMs);
    const duration = landingRating === 'UGLY' ? baseDuration * 1.25 : baseDuration;
    this.enterVehicleRecovery(vehicle, duration);
    vehicle.setAngularVelocity(landingRating === 'UGLY' ? 0.045 : 0);
    pear.setAngularVelocity(0);
  }

  isVehicleGrounded(vehicle = this.vehicle) {
    if (!vehicle?.active) {
      return false;
    }
    const road = this.route.road;
    return vehicle.y >= road.top + VEHICLE_GROUND_CHECK_DISTANCE && vehicle.y <= road.bottom - 18;
  }

  enterVehicleRecovery(vehicle = this.vehicle, duration = VEHICLE_LANDING_STABILIZE_TIME) {
    if (!vehicle?.active) {
      return;
    }
    vehicle.setData('recoveryUntil', Math.max(vehicle.getData('recoveryUntil') || 0, this.time.now + duration));
  }

  preventVehicleReverse(vehicle = this.vehicle, profile = {}) {
    if (!vehicle?.active || profile.canReverse) {
      return;
    }
    const velocity = vehicle.body?.velocity || { x: 0, y: 0 };
    const minForward = profile.minForwardVelocity || VEHICLE_MIN_FORWARD_SPEED;
    if (velocity.x < VEHICLE_MAX_BACKWARD_SPEED) {
      if (runtimeDebugEnabled()) console.warn('[Gruszka Katapulta] vehicle reverse prevented', vehicle.getData('vehicleType'), velocity.x);
      vehicle.setVelocity(Math.max(VEHICLE_MAX_BACKWARD_SPEED, velocity.x + VEHICLE_FORWARD_RECOVERY_FORCE), velocity.y);
    }
    if (velocity.x < minForward) {
      vehicle.setVelocity(Phaser.Math.Linear(velocity.x, minForward, 0.045), velocity.y);
    }
  }

  stabilizeVehicle(vehicle = this.vehicle, delta = 1, profile = {}) {
    if (!vehicle?.active) {
      return;
    }
    const type = vehicle.getData('vehicleType');
    const maxAngle = profile.maxTurnAngle ?? vehicle.getData('stats')?.maxTurnAngle ?? 8;
    const maxAngular = profile.maxAngularVelocity ?? VEHICLE_MAX_ANGULAR_VELOCITY;
    const upright = profile.uprightForce ?? VEHICLE_UPRIGHT_FORCE;
    const recovery = this.time.now < (vehicle.getData('recoveryUntil') || 0);
    const angle = Phaser.Math.Angle.WrapDegrees(vehicle.angle);
    const correction = Phaser.Math.Clamp(-angle * upright * 0.016 * delta, -maxAngular, maxAngular);
    vehicle.setAngularVelocity(Phaser.Math.Clamp((vehicle.body?.angularVelocity || 0) * (recovery ? 0.35 : 0.7) + correction, -maxAngular, maxAngular));
    if (Math.abs(angle) > maxAngle) {
      vehicle.setAngle(Phaser.Math.Linear(vehicle.angle, Phaser.Math.Clamp(angle, -maxAngle, maxAngle), VEHICLE_ANTI_FLIP_FORCE));
      if (runtimeDebugEnabled()) console.warn('[Gruszka Katapulta] angle corrected', type, Math.round(angle));
    }
  }

  applyVehicleGrip(vehicle = this.vehicle, input = 0, profile = {}, delta = 1) {
    const road = this.route.road;
    const grounded = this.isVehicleGrounded(vehicle);
    const grip = (profile.grip ?? VEHICLE_DEFAULT_GRIP) * (grounded ? 1 : VEHICLE_AIR_CONTROL_LIMIT);
    const turnForce = profile.turnForce || tierTurnForce(this.levelIndex + 1);
    const targetY = Phaser.Math.Clamp(
      vehicle.y + input * turnForce * 54 * VEHICLE_ARCADE_CONTROL_MULTIPLIER * grip * delta,
      road.top + 34,
      road.bottom - 34,
    );
    const verticalVelocity = Phaser.Math.Clamp((targetY - vehicle.y) * (0.35 + grip * 0.22), -5.8, 5.8);
    vehicle.setVelocity(vehicle.body.velocity.x, verticalVelocity);
  }

  updateVehicleMovement(vehicle = this.vehicle, input = 0, delta = 16.666) {
    if (!vehicle?.active) {
      return;
    }
    const dt = delta / 16.666;
    const stats = vehicle.getData('stats') || vehicleTypes.wooden;
    const type = vehicle.getData('vehicleType') || 'wooden';
    const recovery = this.time.now < (vehicle.getData('recoveryUntil') || 0);
    const tier = this.getTierConfig();
    const baseSpeed = VEHICLE_BASE_SPEED;
    const tierSpeed = stats.speed * (tier.maxEarlySpeedMultiplier || 1);
    const stabilityMultiplier = tier.vehicleStabilityMultiplier || 1;
    const profile = {
      forwardSpeed: baseSpeed * tierSpeed,
      targetSpeed: Math.min(VEHICLE_MAX_SPEED * tierSpeed, baseSpeed * tierSpeed + 2.7),
      acceleration: stats.acceleration || VEHICLE_ACCELERATION,
      turnForce: tierTurnForce(this.levelIndex + 1) * stats.turn,
      maxTurnAngle: Math.max(4, (stats.maxTurnAngle || 8) / Math.sqrt(Math.max(0.72, stabilityMultiplier))),
      stability: stats.stability * stabilityMultiplier,
      suspension: stats.suspension ?? VEHICLE_DEFAULT_SUSPENSION,
      grip: stats.grip ?? VEHICLE_DEFAULT_GRIP,
      maxAngularVelocity: VEHICLE_MAX_ANGULAR_VELOCITY / Math.max(0.82, stabilityMultiplier),
      antiFlipForce: VEHICLE_ANTI_FLIP_FORCE * Math.max(0.9, stabilityMultiplier),
      uprightForce: VEHICLE_UPRIGHT_FORCE * Math.max(0.9, stabilityMultiplier),
      canReverse: vehicle.getData('canReverse') || false,
      minForwardVelocity: Math.max(VEHICLE_MIN_FORWARD_SPEED, baseSpeed * tierSpeed * 0.68),
    };
    const currentX = vehicle.body?.velocity?.x || 0;
    const accel = profile.acceleration * (recovery ? 0.55 : 1) * 60 * dt;
    const nextX = Phaser.Math.Clamp(Phaser.Math.Linear(currentX, profile.targetSpeed, accel), profile.minForwardVelocity * 0.8, profile.targetSpeed + 0.6);
    vehicle.setVelocity(nextX, vehicle.body?.velocity?.y || 0);
    this.preventVehicleReverse(vehicle, profile);
    this.applyVehicleGrip(vehicle, input, profile, dt);
    this.stabilizeVehicle(vehicle, dt, profile);
    this.speed = vehicle.body?.velocity?.x || nextX;
  }

  updateVehicleDebug() {
    if (!runtimeDebugEnabled() || !this.debugVehicleText || !this.vehicle?.body) {
      return;
    }
    const velocity = this.vehicle.body.velocity;
    this.debugVehicleText.setText([
      `type: ${this.currentVehicleType}`,
      `vx: ${velocity.x.toFixed(2)} vy: ${velocity.y.toFixed(2)}`,
      `ang: ${(this.vehicle.body.angularVelocity || 0).toFixed(3)} angle: ${Math.round(this.vehicle.angle)}`,
      `grounded: ${this.isVehicleGrounded(this.vehicle)}`,
      `recovery: ${this.time.now < (this.vehicle.getData('recoveryUntil') || 0)}`,
    ]);
  }

  launchPear() {
    if (this.launched || this.gameDone || this.isPausedByUi || !this.vehicle?.active) {
      return;
    }
    const nextTransfer = this.getNextTransfer();
    const next = this.findVehicleForTransfer(nextTransfer)
      || this.targetVehicles.find((vehicle) => !vehicle.getData('caught') && vehicle.x > this.vehicle.x + 220);
    this.pendingRequiredVehicle = next?.getData('required') ? next : null;
    this.activeTransfer = nextTransfer || next?.getData('transfer') || null;
    if (this.activeTransfer && inZone(this.vehicle.x, this.activeTransfer.launchZoneX)) {
      this.warnPlayer('LAP POJAZD!', this.vehicle.x + 70, this.vehicle.y - 92, 'catch-target');
    }
    if (this.activeTransfer && !inZone(this.vehicle.x, this.activeTransfer.launchZoneX)) {
      this.warnPlayer('ŁAP POJAZD!', this.vehicle.x + 70, this.vehicle.y - 92, 'launch-zone');
    }
    this.logEarlyTransfer('launch', this.activeTransfer, {
      vehicleX: Math.round(this.vehicle.x),
      inLaunchZone: this.activeTransfer ? inZone(this.vehicle.x, this.activeTransfer.launchZoneX) : false,
    });
    this.launched = true;
    setPearMood(this, this.pear, 'flying');
    const launchX = this.vehicle.x + 50;
    const launchY = this.vehicle.y - 48;
    this.detachPearForLaunch(this.pear, this.vehicle);
    const rocketBoost = this.currentVehicleType === 'rocket' ? 1.1 : 1;
    if (next) {
      const transition = this.activeTransfer;
      const dx = Math.max(240, next.x - launchX);
      const targetY = next.y - 58;
      const arc = arcSettings[transition?.requiredArc] || arcSettings.medium;
      const frames = Phaser.Math.Clamp(dx / (PEAR_LAUNCH_FORCE + this.speed * 0.65), 36, 74) * arc.lift;
      const vx = Phaser.Math.Clamp(dx / frames, 8.6, 24) * rocketBoost;
      const vy = ((targetY - launchY) - 0.5 * PEAR_FLIGHT_GRAVITY * frames * frames) / frames;
      this.pear.setVelocity(vx, Phaser.Math.Clamp(vy, -9.2, -1.4));
    } else {
      this.pear.setVelocity((PEAR_LAUNCH_FORCE + this.speed * 0.58) * rocketBoost, -PEAR_LAUNCH_ARC);
    }
    this.pear.setAngularVelocity(0.32);
    this.tweens.add({ targets: this.pear, scaleX: 0.82, scaleY: 1.22, duration: 120, yoyo: true, ease: 'Back.easeOut' });
    this.vehicle.setAlpha(0.55);
    floatingText(this, this.pear.x + 60, this.pear.y - 24, this.level.pearTheme?.abilityFlavorText || 'MEGA LOT!', '#ffffff', 28);
    playSound('pearLaunch');
    this.addScore(60, this.pear.x, this.pear.y, 'NIE HAMUJ!');
    this.emitHud();
  }

  tryLandOnVehicle(target, speed) {
    if (target.getData('caught')) {
      return;
    }
    const dy = Math.abs(this.pear.y - target.y);
    const transition = target.getData('transfer') || this.activeTransfer;
    const difficulty = this.getLandingDifficulty(transition);
    const radius = this.getCatchRadius(transition);
    const centerDistance = Phaser.Math.Distance.Between(this.pear.x, this.pear.y, target.x, target.y - 58);
    const perfect = speed <= PEAR_SAFE_LANDING_SPEED + difficulty.speedSlack * 0.35 && centerDistance < radius * 0.32 && dy < radius * 0.5;
    const good = speed <= PEAR_SAFE_LANDING_SPEED + difficulty.speedSlack && centerDistance < radius * 0.68 && dy < radius * 0.82;
    const ugly = speed <= PEAR_SAFE_LANDING_SPEED + difficulty.speedSlack + 5.5 && centerDistance < radius && dy < radius * 1.15;
    if (!ugly) {
      this.logEarlyTransfer('landing', transition, {
        result: 'MISS',
        landingSpeed: Number(speed.toFixed(2)),
        centerDistance: Math.round(centerDistance),
        dy: Math.round(dy),
      });
      this.warnPlayer(centerDistance < radius * 1.18 ? 'PRAWIE!' : 'LAP POJAZD!', this.pear.x, this.pear.y - 60, 'bad-catch');
      return;
    }
    const landingScore = perfect ? 1000 : good ? 500 : 100;
    const landingText = perfect ? 'PERFECT +1000' : good ? 'GOOD +500' : 'UGLY +100';
    this.logEarlyTransfer('landing', transition, {
      result: perfect ? 'PERFECT' : good ? 'GOOD' : 'UGLY',
      landingSpeed: Number(speed.toFixed(2)),
      centerDistance: Math.round(centerDistance),
      dy: Math.round(dy),
    });
    target.setData('caught', true);
    setPearMood(this, this.pear, perfect ? 'win' : good ? 'landing' : 'damaged');
    this.vehicle?.destroy();
    this.vehicle = target;
    this.vehicle.setData('kind', 'playerVehicle');
    this.vehicle.body.label = 'playerVehicle';
    this.vehicle.setAlpha(1);
    this.currentVehicleType = target.getData('vehicleType');
    this.currentVehicleLabel = target.getData('vehicleLabel');
    this.speed = VEHICLE_BASE_SPEED * target.getData('stats').speed;
    this.stabilizeUntil = this.time.now + LANDING_STABILIZE_TIME;
    this.launched = false;
    this.pendingRequiredVehicle = null;
    this.activeTransfer = null;
    const rating = perfect ? 'PERFECT' : good ? 'GOOD' : 'UGLY';
    this.attachPearToVehicle(this.pear, this.vehicle, rating);
    this.tweens.add({ targets: this.pear, scaleX: 1.22, scaleY: 0.76, duration: 120, yoyo: true, ease: 'Back.easeOut' });
    this.tweens.add({ targets: this.vehicle, scaleY: 0.88, duration: 120, yoyo: true, ease: 'Back.easeOut' });
    if (!good) {
      this.pearDamage += 12;
      this.segmentDamage += 12;
      this.combo = 1;
      this.comboCollect = 0;
      this.vehicle.setAngularVelocity(0.1);
    } else if (this.segmentDamage <= 0) {
      this.perfectSegments += 1;
      this.addScore(1500, this.vehicle.x, this.vehicle.y - 112, 'PERFECT SEGMENT!');
    }
    this.addScore(landingScore, this.vehicle.x, this.vehicle.y - 80, landingText);
    if (perfect) {
      addSparkBurst(this, this.vehicle.x, this.vehicle.y - 70, 0xfff3a6, 12);
    }
    floatingText(this, this.vehicle.x, this.vehicle.y - 118, perfect ? 'IDEALNA PRZESIADKA!' : 'GRUSZKA ŻYJE!', '#ffffff', 22);
    playSound(perfect ? 'perfectLanding' : 'pearLand');
    this.emitHud();
  }

  hitObstacle(obstacle, impact, pearWasHit) {
    if (!obstacle.active) {
      return;
    }
    const stats = obstacle.getData('stats');
    if (stats.slick) {
      this.vehicle?.setAngularVelocity(this.levelIndex <= 2 ? 0.05 : 0.1);
      this.slickUntil = this.time.now + (this.levelIndex <= 2 ? 520 : 760);
      this.damagePear(stats.damage, obstacle.x, obstacle.y, 'ŚLISKO!');
      return;
    }
    if (stats.deadly) {
      this.damagePear(PEAR_MAX_DAMAGE, obstacle.x, obstacle.y, 'GRUSZKA OUT!');
      return;
    }
    const vehicleStats = this.vehicle?.getData('stats') || vehicleTypes.wooden;
    const ram = this.currentVehicleType === 'stone' ? 1.65 : 1;
    if (!pearWasHit && impact * vehicleStats.mass * ram > 6.4) {
      this.addScore(stats.score || 150, obstacle.x, obstacle.y, 'WARZYWNY CHAOS!');
      this.burst(obstacle.x, obstacle.y, stats.color, 16);
      addSparkBurst(this, obstacle.x, obstacle.y, this.currentVehicleType === 'stone' ? 0xb8bec6 : 0xffef7b, 10);
      floatingText(this, obstacle.x, obstacle.y - 70, this.currentVehicleType === 'stone' ? 'LUP!' : 'BUM!', '#ffffff', 25);
      playSound('crash');
      if (stats.breakable || this.currentVehicleType === 'stone') {
        obstacle.destroy();
        this.obstacles = this.obstacles.filter((item) => item !== obstacle);
      }
      return;
    }
    this.damagePear(stats.damage || 16, obstacle.x, obstacle.y, 'KATAPULTA OUT!');
  }

  damagePear(amount, x, y, message) {
    if (this.gameDone) {
      return;
    }
    this.pearDamage += amount;
    this.segmentDamage += amount;
    setPearMood(this, this.pear, amount >= PEAR_MAX_DAMAGE ? 'lose' : 'damaged');
    this.tweens.add({ targets: this.pear, scaleX: 1.25, scaleY: 0.72, angle: this.pear.angle + 7, duration: 120, yoyo: true, ease: 'Back.easeOut' });
    const flash = this.add.rectangle(this.cameras.main.scrollX + WORLD_WIDTH / 2, WORLD_HEIGHT / 2, WORLD_WIDTH, WORLD_HEIGHT, 0xff3228, 0.12).setScrollFactor(0).setDepth(95);
    this.tweens.add({ targets: flash, alpha: 0, duration: 180, onComplete: () => flash.destroy() });
    floatingText(this, x, y - 42, message, '#ffef8a', 25);
    this.cameras.main.shake(130, 0.008);
    playSound(amount >= PEAR_MAX_DAMAGE ? 'vehicleBreak' : 'crash');
    if (this.pearDamage >= PEAR_MAX_DAMAGE) {
      this.lose(message);
    }
    this.emitHud();
  }

  addScore(points, x, y, message) {
    const now = this.time.now;
    if (now - this.lastComboAt > COMBO_TIMEOUT) {
      this.combo = 1;
      this.comboCollect = 0;
    }
    this.lastComboAt = now;
    this.comboCollect += 1;
    if (this.comboCollect >= 3) {
      this.combo = Math.min(5, this.combo + 1);
      this.comboCollect = 0;
      this.maxCombo = Math.max(this.maxCombo, this.combo);
      floatingText(this, x, y - 72, `COMBO x${this.combo}!`, '#ffffff', 22);
      playSound('combo');
    }
    const scoreMultiplier = this.route.scoring?.scoreMultiplier || this.getTierConfig().scoreMultiplier || 1;
    this.score += Math.round(points * this.combo * scoreMultiplier);
    floatingText(this, x, y, message || `+${points}`, '#fff3a3', 22);
    this.emitHud();
  }

  burst(x, y, color, count) {
    for (let i = 0; i < count; i += 1) {
      const bit = this.add.circle(x, y, Phaser.Math.Between(3, 7), color, 0.9).setDepth(70);
      this.tweens.add({
        targets: bit,
        x: x + Phaser.Math.Between(-68, 68),
        y: y + Phaser.Math.Between(-66, 48),
        alpha: 0,
        scale: 0.35,
        duration: Phaser.Math.Between(320, 720),
        ease: 'Cubic.easeOut',
        onComplete: () => bit.destroy(),
      });
    }
  }

  animateVehicleJuice(steer) {
    if (!this.vehicle?.active) {
      return;
    }
    const wheels = this.vehicle.getData('wheels') || [];
    wheels.forEach((wheel) => {
      wheel.angle += this.speed * 1.9;
    });
    this.vehicle.setScale(1, 1 + Math.sin(this.time.now * (this.currentVehicleType === 'pumpkin' ? 0.025 : 0.014)) * 0.015);
    if (Math.abs(steer) > 0.1) {
      this.vehicle.setAngle(Phaser.Math.Linear(this.vehicle.angle, steer * 4, 0.2));
      if (!this.performanceMode && this.time.now - this.lastDustAt > (this.currentVehicleType === 'rocket' ? 65 : 115)) {
        this.lastDustAt = this.time.now;
        addDustPuff(this, this.vehicle.x - 54, this.vehicle.y + 30, this.currentVehicleType === 'stone' ? 0xb8b0a4 : 0xd8b46a, this.currentVehicleType === 'rocket' ? 6 : 3);
      }
    } else {
      this.vehicle.setAngle(Phaser.Math.Linear(this.vehicle.angle, 0, 0.12));
    }
    if (!this.performanceMode && this.time.now - this.lastWheelTrackAt > 180) {
      this.lastWheelTrackAt = this.time.now;
      const track = this.add.rectangle(this.vehicle.x - 28, this.vehicle.y + 35, 54, 4, 0x3a2a1d, 0.12).setDepth(6);
      this.tweens.add({ targets: track, alpha: 0, duration: 900, onComplete: () => track.destroy() });
    }
  }

  update(_time, delta) {
    if (this.gameDone || !this.vehicle?.active) {
      return;
    }
    if (this.isPausedByUi) {
      // paused by UI should freeze countdown as well
      return;
    }

    if (this.isPreStartCountdown) {
      // update countdown
      this.countdownRemainingMs -= delta;
      const seconds = Math.max(0, Math.ceil(this.countdownRemainingMs / 1000));
      this.countdownNumber.setText(seconds > 0 ? String(seconds) : 'START!');
      // scale animation
      this.countdownNumber.setScale(1 + Math.sin(this.time.now * 0.02) * 0.03);
      if (this.countdownRemainingMs <= 0) {
        // start gameplay
        this.isPreStartCountdown = false;
        // remove overlay
        try {
          this.countdownOverlay.destroy();
          this.countdownBg.destroy();
          this.countdownTitle.destroy();
          this.countdownNumber.destroy();
          this.countdownLevelInfo.destroy();
          if (this.countdownHint) this.countdownHint.destroy();
        } catch (e) {}
        playSound('ui');
        // reset gameplay timers so timeMs doesn't include countdown
        this.startTime = this.time.now;
      }
      // while countdown, show idle vehicle and do not progress gameplay
      setPearMood(this, this.pear, this.pearDamage > 40 ? 'damaged' : 'driving');
      this.pear.setPosition(this.vehicle.x, this.vehicle.y - 58);
      this.pear.setRotation(Math.sin(this.time.now * 0.014) * 0.05);
      this.pear.setScale(1 + Math.sin(this.time.now * 0.012) * 0.025, 1 - Math.sin(this.time.now * 0.012) * 0.018);
      this.animateVehicleJuice(this.getSteer());
      this.updateCamera();
      this.emitHud();
      return;
    }
    const dt = delta / 16.666;
    const slickFactor = this.time.now < this.slickUntil ? (this.levelIndex <= 2 ? 0.72 : -0.72) : 1;
    const steer = this.getSteer() * slickFactor;
    const verticalBias = (this.mobileInputRef?.current?.up ? -0.28 : 0) + (this.mobileInputRef?.current?.down ? 0.28 : 0);
    const combinedInput = steer + verticalBias;
    this.updateVehicleMovement(this.vehicle, combinedInput, delta);
    // consume mobile one-shot jumpPressed
    if (this.mobileInputRef?.current?.jumpPressed) {
      const jp = this.mobileInputRef.current.jumpPressed;
      if (jp && !this.launched && !this.gameDone && !this.isPausedByUi && !this.isPreStartCountdown) {
        this.launchPear();
      }
      this.mobileInputRef.current.jumpPressed = false;
    }
    if (steer && this.time.now - this.lastTurnSoundAt > 180) {
      this.lastTurnSoundAt = this.time.now;
      playSound('turn');
    }
    if (this.time.now - this.lastEngineAt > 190) {
      this.lastEngineAt = this.time.now;
      playSound('engineLoop');
    }

    if (!this.launched) {
      setPearMood(this, this.pear, this.pearDamage > 40 ? 'damaged' : 'driving');
      this.pear.setPosition(this.vehicle.x, this.vehicle.y - 58);
      this.pear.setRotation(Math.sin(this.time.now * 0.014) * 0.05);
      this.pear.setScale(1 + Math.sin(this.time.now * 0.012) * 0.025, 1 - Math.sin(this.time.now * 0.012) * 0.018);
      this.animateVehicleJuice(steer);
    } else {
      this.pear.setVelocity(this.pear.body.velocity.x, this.pear.body.velocity.y + PEAR_FLIGHT_GRAVITY * dt);
      this.addPearTrail();
      if (this.pear.y < 95 && Math.floor(this.time.now / 420) % 2 === 0) {
        this.addScore(20, this.pear.x, this.pear.y, 'MEGA LOT!');
      }
    }

    this.updateCamera();
    this.collectCoins();
    this.checkNearMisses();
    this.checkPearVehicleCatch();
    this.checkGaps();
    this.checkMissedVehicles();
    this.checkBossDrops();
    this.checkOutOfBounds();
    this.checkFinish();
    this.updateVehicleDebug();
    this.emitHud();
  }

  getSteer() {
    const left = this.keys?.left?.isDown || this.keys?.a?.isDown || !!this.mobileInputRef?.current?.left;
    const right = this.keys?.right?.isDown || this.keys?.d?.isDown || !!this.mobileInputRef?.current?.right;
    return (right ? 1 : 0) - (left ? 1 : 0) || this.pointerSteer;
  }

  updateCamera() {
    const target = this.launched ? this.pear : this.vehicle;
    const tierLookahead = this.levelIndex <= 2 ? CAMERA_LOOKAHEAD_EASY : this.currentVehicleType === 'rocket' || this.levelIndex >= 7 ? CAMERA_LOOKAHEAD_FAST : CAMERA_FOLLOW_OFFSET;
    const offset = Math.max(this.route.cameraOffset || CAMERA_FOLLOW_OFFSET, tierLookahead) * this.getTierConfig().cameraLookaheadMultiplier;
    const camX = Phaser.Math.Clamp(target.x + offset - WORLD_WIDTH / 2, 0, (this.route.length || LEVEL_WORLD_WIDTH) - WORLD_WIDTH);
    this.cameras.main.scrollX += (camX - this.cameras.main.scrollX) * 0.1;
  }

  collectCoins() {
    const target = this.launched ? this.pear : this.vehicle;
    this.coins.forEach((coin) => {
      if (coin.getData('collected')) {
        return;
      }
      if (Phaser.Math.Distance.Between(target.x, target.y, coin.x, coin.y) < 48) {
        coin.setData('collected', true);
        coin.destroy();
        this.collectedCoins += 1;
        playSound('coin');
        this.addScore(100, coin.x, coin.y, '+100');
      }
    });
  }

  checkNearMisses() {
    if (this.launched) {
      return;
    }
    this.obstacles.forEach((obstacle) => {
      if (!obstacle.active || this.nearMissMemory.has(obstacle.getData('id'))) {
        return;
      }
      const dx = Math.abs(obstacle.x - this.vehicle.x);
      const dy = Math.abs(obstacle.y - this.vehicle.y);
      if (dx < 42 && dy < NEAR_MISS_DISTANCE && dy > 30) {
        this.nearMissMemory.add(obstacle.getData('id'));
        this.nearMissCount += 1;
        setPearMood(this, this.pear, 'flying');
        this.tweens.add({ targets: this.pear, x: this.pear.x + 5, duration: 45, yoyo: true, repeat: 3 });
        addSparkBurst(this, obstacle.x, obstacle.y - 36, 0xffef7b, 8);
        playSound('nearMiss');
        this.addScore(250, obstacle.x, obstacle.y - 48, 'RYZYKO!');
      }
    });
  }

  checkPearVehicleCatch() {
    if (!this.launched) {
      return;
    }
    const target = this.targetVehicles.find((vehicle) => {
      if (!vehicle.active || vehicle.getData('caught')) {
        return false;
      }
      const transition = vehicle.getData('transfer') || this.activeTransfer;
      const radius = this.getCatchRadius(transition);
      return Phaser.Math.Distance.Between(this.pear.x, this.pear.y, vehicle.x, vehicle.y - 58) < radius;
    });
    if (!target) {
      return;
    }
    const pearVelocity = this.pear.body.velocity;
    const targetVelocity = target.body?.velocity || { x: 0, y: 0 };
    const speed = Math.hypot(pearVelocity.x - targetVelocity.x, pearVelocity.y - targetVelocity.y);
    this.tryLandOnVehicle(target, speed);
  }

  checkGaps() {
    const active = this.launched ? this.pear : this.vehicle;
    const inGap = this.route.gaps?.some((gap) => Math.abs(active.x - gap.x) < gap.width / 2 && active.y > this.route.road.top && active.y < this.route.road.bottom);
    if (inGap && !this.launched) {
      this.damagePear(PEAR_MAX_DAMAGE, active.x, active.y, 'KATAPULTA OUT!');
    }
  }

  checkMissedVehicles() {
    const nextRequired = this.targetVehicles.find((vehicle) => vehicle.getData('required') && !vehicle.getData('caught'));
    const transfer = nextRequired?.getData('transfer') || this.activeTransfer;
    const grace = this.getFailGraceDistance(transfer);
    if (nextRequired && this.launched && this.pear.x > nextRequired.x + Math.max(120, grace * 0.45)) {
      this.warnPlayer('ZA DALEKO!', this.pear.x, this.pear.y - 60, 'too-far');
    }
    if (nextRequired && this.pear.x > nextRequired.x + grace && this.launched) {
      this.logEarlyTransfer('landing', transfer, {
        result: 'MISS_GRACE',
        pearX: Math.round(this.pear.x),
        targetX: Math.round(nextRequired.x),
      });
      this.lose('ZA DALEKO!');
    }
    if (nextRequired && this.vehicle.x > nextRequired.x + grace * 0.72 && !this.launched) {
      this.lose('OMINIĘTY POJAZD!');
    }
  }

  checkBossDrops() {
    const drop = this.route.bossDrops?.[this.bossDropIndex];
    if (!drop || this.vehicle.x < drop.at) {
      return;
    }
    this.bossDropIndex += 1;
    const spawned = this.createObstacle(
      {
        type: drop.type || 'fallingTomato',
        x: this.vehicle.x + 360,
        y: drop.lane || Phaser.Math.Between(this.route.road.top + 70, this.route.road.bottom - 70),
        deadly: drop.type === 'veggieMine',
      },
      1000 + this.bossDropIndex,
    );
    if (spawned) {
      spawned.setScale(1.18);
      spawned.setData('id', `boss-drop-${this.bossDropIndex}`);
      this.obstacles.push(spawned);
      floatingText(this, spawned.x, spawned.y - 70, 'BROKUŁ BOSS!', '#ffffff', 24);
      playSound('nearMiss');
    }
  }

  checkOutOfBounds() {
    if (this.launched && this.pear.y < -80) {
      if (!this.offscreenSince) {
        this.offscreenSince = this.time.now;
      }
      if (this.time.now - this.offscreenSince > OUT_OF_SCREEN_GRACE_TIME * 0.45) {
        this.warnPlayer('WRÓĆ NA TRASĘ!', this.pear.x, 70, 'offscreen-high');
      }
    } else {
      this.offscreenSince = 0;
    }
    if (this.launched && this.pear.y > this.route.road.bottom + 150) {
      this.warnPlayer('WROC NA TRASE!', this.pear.x, this.pear.y - 60, 'below-road');
    }
    if (this.pear.y > WORLD_HEIGHT + 260 || this.pear.x < -220 || this.pear.x > (this.route.length || LEVEL_WORLD_WIDTH) + 420) {
      this.lose('GRUSZKA SPADŁA!');
    }
  }

  checkFinish() {
    if (!this.launched && this.vehicle.x >= this.route.finishX) {
      this.win();
    }
    if (this.vehicle.x > this.distanceScoreX) {
      this.distanceScoreX += 150;
      const scoreMultiplier = this.route.scoring?.scoreMultiplier || this.getTierConfig().scoreMultiplier || 1;
      this.score += Math.round(10 * this.combo * scoreMultiplier);
    }
  }

  addPearTrail() {
    if (this.performanceMode) return;
    if (Math.floor(this.time.now / 50) % 2 === 0) {
      return;
    }
    const dot = this.add.ellipse(this.pear.x - 16, this.pear.y + 8, 24, 12, 0xf4f7a4, 0.3).setDepth(7).setAngle(this.pear.angle);
    this.tweens.add({ targets: dot, alpha: 0, scale: 0.25, x: dot.x - 26, duration: 430, onComplete: () => dot.destroy() });
  }

  win() {
    if (this.gameDone) {
      return;
    }
    this.gameDone = true;
    this.matter.world.pause();
    const perfectBonus = this.pearDamage <= 0 ? (this.route.perfectFinishBonus || 10000) : 0;
    const finishBonus = 3000 + (this.route.finishBonus || 3500) + Math.max(0, 5 - this.pearDamage / 20) * 400;
    const bonus = Math.round(finishBonus + perfectBonus);
    const totalScore = this.score + bonus;
    const thresholds = this.level.starThresholds || { one: 0, two: Infinity, three: Infinity };
    const scoreStars = totalScore >= thresholds.three ? 3 : totalScore >= thresholds.two ? 2 : 1;
    const damageCap = this.pearDamage <= 0 ? 3 : this.pearDamage < 45 ? 2 : 1;
    const stars = Math.min(scoreStars, damageCap);
    const totalTime = Math.max(0, this.time.now - this.startTime);
    const distance = Math.max(0, Math.round((this.vehicle?.x || 0) - 190));
    setPearMood(this, this.pear, 'win');
    addConfetti(this, this.vehicle.x, this.vehicle.y - 100);
    this.tweens.add({ targets: this.pear, y: this.pear.y - 28, scale: 1.12, duration: 220, yoyo: true, repeat: 3, ease: 'Sine.easeInOut' });
    floatingText(this, this.vehicle.x, this.vehicle.y - 90, this.pearDamage <= 0 ? 'PERFECT!' : 'GRUSZKA ŻYJE!', '#ffffff', 30);
    playSound('win');
    this.time.delayedCall(520, () => {
      this.onGameEvent({
        type: 'win',
        level: this.levelIndex + 1,
        score: this.score,
        bonus,
        totalScore,
        bestCombo: this.maxCombo,
        stars,
        coinsCollected: this.collectedCoins,
        nearMisses: this.nearMissCount,
        timeMs: totalTime,
        distance,
        perfectRun: this.pearDamage <= 0 && stars === 3,
        isLast: this.levelIndex >= levels.length - 1,
        legendary: this.levelIndex >= levels.length - 1,
      });
    });
  }

  getLossHint(message) {
    const hints = {
      'GRUSZKA OUT!': 'Uderzyłeś w przeszkodę. Zwalniaj w ostatniej chwili.',
      'KATAPULTA OUT!': 'Przyspiesz i unikaj gorących przeszkód.',
      'GRUSZKA SPADŁA!': 'Trzymaj równowagę i koryguj tor lotu wcześnie.',
      'ZA DALEKO!': 'Celuj niżej lub dopasuj prędkość przed wystrzałem.',
      'OMINIĘTY POJAZD!': 'Upewnij się, że lądujesz na wymaganym pojeździe.',
    };
    return hints[message] || 'Spróbuj spokojniej i wykorzystać combo.';
  }

  lose(message = 'GRUSZKA NIE ŻYJE!') {
    if (this.gameDone) {
      return;
    }
    this.gameDone = true;
    this.matter.world.pause();
    setPearMood(this, this.pear, 'lose');
    this.tweens.add({ targets: this.pear, scaleX: 1.38, scaleY: 0.58, angle: -8, duration: 160, ease: 'Bounce.easeOut' });
    floatingText(this, this.pear.x, this.pear.y - 54, message, '#ffef8a', 30);
    playSound('lose');
    this.onGameEvent({
      type: 'lose',
      level: this.levelIndex + 1,
      score: this.score,
      message,
      hint: this.getLossHint(message),
      comboMax: this.maxCombo,
      coinsCollected: this.collectedCoins,
      nearMisses: this.nearMissCount,
    });
  }

  emitHud() {
    this.onGameEvent({
      type: 'hud',
      level: this.levelIndex + 1,
      score: this.score,
      combo: this.combo,
      vehicle: this.currentVehicleLabel,
      pearHealth: Math.max(0, PEAR_MAX_DAMAGE - this.pearDamage),
      pearDamage: this.pearDamage,
      canLaunch: !this.launched && !this.gameDone,
      distance: Math.max(0, Math.round((this.vehicle?.x || 0) / 10)),
    });
  }
}

export function createGame(parent, onGameEvent, initialLevel = 0, soundEnabled = true, performanceMode = false, mobileInputRef = null, showTouchHints = false) {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: WORLD_WIDTH,
    height: WORLD_HEIGHT,
    backgroundColor: '#91d7ff',
    physics: {
      default: 'matter',
      matter: {
        debug: false,
        gravity: { y: 0 },
      },
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    input: {
      activePointers: performanceMode ? 2 : 3,
    },
    scene: [new PearScene(onGameEvent, initialLevel, soundEnabled, performanceMode, mobileInputRef, showTouchHints)],
  });
}
