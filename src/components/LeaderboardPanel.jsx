import React, { useEffect, useMemo, useState } from 'react';
import { isSupabaseConfigured } from '../lib/supabase.js';
import { getFriendsLeaderboard, getGlobalLeaderboard, getUserBestScores } from '../services/scoreService.js';
import { isOnline } from '../services/networkService.js';
import { MAX_LEVEL } from '../game/constants.js';
import { playSound } from '../game/audio.js';

const leaderboardTabs = [
  { key: 'global', label: 'Globalny' },
  { key: 'friends', label: 'Znajomi' },
  { key: 'mine', label: 'Moje wyniki' },
  { key: 'week', label: 'Top tygodnia' },
  { key: 'today', label: 'Top dziś' },
];

const worlds = [
  { value: 'all', label: 'Wszystkie' },
  { value: '1-10', label: 'Startowa Farma' },
  { value: '11-20', label: 'Drugi Bieg' },
  { value: '21-30', label: 'Próba Mistrza' },
  { value: '31-40', label: 'Very Hard' },
  { value: '41-50', label: 'Impossible' },
];

const levelOptions = [{ value: 'all', label: 'Wszystkie poziomy' }, ...Array.from({ length: MAX_LEVEL }, (_, index) => ({ value: String(index + 1), label: `Poziom ${index + 1}` }))];

function formatDate(value) {
  if (!value) return '—';
  try {
    const date = new Date(value);
    return date.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: '2-digit' });
  } catch {
    return '—';
  }
}

function starsLabel(count = 0) {
  return Array.from({ length: 3 }, (_, index) => (index < count ? '★' : '☆')).join('');
}

function TopSkeleton() {
  return (
    <div className="leaderboard-skeleton">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="skeleton-row">
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
      ))}
    </div>
  );
}

export default function LeaderboardPanel({ session, defaultTab = 'global', defaultLevel = 'all', defaultWorld = 'all' }) {
  const [tab, setTab] = useState(defaultTab);
  const [levelId, setLevelId] = useState(defaultLevel);
  const [worldFilter, setWorldFilter] = useState(defaultWorld);
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [retryToken, setRetryToken] = useState(0);

  const online = isOnline();
  const timeRange = tab === 'week' ? 'week' : tab === 'today' ? 'today' : 'all';
  const isMineTab = tab === 'mine';

  useEffect(() => {
    setTab(defaultTab);
  }, [defaultTab]);

  useEffect(() => {
    setLevelId(defaultLevel);
  }, [defaultLevel]);

  useEffect(() => {
    setWorldFilter(defaultWorld);
  }, [defaultWorld]);

  useEffect(() => {
    playSound('leaderboardOpen');
  }, [tab]);

  useEffect(() => {
    let alive = true;
    async function load() {
      setStatus('');
      setRows([]);
      if (!isSupabaseConfigured) {
        setStatus('Ranking wymaga konfiguracji Supabase.');
        return;
      }
      if (!online && !isMineTab) {
        setStatus('Jesteś offline — ranking niedostępny.');
        return;
      }
      if ((tab === 'friends' || tab === 'mine') && !session?.user) {
        setStatus('Zaloguj się, aby zobaczyć ten ranking.');
        return;
      }
      setLoading(true);
      try {
        const data = tab === 'mine'
          ? await getUserBestScores(session.user.id, levelId, worldFilter)
          : tab === 'friends'
            ? await getFriendsLeaderboard(levelId, session.user.id, worldFilter, timeRange)
            : await getGlobalLeaderboard(levelId, worldFilter, timeRange);

        const fullRows = data || [];
        if (tab === 'friends' && session?.user) {
          const hasSelf = fullRows.some((row) => row.user_id === session.user.id);
          if (!hasSelf) {
            fullRows.push({
              user_id: session.user.id,
              profiles: { username: 'Ty', display_name: 'Ty', avatar_pear: 'knight' },
              level_id: Number(levelId) || 0,
              score: 0,
              stars: 0,
              combo_max: 0,
              perfect_run: false,
              created_at: null,
            });
          }
        }

        if (alive) setRows(fullRows);
      } catch (error) {
        if (alive) {
          console.error(error);
          setStatus('Nie udało się pobrać rankingu.');
        }
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => { alive = false; };
  }, [tab, levelId, worldFilter, session?.user?.id, online, retryToken, isMineTab]);

  const leaderboardTitle = useMemo(() => {
    if (tab === 'global') return 'KRÓL GRUSZEK';
    if (tab === 'friends') return 'TOP ZNAJOMYCH';
    if (tab === 'mine') return 'MOJE WYNIKI';
    if (tab === 'week') return 'TOP TYGODNIA';
    if (tab === 'today') return 'TOP DZIŚ';
    return 'Ranking';
  }, [tab]);

  const sortedRows = useMemo(() => {
    if (!rows?.length) return [];
    if (tab === 'mine') return rows;
    return [...rows].sort((a, b) => Number(b.score || 0) - Number(a.score || 0));
  }, [rows, tab]);

  const myId = session?.user?.id;

  function badgeLabel(index) {
    if (index === 0) return 'KRÓL';
    if (index === 1) return 'DRUGI';
    if (index === 2) return 'TRZECI';
    return `#${index + 1}`;
  }

  return (
    <section className="online-panel leaderboard-panel">
      <div className="panel-top">
        <div>
          <h2>{leaderboardTitle}</h2>
          <p className="leaderboard-subtitle">Ranking wysokich wyników i najlepszych runów. Filtruj przez świat, poziom i okres.</p>
        </div>
        <div className="tab-row">
          {leaderboardTabs.map((item) => (
            <button
              key={item.key}
              type="button"
              className={item.key === tab ? 'active' : ''}
              onClick={() => setTab(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="filters-row">
        <label>
          Świat
          <select value={worldFilter} onChange={(event) => setWorldFilter(event.target.value)}>
            {worlds.map((world) => (
              <option key={world.value} value={world.value}>{world.label}</option>
            ))}
          </select>
        </label>
        <label>
          Poziom
          <select value={levelId} onChange={(event) => setLevelId(event.target.value)}>
            {levelOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
      </div>

      {loading && <TopSkeleton />}
      {status && (
        <div className="online-status leaderboard-status">
          <p>{status}</p>
          {status.includes('Nie udało się') && (
            <button className="secondary-button" type="button" onClick={() => setRetryToken((value) => value + 1)}>Spróbuj ponownie</button>
          )}
        </div>
      )}

      {!loading && !status && tab !== 'mine' && (
        <div className="score-table">
          {sortedRows.length === 0 ? (
            <div className="empty-state">Brak wyników dla wybranych filtrów.</div>
          ) : sortedRows.map((row, index) => {
            const profile = row.profiles || {};
            const isMe = row.user_id === myId;
            const badgeClass = index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : '';
            const levelAccent = row.level_id >= 41 ? 'impossible' : '';
            return (
              <div key={`${row.user_id}-${row.level_id}-${index}`} className={`score-row ${badgeClass} ${isMe ? 'current-user' : ''} ${levelAccent}`}>
                <span className="rank">{badgeLabel(index)}</span>
                <span className="name">
                  <strong>{profile.display_name || profile.username || 'GRACZ'}</strong>
                  <small>{profile.username ? `@${profile.username}` : 'Anonim'}</small>
                </span>
                <span className="level">{row.level_id ? `Lvl ${row.level_id}` : 'ALL'}</span>
                <span className="score">{row.score ?? 0}</span>
                <span className="stars">{starsLabel(row.stars)}</span>
                <span className="tags">
                  {row.perfect_run && <em className="tag perfect">PERFECT!</em>}
                  {row.created_at && <small>{formatDate(row.created_at)}</small>}
                </span>
                <span className="combo">x{row.combo_max || 0}</span>
              </div>
            );
          })}
        </div>
      )}

      {!loading && !status && tab === 'mine' && (
        <div className="my-results-grid">
          {sortedRows.map((row, index) => {
            const completed = row.score > 0;
            return (
              <div key={`mine-${index + 1}`} className={`result-card ${completed ? '' : 'empty'}`}>
                <div className="result-card-head">
                  <strong>Poziom {index + 1}</strong>
                  <span>{completed ? starsLabel(row.stars) : 'Nie ukończono'}</span>
                </div>
                <div className="result-card-body">
                  <div>{completed ? `Wynik: ${row.score}` : 'Brak rekordu'}</div>
                  <div>{completed ? `Combo max: x${row.combo_max}` : ''}</div>
                  <div>{completed && row.perfect_run ? 'PERFECT RUN' : ''}</div>
                  <div className="result-card-date">{completed ? formatDate(row.updated_at || row.created_at) : ''}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
