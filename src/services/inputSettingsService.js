export const TOUCH_CONTROLS_KEY = 'touchControlsEnabled';

export function isTouchDevice() {
  if (typeof navigator === 'undefined') return false;
  return ('maxTouchPoints' in navigator && navigator.maxTouchPoints > 0) || window.matchMedia?.('(pointer:coarse)')?.matches;
}

export function getTouchControlsEnabledFromQuery() {
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.has('touchControls')) {
      const v = params.get('touchControls');
      if (v === '1') return true;
      if (v === '0') return false;
    }
  } catch (e) {}
  return null;
}

export function shouldDefaultTouchControlsEnabled() {
  const q = getTouchControlsEnabledFromQuery();
  if (q !== null) return q;
  return isTouchDevice();
}

export function getTouchControlsEnabled() {
  try {
    const raw = localStorage.getItem(TOUCH_CONTROLS_KEY);
    if (raw === null) return shouldDefaultTouchControlsEnabled();
    return raw === '1' || raw === 'true';
  } catch (e) {
    return shouldDefaultTouchControlsEnabled();
  }
}

export function setTouchControlsEnabled(value) {
  try {
    localStorage.setItem(TOUCH_CONTROLS_KEY, value ? '1' : '0');
  } catch (e) {}
}
