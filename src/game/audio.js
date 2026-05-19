let audioContext;
let enabled = true;

function getContext() {
  if (!enabled) {
    return null;
  }

  if (!audioContext) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) {
      return null;
    }
    audioContext = new AudioContext();
  }

  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }

  return audioContext;
}

function tone(frequency, duration, type = 'sine', gain = 0.08, slideTo = frequency) {
  const context = getContext();
  if (!context) {
    return;
  }

  const oscillator = context.createOscillator();
  const volume = context.createGain();
  const now = context.currentTime;

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, now);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(40, slideTo), now + duration);
  volume.gain.setValueAtTime(gain, now);
  volume.gain.exponentialRampToValueAtTime(0.001, now + duration);
  oscillator.connect(volume);
  volume.connect(context.destination);
  oscillator.start(now);
  oscillator.stop(now + duration);
}

export function setAudioEnabled(value) {
  enabled = value;
}

export function isAudioEnabled() {
  return enabled;
}

export function playSound(name) {
  if (!enabled) {
    return;
  }

  if (name === 'engineLoop') {
    tone(92, 0.09, 'sawtooth', 0.018, 110);
  } else if (name === 'turn') {
    tone(210, 0.055, 'triangle', 0.018, 255);
  } else if (name === 'crash') {
    tone(96, 0.18, 'square', 0.07, 48);
    setTimeout(() => tone(180, 0.08, 'sawtooth', 0.04, 70), 45);
  } else if (name === 'pearLaunch') {
    tone(360, 0.14, 'sawtooth', 0.055, 140);
    tone(780, 0.11, 'triangle', 0.035, 420);
  } else if (name === 'pearLand') {
    tone(260, 0.08, 'triangle', 0.035, 190);
  } else if (name === 'perfectLanding') {
    tone(620, 0.08, 'triangle', 0.045, 880);
    setTimeout(() => tone(980, 0.11, 'triangle', 0.04, 1240), 70);
  } else if (name === 'coin') {
    tone(860, 0.055, 'triangle', 0.035, 1160);
  } else if (name === 'nearMiss') {
    tone(1040, 0.08, 'sine', 0.028, 640);
  } else if (name === 'vehicleBreak') {
    tone(120, 0.18, 'sawtooth', 0.065, 60);
    setTimeout(() => tone(240, 0.09, 'square', 0.035, 80), 55);
  } else if (name === 'uiClick') {
    tone(520, 0.055, 'triangle', 0.025, 660);
  } else if (name === 'pull') {
    tone(180, 0.045, 'triangle', 0.018, 210);
  } else if (name === 'shoot' || name === 'shot') {
    tone(420, 0.16, 'sawtooth', 0.055, 160);
    tone(730, 0.08, 'triangle', 0.035, 360);
  } else if (name === 'whiz' || name === 'whoosh') {
    tone(920, 0.13, 'sine', 0.025, 540);
  } else if (name === 'hit' || name === 'impactLight') {
    tone(150, 0.11, 'square', 0.045, 90);
  } else if (name === 'impactHeavy') {
    tone(110, 0.14, 'square', 0.06, 60);
  } else if (name === 'glassBreak') {
    tone(760, 0.11, 'triangle', 0.04, 1020);
    setTimeout(() => tone(520, 0.08, 'triangle', 0.025, 260), 50);
  } else if (name === 'woodBreak') {
    tone(280, 0.12, 'triangle', 0.06, 90);
    setTimeout(() => tone(190, 0.08, 'square', 0.035, 70), 45);
  } else if (name === 'stoneHit') {
    tone(130, 0.12, 'sawtooth', 0.04, 90);
  } else if (name === 'enemyHit') {
    tone(360, 0.08, 'square', 0.035, 260);
  } else if (name === 'enemy' || name === 'enemyDefeat') {
    tone(520, 0.1, 'square', 0.05, 310);
    setTimeout(() => tone(760, 0.12, 'triangle', 0.04, 420), 65);
  } else if (name === 'explosion') {
    tone(90, 0.22, 'sawtooth', 0.075, 45);
    setTimeout(() => tone(180, 0.12, 'square', 0.04, 70), 35);
  } else if (name === 'combo') {
    tone(640, 0.07, 'triangle', 0.04, 880);
    setTimeout(() => tone(880, 0.09, 'triangle', 0.035, 1120), 70);
  } else if (name === 'win') {
    tone(440, 0.12, 'triangle', 0.055, 550);
    setTimeout(() => tone(660, 0.14, 'triangle', 0.055, 820), 120);
    setTimeout(() => tone(880, 0.18, 'triangle', 0.055, 1040), 260);
  } else if (name === 'lose') {
    tone(260, 0.18, 'sawtooth', 0.05, 180);
    setTimeout(() => tone(180, 0.2, 'sawtooth', 0.045, 120), 170);
  } else if (name === 'reset') {
    tone(260, 0.08, 'triangle', 0.025, 210);
  } else if (name === 'record') {
    tone(760, 0.1, 'triangle', 0.05, 920);
    setTimeout(() => tone(1020, 0.16, 'triangle', 0.05, 1250), 90);
  } else if (name === 'ui') {
    tone(520, 0.055, 'triangle', 0.025, 660);
  }
}
