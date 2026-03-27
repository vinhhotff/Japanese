import { supabase } from '../config/supabase';

export type StudyLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1' | 'HSK1' | 'HSK2' | 'HSK3' | 'HSK4' | 'HSK5' | 'HSK6';
export type StudyGoal = 'conversation' | 'jlpt' | 'hsk' | 'business' | 'travel' | 'reading' | 'writing';

export interface PeerProfile {
  id: string;
  user_id: string;
  display_name: string;
  bio?: string;
  language: 'japanese' | 'chinese' | 'both';
  study_level: StudyLevel;
  study_goal: StudyGoal;
  available_days: string[]; // ['mon','tue','wed','thu','fri','sat','sun']
  available_hours: string; // e.g. "18:00 - 22:00"
  timezone: string;
  avatar_url?: string;
  is_online: boolean;
  last_seen?: string;
  total_matches?: number;
  created_at: string;
  updated_at: string;
  // Joined
  profiles?: {
    email: string;
    full_name?: string;
    avatar_url?: string;
  };
}

export interface PeerMatchRequest {
  id: string;
  from_user_id: string;
  to_user_id: string;
  status: 'pending' | 'accepted' | 'declined';
  message?: string;
  created_at: string;
  updated_at: string;
  // Joined
  from_profile?: {
    email: string;
    full_name?: string;
    avatar_url?: string;
  };
  to_profile?: {
    email: string;
    full_name?: string;
    avatar_url?: string;
  };
}

export interface PeerChatMessage {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  profiles?: {
    email: string;
    full_name?: string;
    avatar_url?: string;
  };
}

// === PEER PROFILES ===

export const getPeerProfile = async (userId: string): Promise<PeerProfile | null> => {
  const { data, error } = await supabase
    .from('peer_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('email, full_name, avatar_url')
    .eq('id', userId)
    .maybeSingle();

  return { ...data, profiles: profile };
};

export const getOrCreatePeerProfile = async (userId: string): Promise<PeerProfile> => {
  const { data: existing, error } = await supabase
    .from('peer_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;

  let data = existing;

  if (!data) {
    const { data: newProfile, error: createError } = await supabase
      .from('peer_profiles')
      .insert({
        user_id: userId,
        display_name: '',
        language: 'japanese',
        study_level: 'N5',
        study_goal: 'jlpt',
        available_days: [],
        available_hours: '',
        timezone: 'Asia/Ho_Chi_Minh',
      })
      .select('*')
      .limit(1)
      .maybeSingle();

    if (createError) throw createError;
    data = newProfile;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('email, full_name, avatar_url')
    .eq('id', userId)
    .maybeSingle();

  return { ...(data as PeerProfile), profiles: profile };
};

export const updatePeerProfile = async (userId: string, updates: Partial<Omit<PeerProfile, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'profiles'>>): Promise<PeerProfile> => {
  const { data, error } = await supabase
    .from('peer_profiles')
    .update(updates)
    .eq('user_id', userId)
    .select('*')
    .limit(1)
    .maybeSingle();

  if (error) throw error;

  const { data: profile } = await supabase
    .from('profiles')
    .select('email, full_name, avatar_url')
    .eq('id', userId)
    .maybeSingle();

  return { ...(data as PeerProfile), profiles: profile };
};

export const browsePeers = async (filters?: {
  language?: string;
  level?: StudyLevel;
  goal?: StudyGoal;
}): Promise<PeerProfile[]> => {
  let query = supabase
    .from('peer_profiles')
    .select('*')
    .neq('user_id', '')
    .order('is_online', { ascending: false })
    .order('updated_at', { ascending: false });

  if (filters?.language) {
    query = query.eq('language', filters.language);
  }
  if (filters?.level) {
    query = query.eq('study_level', filters.level);
  }
  if (filters?.goal) {
    query = query.eq('study_goal', filters.goal);
  }

  const { data, error } = await query.limit(50);
  if (error) throw error;
  if (!data || data.length === 0) return [];

  const userIds = data.map(p => p.user_id);
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email, full_name, avatar_url')
    .in('id', userIds);

  const profileMap: Record<string, { email: string; full_name?: string; avatar_url?: string }> = {};
  profiles?.forEach(p => { profileMap[p.id] = p; });

  return data.map(p => ({ ...p, profiles: profileMap[p.user_id] }));
};

// === MATCH REQUESTS ===

export const getSentMatchRequests = async (userId: string): Promise<PeerMatchRequest[]> => {
  const { data, error } = await supabase
    .from('peer_match_requests')
    .select('*')
    .eq('from_user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  if (!data || data.length === 0) return [];

  const otherIds = data.map(r => r.to_user_id);
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email, full_name, avatar_url')
    .in('id', otherIds);

  const profileMap: Record<string, { email: string; full_name?: string; avatar_url?: string }> = {};
  profiles?.forEach(p => { profileMap[p.id] = p; });

  const { data: myProfile } = await supabase
    .from('profiles')
    .select('email, full_name, avatar_url')
    .eq('id', userId)
    .maybeSingle();

  return data.map(r => ({
    ...r,
    from_profile: myProfile,
    to_profile: profileMap[r.to_user_id],
  }));
};

export const getReceivedMatchRequests = async (userId: string): Promise<PeerMatchRequest[]> => {
  const { data, error } = await supabase
    .from('peer_match_requests')
    .select('*')
    .eq('to_user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  if (!data || data.length === 0) return [];

  const otherIds = data.map(r => r.from_user_id);
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email, full_name, avatar_url')
    .in('id', otherIds);

  const profileMap: Record<string, { email: string; full_name?: string; avatar_url?: string }> = {};
  profiles?.forEach(p => { profileMap[p.id] = p; });

  const { data: myProfile } = await supabase
    .from('profiles')
    .select('email, full_name, avatar_url')
    .eq('id', userId)
    .maybeSingle();

  return data.map(r => ({
    ...r,
    from_profile: profileMap[r.from_user_id],
    to_profile: myProfile,
  }));
};

export const sendMatchRequest = async (request: {
  from_user_id: string;
  to_user_id: string;
  message?: string;
}): Promise<PeerMatchRequest> => {
  const { data, error } = await supabase
    .from('peer_match_requests')
    .insert(request)
    .select()
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const respondToMatchRequest = async (
  requestId: string,
  status: 'accepted' | 'declined'
): Promise<PeerMatchRequest> => {
  const { data, error } = await supabase
    .from('peer_match_requests')
    .update({ status })
    .eq('id', requestId)
    .select()
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const cancelMatchRequest = async (requestId: string): Promise<void> => {
  const { error } = await supabase
    .from('peer_match_requests')
    .delete()
    .eq('id', requestId)
    .eq('status', 'pending');

  if (error) throw error;
};

// === ACTIVE MATCHES ===

export const getActiveMatches = async (userId: string): Promise<PeerMatchRequest[]> => {
  const { data, error } = await supabase
    .from('peer_match_requests')
    .select('*')
    .eq('status', 'accepted')
    .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  if (!data || data.length === 0) return [];

  const otherIds = data.map(r => r.from_user_id === userId ? r.to_user_id : r.from_user_id);
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email, full_name, avatar_url')
    .in('id', otherIds);

  const profileMap: Record<string, { email: string; full_name?: string; avatar_url?: string }> = {};
  profiles?.forEach(p => { profileMap[p.id] = p; });

  const { data: myProfile } = await supabase
    .from('profiles')
    .select('email, full_name, avatar_url')
    .eq('id', userId)
    .maybeSingle();

  return data.map(r => ({
    ...r,
    from_profile: myProfile,
    to_profile: profileMap[r.from_user_id === userId ? r.to_user_id : r.from_user_id],
  }));
};

// === PEER CHAT ===

export const getPeerChatMessages = async (matchId: string, limit = 50): Promise<PeerChatMessage[]> => {
  const { data, error } = await supabase
    .from('peer_chat_messages')
    .select('*')
    .eq('match_id', matchId)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) throw error;
  if (!data || data.length === 0) return [];

  const senderIds = data.map(m => m.sender_id);
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email, full_name, avatar_url')
    .in('id', senderIds);

  const profileMap: Record<string, { email: string; full_name?: string; avatar_url?: string }> = {};
  profiles?.forEach(p => { profileMap[p.id] = p; });

  return data.map(m => ({ ...m, profiles: profileMap[m.sender_id] }));
};

export const sendPeerChatMessage = async (message: {
  match_id: string;
  sender_id: string;
  content: string;
}): Promise<PeerChatMessage> => {
  const { data, error } = await supabase
    .from('peer_chat_messages')
    .insert(message)
    .select('*')
    .limit(1)
    .maybeSingle();

  if (error) throw error;

  const { data: profile } = await supabase
    .from('profiles')
    .select('email, full_name, avatar_url')
    .eq('id', message.sender_id)
    .maybeSingle();

  return { ...(data as PeerChatMessage), profiles: profile };
};

// === REAL-TIME PRESENCE ===

export const setPeerOnline = async (userId: string, isOnline: boolean): Promise<void> => {
  const { error } = await supabase
    .from('peer_profiles')
    .update({
      is_online: isOnline,
      last_seen: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (error) throw error;
};
