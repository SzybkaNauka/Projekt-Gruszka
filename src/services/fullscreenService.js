export function canUseFullscreen() {
  if (typeof document === 'undefined') return false;
  return !!(document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen || document.documentElement.msRequestFullscreen);
}

export function isFullscreen() {
  if (typeof document === 'undefined') return false;
  return !!(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
}

export async function enterFullscreen() {
  if (!canUseFullscreen()) throw new Error('Pełny ekran niedostępny');
  try {
    if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
    else if (document.documentElement.webkitRequestFullscreen) document.documentElement.webkitRequestFullscreen();
    else if (document.documentElement.msRequestFullscreen) document.documentElement.msRequestFullscreen();
  } catch (e) {
    throw e;
  }
}

export async function exitFullscreen() {
  try {
    if (document.exitFullscreen) await document.exitFullscreen();
    else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    else if (document.msExitFullscreen) document.msExitFullscreen();
  } catch (e) {
    // ignore
  }
}

export async function toggleFullscreen() {
  if (isFullscreen()) return exitFullscreen();
  return enterFullscreen();
}

export function isStandalonePWA() {
  if (typeof window === 'undefined') return false;
  try {
    return window.matchMedia && window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  } catch {
    return false;
  }
}
