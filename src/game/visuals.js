import Phaser from 'phaser';

const OUTLINE = 0x2b2118;
const SHADOW = 0x1f2419;
const WHITE = 0xfff7df;

function stroke(shape, color = OUTLINE, width = 4, alpha = 1) {
  shape.setStrokeStyle?.(width, color, alpha);
  return shape;
}

function addEye(scene, x, y, mood = 'normal') {
  const eye = scene.add.container(x, y);
  const white = stroke(scene.add.ellipse(0, 0, mood === 'flying' ? 18 : 15, mood === 'flying' ? 21 : 17, WHITE), OUTLINE, 3);
  const pupil = scene.add.circle(mood === 'damaged' ? 3 : 1, mood === 'flying' ? 2 : 1, mood === 'flying' ? 5 : 4, 0x151515);
  eye.add([white, pupil]);
  return eye;
}

function resolvePearTheme(theme = {}) {
  const themes = {
    knight: { visualParts: ['helmet', 'shield'], colorAccent: 0xb8c4d6 },
    winged: { visualParts: ['wings', 'goggles'], colorAccent: 0x9ee9ff },
    super: { visualParts: ['cape', 'emblem'], colorAccent: 0xff8fb0 },
    pirate: { visualParts: ['hat', 'backSword'], colorAccent: 0x4a2d18 },
    racer: { visualParts: ['headband', 'goggles'], colorAccent: 0xffd85d },
    gladiator: { visualParts: ['gladiatorHelmet', 'shield'], colorAccent: 0x8c6a53 },
    stunt: { visualParts: ['goggles', 'jetpack'], colorAccent: 0xd64839 },
    rocket: { visualParts: ['jetpack', 'goggles'], colorAccent: 0xffb12e },
    ninja: { visualParts: ['ninjaMask', 'eyepatch'], colorAccent: 0x1b1b1f },
    royal: { visualParts: ['crown', 'cape'], colorAccent: 0xf4d75c },
  };
  if (typeof theme === 'string') {
    return themes[theme] || themes.knight;
  }
  return { ...themes[theme.name] ?? {}, ...theme };
}

export function createPearSprite(scene, x, y, options = {}) {
  const mood = options.mood || 'normal';
  const theme = resolvePearTheme(options.theme);
  const accent = theme.colorAccent || 0x7cc442;
  const pear = scene.add.container(x, y);
  pear.setSize(72, 82);

  const shadow = scene.add.ellipse(4, 34, 58, 18, SHADOW, 0.2);
  const bottom = stroke(scene.add.ellipse(0, 10, 58, 66, 0xbde748), OUTLINE, 5);
  const top = stroke(scene.add.ellipse(-3, -20, 42, 42, 0xd8f65a), OUTLINE, 5);
  const side = scene.add.ellipse(13, 8, 22, 54, 0x6fa83a, 0.32);
  const shine = scene.add.ellipse(-15, -15, 13, 25, 0xf7ff9d, 0.75).setAngle(24);
  const stem = stroke(scene.add.rectangle(3, -50, 10, 24, 0x75451f).setAngle(12), OUTLINE, 3);
  const leaf = stroke(scene.add.ellipse(20, -50, 24, 13, 0x57b84b).setAngle(-25), OUTLINE, 3);
  const leftEye = addEye(scene, -13, -15, mood);
  const rightEye = addEye(scene, 13, -15, mood);
  const browA = scene.add.rectangle(-13, -31, 18, 4, OUTLINE).setAngle(mood === 'flying' ? 18 : -12);
  const browB = scene.add.rectangle(13, -31, 18, 4, OUTLINE).setAngle(mood === 'flying' ? -18 : 12);
  const mouth = scene.add.graphics();
  mouth.lineStyle(4, OUTLINE, 1);
  if (mood === 'flying') {
    mouth.fillStyle(0x331515, 1).fillEllipse(0, 12, 17, 22).lineStyle(3, OUTLINE).strokeEllipse(0, 12, 17, 22);
  } else if (mood === 'landing') {
    mouth.fillStyle(WHITE, 1).fillRoundedRect(-14, 8, 28, 11, 4).lineStyle(3, OUTLINE).strokeRoundedRect(-14, 8, 28, 11, 4);
    mouth.lineBetween(0, 8, 0, 19);
  } else if (mood === 'damaged' || mood === 'lose') {
    mouth.beginPath().arc(0, 20, 12, Math.PI + 0.2, Math.PI * 2 - 0.2, true).strokePath();
  } else {
    mouth.beginPath().arc(0, 7, 15, 0.08, Math.PI - 0.08).strokePath();
  }
  const themedParts = createPearThemeParts(scene, theme);
  pear.add([shadow, ...themedParts.behind, bottom, top, side, shine, stem, leaf, ...themedParts.front, leftEye, rightEye, browA, browB, mouth]);
  pear.setData('faceParts', [leftEye, rightEye, browA, browB, mouth]);
  pear.setData('mood', mood);
  pear.setData('theme', theme);
  pear.setData('accent', accent);
  return pear;
}

function createPearThemeParts(scene, theme = {}) {
  const parts = new Set(theme.visualParts || []);
  const behind = [];
  const front = [];
  const accent = theme.colorAccent || 0xffffff;
  if (parts.has('wings')) {
    behind.push(stroke(scene.add.ellipse(-38, -5, 34, 20, 0xf4f7ff).setAngle(-25), OUTLINE, 3));
    behind.push(stroke(scene.add.ellipse(38, -5, 34, 20, 0xf4f7ff).setAngle(25), OUTLINE, 3));
  }
  if (parts.has('cape') || parts.has('goldCape')) {
    behind.push(stroke(scene.add.triangle(0, 23, -28, -24, 28, -18, 8, 58, parts.has('goldCape') ? 0xf4d75c : 0xd64839), OUTLINE, 4));
  }
  if (parts.has('backSword')) {
    behind.push(stroke(scene.add.rectangle(23, -5, 6, 70, 0xb8c4d6).setAngle(35), OUTLINE, 2));
  }
  if (parts.has('helmet')) {
    front.push(stroke(scene.add.arc(0, -32, 27, Math.PI, Math.PI * 2, false, 0xb8c4d6), OUTLINE, 4));
    front.push(scene.add.rectangle(0, -32, 48, 8, 0xdce4ec));
  }
  if (parts.has('shield')) front.push(stroke(scene.add.polygon(-36, 12, [0, -18, 16, -10, 12, 12, 0, 22, -12, 12, -16, -10], accent), OUTLINE, 3));
  if (parts.has('sword') || parts.has('saber')) front.push(stroke(scene.add.rectangle(34, 20, 5, 42, parts.has('saber') ? 0xd6dbe0 : 0xb8c4d6).setAngle(-35), OUTLINE, 2));
  if (parts.has('goggles')) {
    front.push(stroke(scene.add.ellipse(-13, -18, 22, 15, 0x9ee9ff, 0.65), OUTLINE, 3));
    front.push(stroke(scene.add.ellipse(13, -18, 22, 15, 0x9ee9ff, 0.65), OUTLINE, 3));
  }
  if (parts.has('helmet') || parts.has('pilotHelmet') || parts.has('gladiatorHelmet')) {
    front.push(stroke(scene.add.rectangle(0, -39, 50, 16, parts.has('pilotHelmet') ? 0xd64839 : parts.has('gladiatorHelmet') ? 0x858a91 : accent), OUTLINE, 3));
  }
  if (parts.has('eyepatch') || parts.has('ninjaMask')) {
    front.push(scene.add.rectangle(0, -17, 42, 9, 0x1b1b1f));
    if (parts.has('eyepatch')) front.push(stroke(scene.add.circle(-13, -17, 10, 0x111111), OUTLINE, 2));
  }
  if (parts.has('hat')) front.push(stroke(scene.add.polygon(0, -46, [-28, 8, 0, -12, 28, 8, 12, 16, -18, 16], 0x704327), OUTLINE, 3));
  if (parts.has('headband')) front.push(scene.add.rectangle(0, -32, 52, 8, accent));
  if (parts.has('jetpack')) {
    behind.push(stroke(scene.add.rectangle(-36, 12, 12, 32, 0x6a727c), OUTLINE, 3));
    behind.push(scene.add.triangle(-36, 35, 0, 0, 10, 28, 20, 0, 0xffb12e));
  }
  if (parts.has('crown')) front.push(stroke(scene.add.polygon(0, -55, [-22, 18, -12, -6, 0, 12, 12, -6, 22, 18], 0xf4d75c), OUTLINE, 3));
  if (parts.has('emblem')) front.push(stroke(scene.add.star(0, 6, 5, 6, 13, accent), OUTLINE, 2));
  if (parts.has('scarf')) behind.push(stroke(scene.add.rectangle(-34, -1, 42, 9, 0xd64839).setAngle(15), OUTLINE, 2));
  if (parts.has('hammer')) front.push(stroke(scene.add.rectangle(35, 18, 8, 40, 0x75451f).setAngle(-25), OUTLINE, 2));
  return { behind, front };
}

export function setPearMood(scene, pear, mood = 'normal') {
  if (!pear?.active || pear.getData('mood') === mood) {
    return;
  }
  const oldParts = pear.getData('faceParts') || [];
  oldParts.forEach((part) => {
    pear.remove(part);
    part.destroy();
  });
  const leftEye = addEye(scene, -13, -15, mood);
  const rightEye = addEye(scene, 13, -15, mood);
  const browA = scene.add.rectangle(-13, -31, 18, 4, OUTLINE).setAngle(mood === 'flying' ? 18 : mood === 'damaged' ? 20 : -12);
  const browB = scene.add.rectangle(13, -31, 18, 4, OUTLINE).setAngle(mood === 'flying' ? -18 : mood === 'damaged' ? -20 : 12);
  const mouth = scene.add.graphics();
  mouth.lineStyle(4, OUTLINE, 1);
  if (mood === 'flying') {
    mouth.fillStyle(0x331515, 1).fillEllipse(0, 12, 17, 22).lineStyle(3, OUTLINE).strokeEllipse(0, 12, 17, 22);
  } else if (mood === 'landing') {
    mouth.fillStyle(WHITE, 1).fillRoundedRect(-14, 8, 28, 11, 4).lineStyle(3, OUTLINE).strokeRoundedRect(-14, 8, 28, 11, 4);
    mouth.lineBetween(0, 8, 0, 19);
  } else if (mood === 'damaged' || mood === 'lose') {
    mouth.beginPath().arc(0, 20, 12, Math.PI + 0.2, Math.PI * 2 - 0.2, true).strokePath();
    if (mood === 'damaged') {
      const patch = stroke(scene.add.rectangle(20, 5, 14, 8, 0xffd8bd).setAngle(-12), OUTLINE, 2);
      pear.add(patch);
      pear.setData('damagePatch', patch);
    }
  } else if (mood === 'win') {
    mouth.beginPath().arc(0, 5, 17, 0.05, Math.PI - 0.05).strokePath();
  } else {
    mouth.beginPath().arc(0, 7, 15, 0.08, Math.PI - 0.08).strokePath();
  }
  const patch = pear.getData('damagePatch');
  if (patch && mood !== 'damaged') {
    pear.remove(patch);
    patch.destroy();
    pear.setData('damagePatch', null);
  }
  pear.add([leftEye, rightEye, browA, browB, mouth]);
  pear.setData('faceParts', [leftEye, rightEye, browA, browB, mouth]);
  pear.setData('mood', mood);
}

function wheel(scene, x, y, radius, hub = 0xf6d06a) {
  const container = scene.add.container(x, y);
  const tire = stroke(scene.add.circle(0, 0, radius, 0x24201d), OUTLINE, 3);
  const inner = scene.add.circle(0, 0, radius * 0.55, hub);
  const spokeA = scene.add.rectangle(0, 0, radius * 1.45, 4, OUTLINE);
  const spokeB = scene.add.rectangle(0, 0, 4, radius * 1.45, OUTLINE);
  container.add([tire, inner, spokeA, spokeB]);
  return container;
}

export function createVehicleSprite(scene, x, y, type, options = {}) {
  const vehicle = scene.add.container(x, y);
  const wheels = [];
  const addWheel = (wx, wy, r, hub) => {
    const w = wheel(scene, wx, wy, r, hub);
    wheels.push(w);
    vehicle.add(w);
    return w;
  };

  const labelColor = options.controllable ? 0xffffff : 0xfff6c9;
  const shadow = scene.add.ellipse(0, 34, 132, 24, SHADOW, 0.18);
  vehicle.add(shadow);

  if (type === 'pumpkin') {
    vehicle.add([
      stroke(scene.add.ellipse(0, -2, 116, 60, 0xf08a25), OUTLINE, 5),
      scene.add.ellipse(-24, -4, 23, 54, 0xffb34c, 0.55),
      scene.add.ellipse(18, 0, 24, 56, 0xb8511e, 0.28),
      stroke(scene.add.rectangle(18, -38, 15, 25, 0x3e963c).setAngle(-18), OUTLINE, 3),
    ]);
    addWheel(-38, 27, 12, 0xffcf52);
    addWheel(38, 27, 12, 0xffcf52);
  } else if (type === 'stone') {
    vehicle.add([
      stroke(scene.add.polygon(0, -4, [-62, 18, -46, -26, 36, -28, 66, 2, 44, 24, -38, 24], 0x858a91), OUTLINE, 5),
      stroke(scene.add.triangle(62, 0, 0, 0, 34, -22, 34, 22, 0x60656d), OUTLINE, 4),
      scene.add.line(-10, -8, -22, 0, 18, 0, 0x4c5158).setLineWidth(4),
      scene.add.line(20, 8, -10, 0, 20, 0, 0x4c5158).setLineWidth(3),
    ]);
    addWheel(-40, 27, 18, 0xa8adb4);
    addWheel(34, 27, 18, 0xa8adb4);
  } else if (type === 'rocket') {
    vehicle.add([
      stroke(scene.add.polygon(8, -3, [-62, 18, -44, -18, 32, -24, 66, -4, 38, 22], 0xd64839), OUTLINE, 5),
      stroke(scene.add.triangle(-66, 0, 0, -18, -34, 0, 0, 18, 0x6a727c), OUTLINE, 4),
      scene.add.triangle(-82, 5, 0, -15, -34, 0, 0, 15, 0xffb12e),
      scene.add.triangle(-99, 5, 0, -11, -30, 0, 0, 11, 0xffef7b),
      scene.add.circle(25, -7, 9, 0x9ee9ff),
    ]);
    addWheel(34, 28, 18, 0xffd85d);
  } else if (type === 'golden') {
    vehicle.add([
      stroke(scene.add.rectangle(0, -5, 116, 38, 0xf4d75c), 0x8d6112, 5),
      scene.add.rectangle(-20, -30, 76, 12, 0xfff0a0).setAngle(-12),
      scene.add.star(44, -32, 5, 8, 18, 0xfff3a6),
      scene.add.ellipse(0, -5, 128, 58, 0xffee88, 0.22),
    ]);
    addWheel(-40, 26, 18, 0xfff0a0);
    addWheel(40, 26, 18, 0xfff0a0);
  } else {
    vehicle.add([
      stroke(scene.add.rectangle(0, 0, 118, 34, 0x9b6332), OUTLINE, 5),
      stroke(scene.add.rectangle(-22, -29, 78, 12, 0x6a3c1e).setAngle(-13), OUTLINE, 3),
      scene.add.line(-48, -15, 32, -48, 31, -18, 0x2d2119).setLineWidth(4),
      scene.add.circle(-40, -4, 4, 0xd7b46b),
      scene.add.circle(28, 1, 4, 0xd7b46b),
    ]);
    addWheel(-42, 25, 17, 0xc48742);
    addWheel(42, 25, 17, 0xc48742);
  }

  const label = scene.add.text(0, -62, options.label || '', {
    fontFamily: 'Arial, sans-serif',
    fontSize: '14px',
    fontStyle: '900',
    color: Phaser.Display.Color.IntegerToColor(labelColor).rgba,
    stroke: '#291b12',
    strokeThickness: 3,
  }).setOrigin(0.5);
  vehicle.add(label);
  vehicle.setData('wheels', wheels);
  return vehicle;
}

export function createObstacleSprite(scene, x, y, type, stats = {}, data = {}) {
  const obj = scene.add.container(x, y);
  const dead = data.deadly || stats.deadly;
  const add = (item) => obj.add(item);
  add(scene.add.ellipse(0, (stats.h || 50) / 2 - 2, (stats.w || 70) * 0.92, 14, SHADOW, 0.16));

  if (type === 'crate') {
    add(stroke(scene.add.rectangle(0, 0, stats.w, stats.h, 0xb77436), OUTLINE, 4));
    add(scene.add.line(0, 0, -22, -22, 22, 22, 0x5c321a).setLineWidth(5));
    add(scene.add.line(0, 0, 22, -22, -22, 22, 0x5c321a).setLineWidth(5));
  } else if (type === 'fence') {
    [-28, 0, 28].forEach((px, i) => add(stroke(scene.add.rectangle(px, 0, 18, 52, 0x9a612f).setAngle(i % 2 ? 4 : -5), OUTLINE, 3)));
    add(stroke(scene.add.rectangle(0, -8, 92, 16, 0xbf7b3a).setAngle(-3), OUTLINE, 3));
    add(stroke(scene.add.rectangle(0, 14, 92, 14, 0x7b4925).setAngle(4), OUTLINE, 3));
  } else if (type === 'rock') {
    add(stroke(scene.add.polygon(0, 0, [-26, 18, -34, -4, -10, -28, 26, -18, 36, 10, 12, 28], 0x787d84), OUTLINE, 4));
    add(scene.add.line(-5, -10, -14, 0, 5, 2, 0x4e5359).setLineWidth(3));
  } else if (type === 'spikes') {
    add(stroke(scene.add.rectangle(0, 14, 88, 16, 0xa5322d), OUTLINE, 4));
    [-28, 0, 28].forEach((px) => add(stroke(scene.add.triangle(px, -6, 0, 28, 14, -16, 28, 28, 0xe8eef2), OUTLINE, 3)));
  } else if (type === 'veggieMine') {
    add(stroke(scene.add.circle(0, 0, 24, 0x8c4bc6), OUTLINE, 4));
    add(scene.add.circle(-7, -5, 5, 0xffd7ff));
    add(scene.add.rectangle(0, -31, 9, 15, 0xd43d35));
    scene.tweens.add({ targets: obj, scale: 1.12, duration: 520, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  } else if (type === 'onionSlick') {
    add(stroke(scene.add.ellipse(0, 0, 124, 38, 0xd5b2ff, 0.78), 0xffffff, 3, 0.75));
    add(scene.add.ellipse(-24, -3, 32, 10, 0xffffff, 0.55));
    add(scene.add.circle(36, -8, 5, 0xf7f0ff, 0.8));
  } else if (type === 'rotatingBeam') {
    add(stroke(scene.add.rectangle(0, 0, 138, 24, 0x704327), OUTLINE, 4));
    add(scene.add.circle(0, 0, 12, 0xf4d75c));
    add(scene.add.triangle(-58, 0, 0, -10, 16, 0, 0, 10, 0xff574a));
    add(scene.add.triangle(58, 0, 0, -10, 16, 0, 0, 10, 0xff574a).setAngle(180));
  } else if (type === 'fallingTomato') {
    add(stroke(scene.add.circle(0, 0, 24, 0xe64135), OUTLINE, 4));
    add(scene.add.rectangle(-8, -2, 9, 4, OUTLINE).setAngle(18));
    add(scene.add.rectangle(8, -2, 9, 4, OUTLINE).setAngle(-18));
    add(stroke(scene.add.ellipse(0, -24, 22, 10, 0x3e9b45), OUTLINE, 2));
  } else if (type === 'broccoliBarricade') {
    [-28, -8, 15, 34].forEach((px, i) => add(stroke(scene.add.circle(px, -10 - (i % 2) * 8, 22, 0x3e9b45), OUTLINE, 4)));
    add(stroke(scene.add.rectangle(0, 16, 86, 34, 0x5faa3c), OUTLINE, 4));
  } else if (type === 'stoneWall') {
    add(stroke(scene.add.rectangle(0, 0, 80, 78, 0x555a61), OUTLINE, 5));
    [-18, 14].forEach((px) => add(scene.add.line(px, 0, -16, -20, 16, 20, 0x34383d).setLineWidth(3)));
  } else {
    add(stroke(scene.add.rectangle(0, 0, stats.w || 60, stats.h || 40, stats.color || 0xffffff), OUTLINE, 4));
  }

  if (dead) {
    const warn = createWarningSign(scene, 0, -(stats.h || 50) / 2 - 28, 'danger');
    obj.add(warn);
  }
  return obj;
}

export function createCoinSprite(scene, x, y) {
  const coin = scene.add.container(x, y);
  coin.add([
    stroke(scene.add.circle(0, 0, 18, 0xf4d75c), 0x94630f, 4),
    scene.add.circle(-5, -6, 5, 0xfff3a6, 0.8),
    scene.add.text(0, 0, '*', { fontFamily: 'Arial', fontSize: '18px', fontStyle: '900', color: '#8d6112' }).setOrigin(0.5),
  ]);
  scene.tweens.add({ targets: coin, scaleX: 0.74, duration: 620, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  return coin;
}

export function createLandingMarker(scene, x, y, options = {}) {
  const marker = scene.add.container(x, y);
  const radius = options.radius || 24;
  marker.add([
    stroke(scene.add.circle(0, 0, radius, 0x74e35c, 0.34), 0xffffff, 4, 0.72),
    scene.add.circle(0, 0, radius * 0.45, 0xfff07a, 0.35),
  ]);
  scene.tweens.add({ targets: marker, scale: 1.18, alpha: 0.72, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  return marker;
}

export function createWarningSign(scene, x, y, type = 'danger') {
  const color = type === 'ram' ? 0xf4d75c : 0xf05d3f;
  const sign = scene.add.container(x, y);
  sign.add([
    stroke(scene.add.triangle(0, 0, 0, 24, 17, -8, 34, 24, color), OUTLINE, 3),
    scene.add.text(0, 5, '!', { fontFamily: 'Arial', fontSize: '18px', fontStyle: '900', color: '#ffffff', stroke: '#5b1510', strokeThickness: 2 }).setOrigin(0.5),
  ]);
  return sign;
}

export function addLevelBackdrop(scene, levelIndex, route, worldHeight) {
  const length = route.length;
  const themes = [
    [0x91d7ff, 0xb7e46d, 0x6eb15a],
    [0x91d7ff, 0xb7e46d, 0x6eb15a],
    [0xa7c8e8, 0xbca0da, 0x6c9f7b],
    [0x9fd7f2, 0xd8a865, 0x8a6744],
    [0x83cdf9, 0xf0a344, 0x7fc760],
    [0x9db4c7, 0x8b9298, 0x665f58],
    [0x8fd3e7, 0xb7bdc8, 0xe2cf5d],
    [0x7dc6f4, 0xd65d4c, 0x414853],
    [0x7caad2, 0x5d8d50, 0x41533a],
    [0x6f8ac3, 0x7c4a91, 0x3c5a37],
  ][Math.min(levelIndex, 9)];
  scene.add.rectangle(length / 2, worldHeight / 2, length, worldHeight, themes[0]).setDepth(-30);
  scene.add.circle(780, 86, 50, 0xfff0a2).setDepth(-28);
  for (let x = 120; x < length; x += 520) {
    scene.add.ellipse(x, 104 + (x % 4) * 7, 130, 42, 0xffffff, 0.5).setDepth(-27);
  }
  for (let x = -80; x < length + 300; x += 360) {
    scene.add.triangle(x, 290, 0, 120, 180, 20, 360, 120, themes[1], 0.55).setDepth(-24);
    scene.add.rectangle(x + 110, 585, 150, 38, themes[2], 0.32).setDepth(-18);
  }
  for (let x = 180; x < length; x += 430) {
    scene.add.rectangle(x, 620, 12, 58, 0x7b4a29, 0.55).setDepth(-12);
    scene.add.ellipse(x + 22, 590, 42, 18, 0xee7f2d, 0.5).setDepth(-12);
  }
  addThemeDecor(scene, levelIndex, length, route);
}

function addThemeDecor(scene, levelIndex, length, route) {
  const top = route.road?.top || 240;
  const decorY = top - 46;
  if (levelIndex === 0) {
    scene.add.rectangle(920, 230, 110, 120, 0x9b6332, 0.38).setDepth(-20);
    scene.add.triangle(920, 145, 0, 60, 55, 0, 110, 60, 0x704327, 0.45).setDepth(-20);
    for (let x = 580; x < length; x += 640) scene.add.triangle(x, decorY, 0, 34, 18, 0, 36, 34, 0xd64839, 0.75).setDepth(-10);
  } else if (levelIndex === 1) {
    for (let x = 420; x < length; x += 520) {
      scene.add.ellipse(x, decorY - 30, 38, 10, 0xf4f7ff, 0.75).setDepth(-10);
      scene.add.line(x, decorY - 18, -20, 0, 20, -5, 0xf4f7ff, 0.65).setLineWidth(3).setDepth(-10);
    }
  } else if (levelIndex === 2) {
    for (let x = 500; x < length; x += 560) scene.add.star(x, decorY - 20, 5, 8, 22, 0xd64839, 0.45).setDepth(-10);
  } else if (levelIndex === 3) {
    for (let x = 480; x < length; x += 500) {
      scene.add.rectangle(x, decorY, 54, 44, 0x8b4f2b, 0.7).setDepth(-10);
      scene.add.ellipse(x, decorY - 22, 56, 16, 0x704327, 0.75).setDepth(-10);
    }
  } else if (levelIndex === 4) {
    for (let x = 420; x < length; x += 420) scene.add.circle(x, decorY, 24, 0xf08a25, 0.55).setDepth(-10);
  } else if (levelIndex === 5) {
    for (let x = 380; x < length; x += 380) scene.add.polygon(x, decorY, [-24, 18, -16, -22, 18, -18, 28, 15], 0x858a91, 0.55).setDepth(-10);
  } else if (levelIndex === 6) {
    for (let x = 380; x < length; x += 430) {
      scene.add.rectangle(x, decorY, 78, 26, 0x6a727c, 0.58).setDepth(-10);
      scene.add.circle(x - 28, decorY + 18, 13, 0x24201d, 0.65).setDepth(-10);
      scene.add.circle(x + 28, decorY + 18, 13, 0x24201d, 0.65).setDepth(-10);
    }
  } else if (levelIndex === 7) {
    for (let x = 420; x < length; x += 500) scene.add.triangle(x, decorY, 0, 22, 44, 0, 0, -22, 0xffb12e, 0.55).setDepth(-10);
  } else if (levelIndex === 8) {
    for (let x = 500; x < length; x += 520) scene.add.rectangle(x, decorY, 80, 88, 0x3e9b45, 0.42).setDepth(-10);
  } else {
    scene.add.circle(760, 180, 86, 0x3e9b45, 0.34).setDepth(-22);
    scene.add.circle(700, 160, 42, 0x2d7836, 0.38).setDepth(-21);
    scene.add.circle(820, 160, 42, 0x2d7836, 0.38).setDepth(-21);
  }
}

export function createGapSprite(scene, gap, top, bottom) {
  const color = gap.type === 'kwas' ? 0x6ecf3d : 0x172636;
  const gapContainer = scene.add.container(gap.x, (top + bottom) / 2).setDepth(-6);
  gapContainer.add([
    stroke(scene.add.rectangle(0, 0, gap.width, bottom - top + 18, color), 0x2b2118, 4, 0.55),
    scene.add.ellipse(0, 0, gap.width * 0.72, bottom - top - 40, 0x111111, gap.type === 'kwas' ? 0.1 : 0.32),
    scene.add.rectangle(-gap.width / 2 - 8, 0, 14, bottom - top + 26, 0xe0bd68, 0.72).setAngle(-2),
    scene.add.rectangle(gap.width / 2 + 8, 0, 14, bottom - top + 26, 0xe0bd68, 0.72).setAngle(2),
  ]);
  return gapContainer;
}

export function addDustPuff(scene, x, y, color = 0xd8b46a, count = 4) {
  for (let i = 0; i < Math.min(count, 8); i += 1) {
    const puff = scene.add.circle(x, y, Phaser.Math.Between(3, 7), color, 0.34).setDepth(8);
    scene.tweens.add({
      targets: puff,
      x: x - Phaser.Math.Between(18, 48),
      y: y + Phaser.Math.Between(-10, 12),
      alpha: 0,
      scale: 1.8,
      duration: Phaser.Math.Between(300, 560),
      onComplete: () => puff.destroy(),
    });
  }
}

export function addSparkBurst(scene, x, y, color = 0xffef7b, count = 8) {
  for (let i = 0; i < Math.min(count, 14); i += 1) {
    const bit = scene.add.rectangle(x, y, Phaser.Math.Between(4, 9), 3, color, 0.95).setDepth(75).setAngle(Phaser.Math.Between(0, 180));
    scene.tweens.add({
      targets: bit,
      x: x + Phaser.Math.Between(-70, 70),
      y: y + Phaser.Math.Between(-60, 35),
      alpha: 0,
      duration: Phaser.Math.Between(240, 540),
      ease: 'Cubic.easeOut',
      onComplete: () => bit.destroy(),
    });
  }
}

export function addConfetti(scene, x, y) {
  const colors = [0xf4d75c, 0xd64839, 0x6bd6ff, 0x74e35c, 0xff8cc6];
  for (let i = 0; i < 28; i += 1) {
    const bit = scene.add.rectangle(x, y, 8, 4, colors[i % colors.length]).setDepth(85).setAngle(Phaser.Math.Between(0, 180));
    scene.tweens.add({
      targets: bit,
      x: x + Phaser.Math.Between(-150, 150),
      y: y + Phaser.Math.Between(-130, 80),
      angle: bit.angle + Phaser.Math.Between(120, 420),
      alpha: 0,
      duration: Phaser.Math.Between(700, 1150),
      ease: 'Cubic.easeOut',
      onComplete: () => bit.destroy(),
    });
  }
}
