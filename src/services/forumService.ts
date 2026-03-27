import { supabase } from '../config/supabase';

// Forum types
export interface ForumCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  order_index?: number;
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

/** PostgREST chỉ embed được khi có FK trong DB; nhiều project thiếu FK user_id → profiles → PGRST200. */
type ProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
};

function toProfileFields(row: ProfileRow | undefined): ForumPost['profiles'] {
  if (!row) return undefined;
  return {
    email: row.email || '',
    full_name: row.full_name || undefined,
    avatar_url: row.avatar_url || undefined,
  };
}

async function fetchProfilesMap(userIds: string[]): Promise<Map<string, ProfileRow>> {
  const unique = [...new Set(userIds.filter(Boolean))];
  if (unique.length === 0) return new Map();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, avatar_url')
    .in('id', unique);
  if (error || !data) return new Map();
  const m = new Map<string, ProfileRow>();
  for (const row of data as ProfileRow[]) {
    m.set(row.id, row);
  }
  return m;
}

async function attachProfilesToPosts(posts: ForumPost[]): Promise<ForumPost[]> {
  if (posts.length === 0) return posts;
  const map = await fetchProfilesMap(posts.map(p => p.user_id));
  return posts.map(p => ({
    ...p,
    profiles: toProfileFields(map.get(p.user_id)),
  }));
}

async function attachProfilesToReplies(replies: ForumReply[]): Promise<ForumReply[]> {
  if (replies.length === 0) return replies;
  const map = await fetchProfilesMap(replies.map(r => r.user_id));
  return replies.map(r => ({
    ...r,
    profiles: toProfileFields(map.get(r.user_id)),
  }));
}

// === CATEGORIES ===

/** Trùng tên (do seed nhiều lần): giữ bản có order_index nhỏ nhất. */
function dedupeForumCategories(rows: ForumCategory[]): ForumCategory[] {
  const byName = new Map<string, ForumCategory>();
  for (const row of rows) {
    const existing = byName.get(row.name);
    if (!existing) {
      byName.set(row.name, row);
      continue;
    }
    const oi = row.order_index ?? 999;
    const exOi = existing.order_index ?? 999;
    if (oi < exOi) byName.set(row.name, row);
  }
  return Array.from(byName.values()).sort(
    (a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)
  );
}

export const getForumCategories = async (): Promise<ForumCategory[]> => {
  let { data, error } = await supabase
    .from('forum_categories')
    .select('*')
    .order('order_index', { ascending: true });

  if (error) {
    const code = (error as { code?: string }).code;
    const msg = (error.message || '').toLowerCase();
    if (
      code === '42703' ||
      code === 'PGRST204' ||
      msg.includes('order_index') ||
      msg.includes('column')
    ) {
      const retry = await supabase
        .from('forum_categories')
        .select('*')
        .order('created_at', { ascending: true });
      data = retry.data;
      error = retry.error;
    }
  }

  if (error) {
    throw new Error(
      error.message ||
        'Không tải được danh mục diễn đàn. Kiểm tra RLS (policy SELECT) hoặc kết nối Supabase.'
    );
  }

  return dedupeForumCategories((data || []) as ForumCategory[]);
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
  return attachProfilesToPosts((data || []) as ForumPost[]);
};

export const getRecentForumPosts = async (limit = 5): Promise<ForumPost[]> => {
  const { data, error } = await supabase
    .from('forum_posts')
    .select(`
      *,
      forum_categories(id, name, icon, color)
    `)
    .order('last_reply_at', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return attachProfilesToPosts((data || []) as ForumPost[]);
};

export const getForumPostById = async (id: string): Promise<ForumPost | null> => {
  const { data, error } = await supabase
    .from('forum_posts')
    .select(`
      *,
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
    const [withProfile] = await attachProfilesToPosts([data as ForumPost]);
    return withProfile;
  }

  return null;
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
      forum_categories(*)
    `)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error('Không tạo được bài viết.');
  const [withProfile] = await attachProfilesToPosts([data as ForumPost]);
  return withProfile;
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
      forum_categories(id, name, icon, color)
    `)
    .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
    .order('last_reply_at', { ascending: false })
    .limit(20);

  if (error) throw error;
  return attachProfilesToPosts((data || []) as ForumPost[]);
};

// === REPLIES ===

export const getForumReplies = async (postId: string): Promise<ForumReply[]> => {
  const { data, error } = await supabase
    .from('forum_replies')
    .select('*')
    .eq('post_id', postId)
    .order('is_accepted', { ascending: false })
    .order('created_at', { ascending: true });

  if (error) throw error;
  return attachProfilesToReplies((data || []) as ForumReply[]);
};

export const createForumReply = async (reply: {
  post_id: string;
  user_id: string;
  content: string;
}): Promise<ForumReply> => {
  const { data: replyData, error: replyError } = await supabase
    .from('forum_replies')
    .insert(reply)
    .select('*')
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

  if (!replyData) throw new Error('Không tạo được phản hồi.');
  const [withProfile] = await attachProfilesToReplies([replyData as ForumReply]);
  return withProfile;
};

export const updateForumReply = async (id: string, content: string): Promise<ForumReply> => {
  const { data, error } = await supabase
    .from('forum_replies')
    .update({ content })
    .eq('id', id)
    .select('*')
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error('Không cập nhật được phản hồi.');
  const [withProfile] = await attachProfilesToReplies([data as ForumReply]);
  return withProfile;
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
  if (!data) throw new Error('Không tìm thấy phản hồi.');
  const [withProfile] = await attachProfilesToReplies([data as ForumReply]);
  return withProfile;
};
