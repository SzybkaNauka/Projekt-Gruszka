export function canUseFullscreen(target = null) {
  if (typeof document === 'undefined') return false;
  const element = target || document.documentElement;
  return !!(element?.requestFullscreen || element?.webkitRequestFullscreen || element?.msRequestFullscreen);
}

export function isFullscreen() {
  if (typeof document === 'undefined') return false;
  return !!(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
}

export async function enterFullscreen(target = document.documentElement) {
  if (!canUseFullscreen(target)) throw new Error('Pełny ekran niedostępny');
  if (target.requestFullscreen) await target.requestFullscreen({ navigationUI: 'hide' });
  else if (target.webkitRequestFullscreen) target.webkitRequestFullscreen();
  else if (target.msRequestFullscreen) target.msRequestFullscreen();
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

export async function toggleFullscreen(target = document.documentElement) {
  if (isFullscreen()) return exitFullscreen();
  return enterFullscreen(target);
}

export function isStandalonePWA() {
  if (typeof window === 'undefined') return false;
  try {
    return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true;
  } catch {
    return false;
  }
}
