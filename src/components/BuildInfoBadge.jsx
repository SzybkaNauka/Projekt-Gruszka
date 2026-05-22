import React from 'react';
import { APP_VERSION, BUILD_CHANNEL, BUILD_DATE, getRuntimeEnvironment, isFirebaseFrontendConfigured, isPwaMode, isSupabaseFrontendConfigured } from '../config/appConfig.js';

export default function BuildInfoBadge({ compact = false, online = true }) {
  const rows = [
    ['Version', APP_VERSION],
    ['Build', BUILD_DATE],
    ['Channel', BUILD_CHANNEL],
    ['Env', getRuntimeEnvironment()],
    ['Supabase', isSupabaseFrontendConfigured() ? 'yes' : 'no'],
    ['Firebase', isFirebaseFrontendConfigured() ? 'yes' : 'no'],
    ['PWA', isPwaMode() ? 'yes' : 'no'],
    ['Network', online ? 'online' : 'offline'],
  ];

  return (
    <div className={`build-info-badge ${compact ? 'compact' : ''}`}>
      {rows.map(([label, value]) => (
        <span key={label}><strong>{label}</strong> {value}</span>
      ))}
    </div>
  );
}
