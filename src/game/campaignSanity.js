import { LEVEL_TIER_CONFIG, MAX_LEVEL } from './constants.js';
import { levels } from './levels.js';

const allowedVehicles = new Set(['wooden', 'pumpkin', 'stone', 'rocket', 'golden']);
const allowedObstacles = new Set([
  'rock',
  'crate',
  'fence',
  'spikes',
  'veggieMine',
  'onionSlick',
  'rotatingBeam',
  'fallingTomato',
  'broccoliBarricade',
  'stoneWall',
]);
const allowedDifficulties = new Set(['easy', 'normal', 'hard', 'veryHard', 'impossible']);

const tierMinimums = {
  starter: { catchRadius: 160, failGrace: 700, maxTransferDistance: 900, maxObstacles: 7 },
  rookiePlus: { catchRadius: 135, failGrace: 560, maxTransferDistance: 960, maxObstacles: 9 },
  advanced: { catchRadius: 112, failGrace: 450, maxTransferDistance: 1040, maxObstacles: 11 },
  veryHard: { catchRadius: 92, failGrace: 360, maxTransferDistance: 1120, maxObstacles: 13 },
  impossible: { catchRadius: 78, failGrace: 300, maxTransferDistance: 1200, maxObstacles: 15 },
};

function zoneCenter(zone) {
  if (typeof zone === 'number') return zone;
  return ((zone?.start || 0) + (zone?.end || 0)) / 2;
}

function zoneLength(zone) {
  if (typeof zone === 'number') return 0;
  return Math.max(0, (zone?.end || 0) - (zone?.start || 0));
}

function hasSpringReference(value) {
  const text = JSON.stringify(value || {}).toLowerCase();
  return text.includes('spring') || text.includes('boing');
}

export function validateLevel(level) {
  const errors = [];
  const warnings = [];
  const route = level?.route || {};
  const tier = level?.difficultyTier;
  const minimums = tierMinimums[tier] || tierMinimums.starter;
  const transfers = route.transitions || route.transfers || [];
  const vehicles = route.vehicles || [];
  const obstacles = route.obstacles || [];
  const collectibles = route.collectibles || route.coins || [];
  const airCurrents = route.airCurrents || [];
  const premiumStar = level?.premiumStar;
  const extraChallenges = level?.extraChallenges || [];
  const thresholds = level?.starThresholds;

  if (!level?.id) errors.push('missing id');
  if (level?.id < 1 || level?.id > MAX_LEVEL) errors.push(`id outside 1-${MAX_LEVEL}`);
  if (!level?.name) errors.push('missing name');
  if (!tier || !LEVEL_TIER_CONFIG[tier]) errors.push(`unknown difficultyTier: ${tier}`);
  if (!level?.theme) errors.push('missing theme');
  if (!level?.pearTheme) errors.push('missing pearTheme');
  if (!allowedVehicles.has(route.startVehicle)) errors.push(`unknown startVehicle: ${route.startVehicle}`);
  if (hasSpringReference(level)) errors.push('spring/BOING reference found');
  if (!route.length || route.length < 1800) errors.push('missing or too short route.length');
  if (!route.finishX || route.finishX >= route.length + 80) errors.push('missing or invalid finishX');
  if (!thresholds) errors.push('missing starThresholds');
  if (thresholds && !(thresholds.one > 0 && thresholds.two > thresholds.one && thresholds.three > thresholds.two)) {
    errors.push('starThresholds are not positive and increasing');
  }
  if (!Array.isArray(vehicles)) errors.push('vehicles is not an array');
  if (!Array.isArray(transfers)) errors.push('transfers/transitions is not an array');
  if (!Array.isArray(obstacles)) errors.push('obstacles is not an array');
  if (!Array.isArray(collectibles)) errors.push('collectibles/coins is not an array');
  if (obstacles.length > minimums.maxObstacles) warnings.push(`high obstacle density: ${obstacles.length}`);
  if (tier === 'starter' && obstacles.length > 7) warnings.push('starter level has too many obstacles');
  if (!premiumStar) errors.push('missing premiumStar');
  if (premiumStar) {
    if (!Number.isFinite(Number(premiumStar.x)) || !Number.isFinite(Number(premiumStar.y))) errors.push('premiumStar missing x/y');
    if (Number(premiumStar.scoreBonus || 0) <= 0) errors.push('premiumStar missing positive scoreBonus');
    if (!allowedDifficulties.has(premiumStar.difficulty)) errors.push(`premiumStar invalid difficulty: ${premiumStar.difficulty}`);
  }
  if (!Array.isArray(extraChallenges)) errors.push('extraChallenges is not an array');
  if (Array.isArray(extraChallenges) && extraChallenges.length < 10) errors.push(`extraChallenges has ${extraChallenges.length}, expected at least 10`);
  extraChallenges.forEach((challenge, index) => {
    const label = `extraChallenge ${index + 1}`;
    if (!challenge.id) errors.push(`${label}: missing id`);
    if (!challenge.type) errors.push(`${label}: missing type`);
    if (!challenge.name) errors.push(`${label}: missing name`);
    if (!challenge.description) errors.push(`${label}: missing description`);
    if (!allowedDifficulties.has(challenge.difficulty)) errors.push(`${label}: invalid difficulty ${challenge.difficulty}`);
  });

  vehicles.forEach((vehicle, index) => {
    if (!allowedVehicles.has(vehicle.type)) errors.push(`vehicle ${index + 1}: unknown type ${vehicle.type}`);
    if (level?.id >= 21 && (vehicle.moveX || vehicle.moveY)) errors.push(`vehicle ${index + 1}: moving target vehicle is forbidden after level 20`);
  });

  transfers.forEach((transfer, index) => {
    const label = `transfer ${index + 1}`;
    const launchCenter = zoneCenter(transfer.launchZoneX);
    const distance = transfer.targetVehicleX - launchCenter;
    if (!transfer.launchZoneX) errors.push(`${label}: missing launchZoneX`);
    if (!transfer.targetVehicleX) errors.push(`${label}: missing targetVehicleX`);
    if (!transfer.targetVehicleY) errors.push(`${label}: missing targetVehicleY`);
    if (!transfer.targetVehicleType) errors.push(`${label}: missing targetVehicleType`);
    if (!transfer.safeCatchRadius) errors.push(`${label}: missing safeCatchRadius`);
    if (!transfer.failGraceDistance) errors.push(`${label}: missing failGraceDistance`);
    if (!transfer.landingDifficulty) errors.push(`${label}: missing landingDifficulty`);
    if (!allowedVehicles.has(transfer.targetVehicleType)) errors.push(`${label}: unknown targetVehicleType ${transfer.targetVehicleType}`);
    if (transfer.targetVehicleX > route.length - 120) errors.push(`${label}: targetVehicleX outside route`);
    if (transfer.targetVehicleY < 120 || transfer.targetVehicleY > 690) warnings.push(`${label}: targetVehicleY looks extreme`);
    if (transfer.safeCatchRadius < minimums.catchRadius) warnings.push(`${label}: catch radius below tier minimum`);
    if (transfer.failGraceDistance < minimums.failGrace) warnings.push(`${label}: fail grace below tier minimum`);
    if (zoneLength(transfer.launchZoneX) < 170) warnings.push(`${label}: short launch zone`);
    if (distance > minimums.maxTransferDistance) warnings.push(`${label}: long target distance ${Math.round(distance)}`);
    if ((transfer.stabilizationAfterLandingMs || 0) < 350) warnings.push(`${label}: short landing stabilization`);
    const closeObstacle = obstacles.find((obstacle) => obstacle.x > transfer.targetVehicleX && obstacle.x - transfer.targetVehicleX < 230);
    if (closeObstacle) warnings.push(`${label}: obstacle too soon after landing`);
  });

  obstacles.forEach((obstacle, index) => {
    if (!allowedObstacles.has(obstacle.type)) errors.push(`obstacle ${index + 1}: unknown type ${obstacle.type}`);
    if (obstacle.x < 520) warnings.push(`obstacle ${index + 1}: too close to start`);
    if ((obstacle.deadly || ['spikes', 'veggieMine', 'stoneWall'].includes(obstacle.type)) && !obstacle.hint && tier === 'impossible') {
      warnings.push(`obstacle ${index + 1}: impossible deadly obstacle without hint`);
    }
  });

  airCurrents.forEach((current, index) => {
    if (!['up', 'down'].includes(current.direction)) errors.push(`air current ${index + 1}: invalid direction ${current.direction}`);
    if (!current.x || !current.y || !current.width || !current.height) errors.push(`air current ${index + 1}: missing bounds`);
    if ((current.strength || 0) <= 0 || current.strength > 0.12) warnings.push(`air current ${index + 1}: unusual strength ${current.strength}`);
  });

  if (level?.id >= 21 && airCurrents.length === 0) warnings.push('advanced level has no air-current mechanic');

  const lastObstacle = obstacles.filter((obstacle) => obstacle.x < route.finishX).at(-1);
  if (lastObstacle && route.finishX - lastObstacle.x < 300) warnings.push('finish too close to last obstacle');

  return { levelId: level?.id, errors, warnings };
}

export function runCampaignSanityCheck(levelList = levels) {
  const results = levelList.map(validateLevel);
  const errors = results.flatMap((result) => result.errors.map((message) => ({ level: result.levelId, message })));
  const warnings = results.flatMap((result) => result.warnings.map((message) => ({ level: result.levelId, message })));
  const springsFound = results.filter((result) => result.errors.some((message) => message.includes('spring'))).length;
  const premiumStars = levelList.filter((level) => level?.premiumStar).length;
  const extraChallenges = levelList.reduce((sum, level) => sum + (Array.isArray(level?.extraChallenges) ? level.extraChallenges.length : 0), 0);
  const unknownVehicles = errors.filter((item) => item.message.includes('vehicle')).length;
  const missingStarThresholds = errors.filter((item) => item.message.includes('starThresholds')).length;
  const summary = {
    totalLevels: levelList.length,
    errors: errors.length,
    warnings: warnings.length,
    premiumStars,
    expectedPremiumStars: levelList.length,
    extraChallenges,
    expectedExtraChallenges: levelList.length * 10,
    springsFound,
    unknownVehicles,
    missingStarThresholds,
    details: { errors, warnings },
  };

  if (typeof console !== 'undefined') {
    const line = `Campaign sanity: ${summary.totalLevels} levels checked, premiumStars ${summary.premiumStars}/${summary.expectedPremiumStars}, extraChallenges ${summary.extraChallenges}/${summary.expectedExtraChallenges}, springs found ${summary.springsFound}, ${summary.warnings} warnings, ${summary.errors} errors.`;
    if (summary.errors > 0) console.error(line, summary.details);
    else if (summary.warnings > 0) console.warn(line, summary.details);
    else console.info(line, summary);
  }

  return summary;
}
