import { firebaseEnabled, firebaseDb, firebaseAuth } from '../lib/firebase.js';
import {
  ref,
  push,
  set,
  onChildAdded,
  off,
  query as dbQuery,
  limitToLast,
  onValue,
  runTransaction,
} from 'firebase/database';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';

const GUEST_KEY = 'gruszka-chat-guest-id-v1';
const MUTED_KEY = 'gruszka-chat-muted-v1';

const MAX_LENGTH = 160;
const COOLDOWN_MS = 2500;
const BURST_LIMIT = { count: 5, windowMs: 30000 };

let firebaseUid = null;
let authInitialized = false;

function ensureAuth() {
  if (!firebaseEnabled || authInitialized) return Promise.resolve();
  authInitialized = true;
  if (!firebaseAuth) return Promise.resolve();
  return new Promise((resolve) => {
    onAuthStateChanged(firebaseAuth, (user) => {
      if (user) {
        firebaseUid = user.uid;
        resolve(user);
        return;
      }
      signInAnonymously(firebaseAuth).then((cred) => {
        firebaseUid = cred.user?.uid || null;
        resolve(cred.user);
      }).catch(() => resolve(null));
    });
  });
}

export function makeConversationId(a, b) {
  const ids = [String(a || ''), String(b || '')].sort();
  return `${ids[0]}_${ids[1]}`;
}

function getGuestId() {
  try {
    let id = localStorage.getItem(GUEST_KEY);
    if (!id) {
      id = `guest_${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(GUEST_KEY, id);
    }
    return id;
  } catch {
    return `guest_${Math.random().toString(36).slice(2, 10)}`;
  }
}

function sanitizeChatText(text = '') {
  let t = String(text || '')
    .replace(/[\u0000-\u001F\u007F]+/g, ' ')
    .trim()
    .slice(0, MAX_LENGTH);
  // Escape HTML
  t = t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return t;
}

const profanityList = ['kurwa', 'jeb', 'badword1', 'badword2'];
function basicProfanityFilter(text) {
  const lower = text.toLowerCase();
  return profanityList.some((p) => lower.includes(p));
}

const sentHistory = new Map(); // userId -> array of timestamps
const lastSent = new Map();

function canSend(userId) {
  const now = Date.now();
  const last = lastSent.get(userId) || 0;
  if (now - last < COOLDOWN_MS) return { ok: false, reason: 'Piszesz za szybko.' };
  const arr = sentHistory.get(userId) || [];
  const cutoff = now - BURST_LIMIT.windowMs;
  const recent = arr.filter((t) => t >= cutoff);
  if (recent.length >= BURST_LIMIT.count) return { ok: false, reason: 'Piszesz za szybko.' };
  return { ok: true };
}

function recordSend(userId) {
  const now = Date.now();
  lastSent.set(userId, now);
  const arr = sentHistory.get(userId) || [];
  arr.push(now);
  sentHistory.set(userId, arr.slice(-50));
}

export async function initChatUser(profile = null) {
  // profile: { id, username, display_name, avatar_pear }
  await ensureAuth();
  const userId = profile?.id || getGuestId();
  const username = profile?.display_name || profile?.username || (userId.startsWith('guest_') ? 'Gość' : 'Gracz');
  const avatarPear = profile?.avatar_pear || 'knight';
  return { userId, username, avatarPear, firebaseUid };
}

export function subscribeGlobalMessages(callback, limit = 50) {
  if (!firebaseEnabled || !firebaseDb) {
    callback({ type: 'error', reason: 'Chat nie skonfigurowany' });
    return () => {};
  }
  const listRef = ref(firebaseDb, 'chat/global/messages');
  const q = dbQuery(listRef, limitToLast(limit));
  const initialHandler = onValue(q, (snap) => {
    const arr = [];
    snap.forEach((child) => {
      arr.push({ id: child.key, ...child.val() });
    });
    callback({ type: 'initial', messages: arr });
  });
  const childAddedRef = onChildAdded(q, (snap) => {
    callback({ type: 'added', message: { id: snap.key, ...snap.val() } });
  });
  return () => {
    try { off(q); } catch {}
  };
}

export async function sendGlobalMessage({ text, user }) {
  if (!firebaseEnabled || !firebaseDb) throw new Error('Chat nie skonfigurowany');
  if (!user || String(user.userId || '').startsWith('guest_')) throw new Error('Zaloguj się, żeby pisać na chacie.');
  const clean = sanitizeChatText(text || '');
  if (!clean) throw new Error('Wiadomość jest pusta.');
  if (basicProfanityFilter(clean)) throw new Error('Tej wiadomości nie można wysłać.');
  const check = canSend(user.userId);
  if (!check.ok) throw new Error(check.reason);
  recordSend(user.userId);
  const now = Date.now();
  const payload = {
    text: clean,
    userId: user.userId,
    username: user.username,
    avatarPear: user.avatarPear || 'knight',
    createdAt: now,
    clientCreatedAt: now,
    type: 'message',
    deleted: false,
    firebaseUid: firebaseUid || null,
  };
  const messagesRef = ref(firebaseDb, 'chat/global/messages');
  const newRef = push(messagesRef);
  await set(newRef, payload);
  // update meta
  try {
    const metaRef = ref(firebaseDb, 'chat/global/meta');
    await runTransaction(metaRef, (curr) => {
      const next = curr || { lastMessageAt: now, messageCount: 0 };
      next.lastMessageAt = now;
      next.messageCount = (next.messageCount || 0) + 1;
      return next;
    });
  } catch (e) {
    // ignore
  }
  return { id: newRef.key, ...payload };
}

export function subscribePrivateMessages(conversationId, callback, limit = 50) {
  if (!firebaseEnabled || !firebaseDb) {
    callback({ type: 'error', reason: 'Chat nie skonfigurowany' });
    return () => {};
  }
  const path = `chat/private/${conversationId}/messages`;
  const listRef = ref(firebaseDb, path);
  const q = dbQuery(listRef, limitToLast(limit));
  const initialHandler = onValue(q, (snap) => {
    const arr = [];
    snap.forEach((child) => arr.push({ id: child.key, ...child.val() }));
    callback({ type: 'initial', messages: arr });
  });
  const childAddedRef = onChildAdded(q, (snap) => callback({ type: 'added', message: { id: snap.key, ...snap.val() } }));
  return () => { try { off(q); } catch {} };
}

export async function sendPrivateMessage({ conversationId, text, user, friend }) {
  if (!firebaseEnabled || !firebaseDb) throw new Error('Chat nie skonfigurowany');
  if (!user || String(user.userId || '').startsWith('guest_')) throw new Error('Zaloguj się, żeby pisać na czacie prywatnym.');
  const clean = sanitizeChatText(text || '');
  if (!clean) throw new Error('Wiadomość jest pusta.');
  if (basicProfanityFilter(clean)) throw new Error('Tej wiadomości nie można wysłać.');
  const check = canSend(user.userId);
  if (!check.ok) throw new Error(check.reason);
  recordSend(user.userId);
  const now = Date.now();
  const payload = {
    text: clean,
    userId: user.userId,
    username: user.username,
    avatarPear: user.avatarPear || 'knight',
    createdAt: now,
    clientCreatedAt: now,
    deleted: false,
  };
  const messagesRef = ref(firebaseDb, `chat/private/${conversationId}/messages`);
  const newRef = push(messagesRef);
  await set(newRef, payload);
  // update index for both participants
  try {
    const idxA = ref(firebaseDb, `chat/privateIndex/${user.userId}/${conversationId}`);
    await set(idxA, { friendId: friend.id, friendUsername: friend.username, lastMessage: payload.text, lastMessageAt: now });
    const idxB = ref(firebaseDb, `chat/privateIndex/${friend.id}/${conversationId}`);
    await set(idxB, { friendId: user.userId, friendUsername: user.username, lastMessage: payload.text, lastMessageAt: now });
  } catch (e) {}
  return { id: newRef.key, ...payload };
}

export async function reportMessage({ messagePath, messageId, reporterId, reason }) {
  if (!firebaseEnabled || !firebaseDb) throw new Error('Chat nie skonfigurowany');
  const now = Date.now();
  const payload = { messagePath, messageId, reporterId, reason: reason || 'inne', createdAt: now };
  const reportsRef = ref(firebaseDb, 'chat/reports');
  const newRef = push(reportsRef);
  await set(newRef, payload);
  return { id: newRef.key, ...payload };
}

export function muteUser(userId, mutedUserId) {
  try {
    const raw = JSON.parse(localStorage.getItem(MUTED_KEY) || '{}');
    raw[mutedUserId] = Date.now();
    localStorage.setItem(MUTED_KEY, JSON.stringify(raw));
    return true;
  } catch {
    return false;
  }
}

export function unmuteUser(userId, mutedUserId) {
  try {
    const raw = JSON.parse(localStorage.getItem(MUTED_KEY) || '{}');
    delete raw[mutedUserId];
    localStorage.setItem(MUTED_KEY, JSON.stringify(raw));
    return true;
  } catch {
    return false;
  }
}

export function getMutedUsers(userId) {
  try {
    const raw = JSON.parse(localStorage.getItem(MUTED_KEY) || '{}');
    return Object.keys(raw || {});
  } catch {
    return [];
  }
}

export { sanitizeChatText, basicProfanityFilter };
