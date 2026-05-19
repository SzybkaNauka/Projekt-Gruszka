export function isOnline() {
  return typeof navigator === 'undefined' ? true : navigator.onLine;
}

export function onOnline(callback) {
  window.addEventListener('online', callback);
  return () => window.removeEventListener('online', callback);
}

export function onOffline(callback) {
  window.addEventListener('offline', callback);
  return () => window.removeEventListener('offline', callback);
}
