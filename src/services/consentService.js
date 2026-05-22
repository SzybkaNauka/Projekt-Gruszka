import { supabase } from '../lib/supabase.js';
import { COMMUNITY_VERSION, OPTIONAL_CONSENT_KEYS, PRIVACY_VERSION, REQUIRED_CONSENT_KEYS, TERMS_VERSION } from '../legal/legalVersions.js';

export function getConsentState(playtest = false) {
  const terms = localStorage.getItem(REQUIRED_CONSENT_KEYS.terms);
  const privacy = localStorage.getItem(REQUIRED_CONSENT_KEYS.privacy);
  const community = localStorage.getItem(REQUIRED_CONSENT_KEYS.community);
  const analyticsStored = localStorage.getItem(OPTIONAL_CONSENT_KEYS.analytics);
  const marketingStored = localStorage.getItem(OPTIONAL_CONSENT_KEYS.marketing);
  return {
    termsAccepted: terms === TERMS_VERSION,
    privacyAccepted: privacy === PRIVACY_VERSION,
    communityAccepted: community === COMMUNITY_VERSION,
    analyticsConsent: analyticsStored == null ? Boolean(playtest) : analyticsStored === 'true',
    marketingConsent: marketingStored === 'true',
    versions: { terms, privacy, community },
  };
}

export function hasRequiredConsents(playtest = false) {
  const state = getConsentState(playtest);
  return state.termsAccepted && state.privacyAccepted && state.communityAccepted;
}

export async function saveConsentState({ analyticsConsent, marketingConsent }, userId = null) {
  localStorage.setItem(REQUIRED_CONSENT_KEYS.terms, TERMS_VERSION);
  localStorage.setItem(REQUIRED_CONSENT_KEYS.privacy, PRIVACY_VERSION);
  localStorage.setItem(REQUIRED_CONSENT_KEYS.community, COMMUNITY_VERSION);
  localStorage.setItem(OPTIONAL_CONSENT_KEYS.analytics, String(Boolean(analyticsConsent)));
  localStorage.setItem(OPTIONAL_CONSENT_KEYS.marketing, String(Boolean(marketingConsent)));

  if (supabase && userId) {
    await supabase.from('user_consents').upsert({
      user_id: userId,
      terms_version: TERMS_VERSION,
      privacy_version: PRIVACY_VERSION,
      community_version: COMMUNITY_VERSION,
      analytics_consent: Boolean(analyticsConsent),
      marketing_consent: Boolean(marketingConsent),
      updated_at: new Date().toISOString(),
    }).catch(() => {});
  }
}

export function saveOptionalConsents({ analyticsConsent, marketingConsent }) {
  localStorage.setItem(OPTIONAL_CONSENT_KEYS.analytics, String(Boolean(analyticsConsent)));
  localStorage.setItem(OPTIONAL_CONSENT_KEYS.marketing, String(Boolean(marketingConsent)));
}

export function exportLocalData() {
  const data = {};
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    data[key] = localStorage.getItem(key);
  }
  return JSON.stringify(data, null, 2);
}
