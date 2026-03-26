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
    .select(`
      *,
      profiles(email, full_name, avatar_url)
    `)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const getOrCreatePeerProfile = async (userId: string): Promise<PeerProfile> => {
  let { data, error } = await supabase
    .from('peer_profiles')
    .select(`
      *,
      profiles(email, full_name, avatar_url)
    `)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    const { data: newProfile, error: createError } = await supabase
      .from('peer_profiles')
      .insert({ user_id: userId, display_name: '', language: 'japanese', study_level: 'N5', study_goal: 'jlpt', available_days: [], available_hours: '', timezone: 'Asia/Ho_Chi_Minh' })
      .select(`
        *,
        profiles(email, full_name, avatar_url)
      `)
      .limit(1)
      .maybeSingle();

    if (createError) throw createError;
    data = newProfile;
  }

  return data;
};

export const updatePeerProfile = async (userId: string, updates: Partial<Omit<PeerProfile, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'profiles'>>): Promise<PeerProfile> => {
  const { data, error } = await supabase
    .from('peer_profiles')
    .update(updates)
    .eq('user_id', userId)
    .select(`
      *,
      profiles(email, full_name, avatar_url)
    `)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const browsePeers = async (filters?: {
  language?: string;
  level?: StudyLevel;
  goal?: StudyGoal;
}): Promise<PeerProfile[]> => {
  let query = supabase
    .from('peer_profiles')
    .select(`
      *,
      profiles(email, full_name, avatar_url)
    `)
    .neq('user_id', '') // Exclude empty entries
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
  return data || [];
};

// === MATCH REQUESTS ===

export const getSentMatchRequests = async (userId: string): Promise<PeerMatchRequest[]> => {
  const { data, error } = await supabase
    .from('peer_match_requests')
    .select(`
      *,
      from_profile:profiles!peer_match_requests_from_user_id_fkey(email, full_name, avatar_url),
      to_profile:profiles!peer_match_requests_to_user_id_fkey(email, full_name, avatar_url)
    `)
    .eq('from_user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const getReceivedMatchRequests = async (userId: string): Promise<PeerMatchRequest[]> => {
  const { data, error } = await supabase
    .from('peer_match_requests')
    .select(`
      *,
      from_profile:profiles!peer_match_requests_from_user_id_fkey(email, full_name, avatar_url),
      to_profile:profiles!peer_match_requests_to_user_id_fkey(email, full_name, avatar_url)
    `)
    .eq('to_user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
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
    .select(`
      *,
      from_profile:profiles!peer_match_requests_from_user_id_fkey(email, full_name, avatar_url),
      to_profile:profiles!peer_match_requests_to_user_id_fkey(email, full_name, avatar_url)
    `)
    .eq('status', 'accepted')
    .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

// === PEER CHAT ===

export const getPeerChatMessages = async (matchId: string, limit = 50): Promise<PeerChatMessage[]> => {
  const { data, error } = await supabase
    .from('peer_chat_messages')
    .select(`
      *,
      profiles(email, full_name, avatar_url)
    `)
    .eq('match_id', matchId)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) throw error;
  return data || [];
};

export const sendPeerChatMessage = async (message: {
  match_id: string;
  sender_id: string;
  content: string;
}): Promise<PeerChatMessage> => {
  const { data, error } = await supabase
    .from('peer_chat_messages')
    .insert(message)
    .select(`
      *,
      profiles(email, full_name, avatar_url)
    `)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
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
