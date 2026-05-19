import React, { useEffect, useMemo, useState } from 'react';
import {
  acceptFriendRequest,
  getFriends,
  getPendingRequests,
  rejectFriendRequest,
  removeFriend,
  searchProfiles,
  sendFriendRequest,
} from '../services/friendService.js';
import { getUserBestScores } from '../services/scoreService.js';
import { playSound } from '../game/audio.js';

function formatFriendRow(friend) {
  return friend?.profiles?.display_name || friend?.profiles?.username || friend?.username || 'Gracz';
}

function getOtherProfile(friendship, userId) {
  if (!friendship) return null;
  if (friendship.requester_id === userId) return friendship.addressee;
  return friendship.requester;
}

function compareResults(userRows, friendRows) {
  const results = [];
  let mine = 0;
  let theirs = 0;
  let ties = 0;
  for (let level = 1; level <= 50; level += 1) {
    const mineRow = userRows.find((row) => row.level_id === level) || { score: 0 };
    const friendRow = friendRows.find((row) => row.level_id === level) || { score: 0 };
    const diff = (mineRow.score || 0) - (friendRow.score || 0);
    if (diff > 0) mine += 1;
    else if (diff < 0) theirs += 1;
    else ties += 1;
    results.push({ level, mine: mineRow.score || 0, friend: friendRow.score || 0, diff });
  }
  const topFriendWins = results.filter((item) => item.diff < 0).sort((a, b) => a.diff - b.diff).slice(0, 5);
  const topMyWins = results.filter((item) => item.diff > 0).sort((a, b) => b.diff - a.diff).slice(0, 5);
  return { mine, theirs, ties, topFriendWins, topMyWins };
}

export default function FriendsPanel({ session, onOpenLeaderboard }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [friends, setFriends] = useState([]);
  const [pending, setPending] = useState([]);
  const [status, setStatus] = useState('');
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [actionsLoading, setActionsLoading] = useState({});
  const [compareFriend, setCompareFriend] = useState(null);
  const [compareStats, setCompareStats] = useState(null);

  const friendIds = useMemo(() => new Set(friends.map((friendship) => getOtherProfile(friendship, session?.user?.id)?.id)), [friends, session?.user?.id]);
  const pendingIds = useMemo(() => new Set(pending.map((item) => item.requester_id === session?.user?.id ? item.addressee_id : item.requester_id)), [pending, session?.user?.id]);

  async function refresh() {
    if (!session?.user) return;
    try {
      const [nextFriends, nextPending] = await Promise.all([
        getFriends(session.user.id),
        getPendingRequests(session.user.id),
      ]);
      setFriends(nextFriends);
      setPending(nextPending);
    } catch (error) {
      setStatus(error.message || 'Błąd ładowania znajomych.');
    }
  }

  useEffect(() => { refresh(); }, [session]);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return undefined;
    }
    const timeout = window.setTimeout(async () => {
      setLoadingSearch(true);
      try {
        const data = await searchProfiles(query);
        setResults(data.filter((profile) => profile.id !== session?.user?.id));
      } catch (error) {
        setStatus(error.message || 'Nie udało się wyszukać profili.');
      } finally {
        setLoadingSearch(false);
      }
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [query, session?.user?.id]);

  async function handleSendRequest(addresseeId) {
    if (!session?.user || actionsLoading[addresseeId]) return;
    setActionsLoading((current) => ({ ...current, [addresseeId]: true }));
    try {
      await sendFriendRequest(session.user.id, addresseeId);
      await refresh();
      playSound('friendRequest');
      setStatus('Zaproszenie wysłane.');
    } catch (error) {
      setStatus(error.message || 'Nie udało się wysłać zaproszenia.');
    } finally {
      setActionsLoading((current) => ({ ...current, [addresseeId]: false }));
    }
  }

  async function handleAccept(friendshipId) {
    setActionsLoading((current) => ({ ...current, [friendshipId]: true }));
    try {
      await acceptFriendRequest(friendshipId);
      await refresh();
      playSound('friendRequest');
    } catch (error) {
      setStatus(error.message || 'Nie udało się zaakceptować zaproszenia.');
    } finally {
      setActionsLoading((current) => ({ ...current, [friendshipId]: false }));
    }
  }

  async function handleReject(friendshipId) {
    setActionsLoading((current) => ({ ...current, [friendshipId]: true }));
    try {
      await rejectFriendRequest(friendshipId);
      await refresh();
    } catch (error) {
      setStatus(error.message || 'Nie udało się odrzucić zaproszenia.');
    } finally {
      setActionsLoading((current) => ({ ...current, [friendshipId]: false }));
    }
  }

  async function handleRemove(friendshipId) {
    setActionsLoading((current) => ({ ...current, [friendshipId]: true }));
    try {
      await removeFriend(friendshipId);
      await refresh();
    } catch (error) {
      setStatus(error.message || 'Nie udało się usunąć znajomego.');
    } finally {
      setActionsLoading((current) => ({ ...current, [friendshipId]: false }));
    }
  }

  async function openCompare(otherProfile) {
    setCompareFriend(otherProfile);
    playSound('leaderboardOpen');
    if (!session?.user || !otherProfile?.id) return;
    try {
      const [mine, theirs] = await Promise.all([
        getUserBestScores(session.user.id),
        getUserBestScores(otherProfile.id),
      ]);
      setCompareStats(compareResults(mine, theirs));
    } catch (error) {
      setStatus(error.message || 'Nie udało się porównać wyników.');
    }
  }

  if (!session?.user) {
    return (
      <section className="online-panel">
        <h2>Znajomi</h2>
        <p>Zaloguj się, aby dodawać znajomych.</p>
      </section>
    );
  }

  return (
    <section className="online-panel friends-panel">
      <div className="panel-top">
        <h2>Znajomi</h2>
        {onOpenLeaderboard && (
          <button className="secondary-button" type="button" onClick={onOpenLeaderboard}>Ranking znajomych</button>
        )}
      </div>

      <div className="online-form inline">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Szukaj po username"
        />
        <button type="button" onClick={() => setQuery(query)} disabled={loadingSearch}>Szukaj</button>
      </div>
      {loadingSearch && <p>Wyszukiwanie...</p>}
      {query && results.length === 0 && !loadingSearch && <p>Brak profili.</p>}
      {results.map((profile) => {
        const alreadyFriend = friendIds.has(profile.id);
        const pendingRequest = pendingIds.has(profile.id);
        return (
          <div key={profile.id} className="friend-row">
            <span>{profile.username}</span>
            <button
              type="button"
              disabled={alreadyFriend || pendingRequest}
              onClick={() => handleSendRequest(profile.id)}
            >
              {alreadyFriend ? 'Znajomy' : pendingRequest ? 'Wysłane' : 'Dodaj znajomego'}
            </button>
          </div>
        );
      })}

      <h3>Zaproszenia</h3>
      {pending.length === 0 && <p>Brak zaproszeń</p>}
      {pending.map((friendship) => {
        const other = getOtherProfile(friendship, session.user.id);
        const isForMe = friendship.addressee_id === session.user.id;
        return (
          <div key={friendship.id} className="friend-row">
            <span>{other?.username || 'Gracz'}</span>
            {isForMe && (
              <>
                <button type="button" onClick={() => handleAccept(friendship.id)} disabled={actionsLoading[friendship.id]}>Akceptuj</button>
                <button type="button" onClick={() => handleReject(friendship.id)} disabled={actionsLoading[friendship.id]}>Odrzuć</button>
              </>
            )}
            {!isForMe && (
              <button type="button" onClick={() => handleReject(friendship.id)} disabled={actionsLoading[friendship.id]}>Anuluj</button>
            )}
          </div>
        );
      })}

      <h3>Moi znajomi</h3>
      {friends.length === 0 && <p>Brak znajomych</p>}
      {friends.map((friendship) => {
        const other = getOtherProfile(friendship, session.user.id);
        if (!other) return null;
        return (
          <div key={friendship.id} className="friend-row friend-card">
            <div>
              <strong>{other.display_name || other.username}</strong>
              <span>@{other.username}</span>
            </div>
            <div className="friend-actions">
              <button type="button" onClick={() => openCompare(other)}>Porównaj wyniki</button>
              <button type="button" onClick={() => handleRemove(friendship.id)} disabled={actionsLoading[friendship.id]}>Usuń</button>
            </div>
          </div>
        );
      })}

      {status && <p className="online-status">{status}</p>}

      {compareFriend && (
        <div className="compare-modal">
          <div className="compare-header">
            <h3>Porównanie z {compareFriend.display_name || compareFriend.username}</h3>
            <button type="button" onClick={() => { setCompareFriend(null); setCompareStats(null); }}>Zamknij</button>
          </div>
          {compareStats ? (
            <div className="compare-grid">
              <div className="compare-summary">
                <p>Ty wygrałeś: <strong>{compareStats.mine}</strong> poziomów</p>
                <p>On wygrał: <strong>{compareStats.theirs}</strong> poziomów</p>
                <p>Remisy: <strong>{compareStats.ties}</strong></p>
              </div>
              <div className="compare-list">
                <strong>Top 5 gdzie on cię bije</strong>
                {compareStats.topFriendWins.length === 0 && <p>Brak przewag znajomego</p>}
                {compareStats.topFriendWins.map((item) => (
                  <div key={item.level} className="compare-row">
                    <span>Lvl {item.level}</span>
                    <span>{item.friend} vs {item.mine}</span>
                  </div>
                ))}
              </div>
              <div className="compare-list">
                <strong>Top 5 gdzie ty go bijesz</strong>
                {compareStats.topMyWins.length === 0 && <p>Brak twoich przewag</p>}
                {compareStats.topMyWins.map((item) => (
                  <div key={item.level} className="compare-row">
                    <span>Lvl {item.level}</span>
                    <span>{item.mine} vs {item.friend}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p>Ładowanie porównania...</p>
          )}
        </div>
      )}
    </section>
  );
}
