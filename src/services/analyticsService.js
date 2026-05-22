import { supabase } from '../lib/supabase.js';

const ANALYTICS_KEY = 'gruszka-analytics-enabled-v1';
const GUEST_KEY = 'gruszka-guest-id-v1';
const EVENT_BUCKET = new Map();
let errorReports = 0;

export function getAnalyticsEnabled() {
  try {
    const value = localStorage.getItem(ANALYTICS_KEY);
    return value == null ? true : value === 'true';
  } catch {
    return true;
  }
}

export function setAnalyticsEnabled(enabled) {
  localStorage.setItem(ANALYTICS_KEY, String(Boolean(enabled)));
}

export function getGuestId() {
  let id = localStorage.getItem(GUEST_KEY);
  if (!id) {
    id = `guest_${Math.random().toString(36).slice(2)}_${Date.now()}`;
    localStorage.setItem(GUEST_KEY, id);
  }
  return id;
}

export async function trackEvent(eventName, metadata = {}, context = {}) {
  if (!supabase || !getAnalyticsEnabled()) return;
  const key = `${eventName}:${metadata.level_id || metadata.mode || ''}`;
  const now = Date.now();
  if (now - (EVENT_BUCKET.get(key) || 0) < 750) return;
  EVENT_BUCKET.set(key, now);
  await supabase.from('playtest_events').insert({
    user_id: context.userId || null,
    guest_id: context.userId ? null : getGuestId(),
    event_name: eventName,
    level_id: metadata.level_id || metadata.levelId || null,
    mode: metadata.mode || null,
    metadata,
  }).catch(() => {});
}

export async function reportClientError(error, source = 'app', metadata = {}, context = {}) {
  if (!supabase || errorReports >= 5) return;
  errorReports += 1;
  const message = error?.message || String(error || 'Unknown error');
  const stack = error?.stack || '';
  await supabase.from('client_errors').insert({
    user_id: context.userId || null,
    guest_id: context.userId ? null : getGuestId(),
    message,
    stack: stack.slice(0, 4000),
    source,
    metadata,
  }).catch(() => {});
}
