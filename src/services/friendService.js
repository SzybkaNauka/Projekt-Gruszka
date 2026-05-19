import { requireSupabase } from '../lib/supabase.js';

export async function searchProfiles(query) {
  const client = requireSupabase();
  const clean = String(query || '').trim().toLowerCase();
  if (clean.length < 2) return [];
  const { data, error } = await client.from('profiles').select('id, username, display_name, avatar_pear').ilike('username', `%${clean}%`).limit(10);
  if (error) throw error;
  return data || [];
}

export async function sendFriendRequest(requesterId, addresseeId) {
  if (!requesterId || requesterId === addresseeId) throw new Error('Nie możesz dodać samego siebie.');
  const client = requireSupabase();
  const { data, error } = await client.from('friendships').insert({ requester_id: requesterId, addressee_id: addresseeId, status: 'pending' }).select('*').single();
  if (error) throw error;
  return data;
}

export async function acceptFriendRequest(friendshipId) {
  const client = requireSupabase();
  const { data, error } = await client.from('friendships').update({ status: 'accepted', updated_at: new Date().toISOString() }).eq('id', friendshipId).select('*').single();
  if (error) throw error;
  return data;
}

export async function rejectFriendRequest(friendshipId) {
  return removeFriend(friendshipId);
}

export async function removeFriend(friendshipId) {
  const client = requireSupabase();
  const { error } = await client.from('friendships').delete().eq('id', friendshipId);
  if (error) throw error;
}

export async function getFriends(userId) {
  const client = requireSupabase();
  const { data, error } = await client
    .from('friendships')
    .select('*, requester:profiles!friendships_requester_id_fkey(id, username, display_name, avatar_pear), addressee:profiles!friendships_addressee_id_fkey(id, username, display_name, avatar_pear)')
    .eq('status', 'accepted')
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);
  if (error) throw error;
  return data || [];
}

export async function getPendingRequests(userId) {
  const client = requireSupabase();
  const { data, error } = await client
    .from('friendships')
    .select('*, requester:profiles!friendships_requester_id_fkey(id, username, display_name, avatar_pear), addressee:profiles!friendships_addressee_id_fkey(id, username, display_name, avatar_pear)')
    .eq('status', 'pending')
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);
  if (error) throw error;
  return data || [];
}
