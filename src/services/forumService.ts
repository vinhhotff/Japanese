import { supabase } from '../config/supabase';

// Forum types
export interface ForumCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  post_count?: number;
  created_at: string;
}

export interface ForumPost {
  id: string;
  category_id: string;
  user_id: string;
  title: string;
  content: string;
  views: number;
  reply_count?: number;
  last_reply_at?: string;
  is_pinned?: boolean;
  is_locked?: boolean;
  created_at: string;
  updated_at: string;
  // Joined fields
  profiles?: {
    email: string;
    full_name?: string;
    avatar_url?: string;
  };
  forum_categories?: ForumCategory;
}

export interface ForumReply {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  is_accepted?: boolean;
  created_at: string;
  updated_at: string;
  profiles?: {
    email: string;
    full_name?: string;
    avatar_url?: string;
  };
}

// === CATEGORIES ===

export const getForumCategories = async (): Promise<ForumCategory[]> => {
  const { data, error } = await supabase
    .from('forum_categories')
    .select('*')
    .order('order_index', { ascending: true });

  if (error) throw error;
  return data || [];
};

export const getCategoryById = async (id: string): Promise<ForumCategory | null> => {
  const { data, error } = await supabase
    .from('forum_categories')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
};

// === POSTS ===

export const getForumPosts = async (categoryId?: string): Promise<ForumPost[]> => {
  let query = supabase
    .from('forum_posts')
    .select(`
      *,
      profiles(email, full_name, avatar_url),
      forum_categories(*)
    `)
    .order('is_pinned', { ascending: false })
    .order('last_reply_at', { ascending: false })
    .order('created_at', { ascending: false });

  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

export const getRecentForumPosts = async (limit = 5): Promise<ForumPost[]> => {
  const { data, error } = await supabase
    .from('forum_posts')
    .select(`
      *,
      profiles(email, full_name, avatar_url),
      forum_categories(id, name, icon, color)
    `)
    .order('last_reply_at', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
};

export const getForumPostById = async (id: string): Promise<ForumPost | null> => {
  const { data, error } = await supabase
    .from('forum_posts')
    .select(`
      *,
      profiles(email, full_name, avatar_url),
      forum_categories(*)
    `)
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;

  // Increment view count
  if (data) {
    await supabase
      .from('forum_posts')
      .update({ views: (data.views || 0) + 1 })
      .eq('id', id);
  }

  return data;
};

export const createForumPost = async (post: {
  category_id: string;
  user_id: string;
  title: string;
  content: string;
}): Promise<ForumPost> => {
  const { data, error } = await supabase
    .from('forum_posts')
    .insert(post)
    .select(`
      *,
      profiles(email, full_name, avatar_url),
      forum_categories(*)
    `)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const updateForumPost = async (id: string, updates: Partial<{
  title: string;
  content: string;
  is_pinned: boolean;
  is_locked: boolean;
}>): Promise<ForumPost> => {
  const { data, error } = await supabase
    .from('forum_posts')
    .update(updates)
    .eq('id', id)
    .select()
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const deleteForumPost = async (id: string): Promise<void> => {
  const { error } = await supabase.from('forum_posts').delete().eq('id', id);
  if (error) throw error;
};

export const searchForumPosts = async (query: string): Promise<ForumPost[]> => {
  const { data, error } = await supabase
    .from('forum_posts')
    .select(`
      *,
      profiles(email, full_name, avatar_url),
      forum_categories(id, name, icon, color)
    `)
    .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
    .order('last_reply_at', { ascending: false })
    .limit(20);

  if (error) throw error;
  return data || [];
};

// === REPLIES ===

export const getForumReplies = async (postId: string): Promise<ForumReply[]> => {
  const { data, error } = await supabase
    .from('forum_replies')
    .select(`
      *,
      profiles(email, full_name, avatar_url)
    `)
    .eq('post_id', postId)
    .order('is_accepted', { ascending: false })
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
};

export const createForumReply = async (reply: {
  post_id: string;
  user_id: string;
  content: string;
}): Promise<ForumReply> => {
  const { data: replyData, error: replyError } = await supabase
    .from('forum_replies')
    .insert(reply)
    .select(`
      *,
      profiles(email, full_name, avatar_url)
    `)
    .limit(1)
    .maybeSingle();

  if (replyError) throw replyError;

  // Update reply count and last_reply_at on the post
  const { data: post } = await supabase
    .from('forum_posts')
    .select('reply_count, last_reply_at')
    .eq('id', reply.post_id)
    .maybeSingle();

  await supabase
    .from('forum_posts')
    .update({
      reply_count: (post?.reply_count || 0) + 1,
      last_reply_at: new Date().toISOString(),
    })
    .eq('id', reply.post_id);

  return replyData;
};

export const updateForumReply = async (id: string, content: string): Promise<ForumReply> => {
  const { data, error } = await supabase
    .from('forum_replies')
    .update({ content })
    .eq('id', id)
    .select(`
      *,
      profiles(email, full_name, avatar_url)
    `)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const deleteForumReply = async (id: string, postId: string): Promise<void> => {
  const { error } = await supabase.from('forum_replies').delete().eq('id', id);
  if (error) throw error;

  // Update reply count
  const { data: post } = await supabase
    .from('forum_posts')
    .select('reply_count')
    .eq('id', postId)
    .maybeSingle();

  if (post) {
    await supabase
      .from('forum_posts')
      .update({ reply_count: Math.max(0, (post.reply_count || 0) - 1) })
      .eq('id', postId);
  }
};

export const toggleAcceptReply = async (replyId: string, isAccepted: boolean): Promise<ForumReply> => {
  const { data, error } = await supabase
    .from('forum_replies')
    .update({ is_accepted: isAccepted })
    .eq('id', replyId)
    .select()
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
};
