import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  getForumPostById,
  getForumReplies,
  createForumReply,
  deleteForumReply,
  deleteForumPost,
  ForumPost,
  ForumReply,
} from '../services/forumService';
import '../styles/forum.css';

export default function ForumPostDetail() {
  const { postId } = useParams<{ postId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [post, setPost] = useState<ForumPost | null>(null);
  const [replies, setReplies] = useState<ForumReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyError, setReplyError] = useState('');

  useEffect(() => {
    if (postId) loadPost(postId);
  }, [postId]);

  const loadPost = async (id: string) => {
    setLoading(true);
    try {
      const [postData, replyData] = await Promise.all([
        getForumPostById(id),
        getForumReplies(id),
      ]);
      setPost(postData);
      setReplies(replyData);
    } catch (err) {
      console.error('Failed to load post:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !postId || !replyContent.trim()) return;
    setSubmitting(true);
    setReplyError('');
    try {
      const newReply = await createForumReply({
        post_id: postId,
        user_id: user.id,
        content: replyContent.trim(),
      });
      setReplies(prev => [...prev, newReply]);
      setReplyContent('');
    } catch (err: any) {
      setReplyError(err.message || 'Không thể gửi trả lời.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReply = async (replyId: string) => {
    if (!postId || !confirm('Xóa trả lời này?')) return;
    try {
      await deleteForumReply(replyId, postId);
      setReplies(prev => prev.filter(r => r.id !== replyId));
    } catch (err) {
      console.error('Failed to delete reply:', err);
    }
  };

  const handleDeletePost = async () => {
    if (!postId || !confirm('Xóa bài viết này? Tất cả trả lời cũng sẽ bị xóa.')) return;
    try {
      await deleteForumPost(postId);
      navigate('/forum');
    } catch (err) {
      console.error('Failed to delete post:', err);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Vừa xong';
    if (mins < 60) return `${mins} phút trước`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} ngày trước`;
    return formatDate(dateStr);
  };

  if (loading) {
    return (
      <div className="forum-post-detail">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <div style={{ width: 48, height: 48, border: '4px solid var(--border-color)', borderTopColor: 'var(--primary-color)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="forum-post-detail">
        <div className="forum-empty-state">
          <h3>Không tìm thấy bài viết</h3>
          <p>Bài viết có thể đã bị xóa hoặc không tồn tại.</p>
          <Link to="/forum" className="forum-new-post-btn" style={{ display: 'inline-flex', marginTop: '1rem' }}>
            Quay lại diễn đàn
          </Link>
        </div>
      </div>
    );
  }

  const authorName = post.profiles?.full_name || post.profiles?.email?.split('@')[0] || 'Ẩn danh';
  const isAuthor = user?.id === post.user_id;

  return (
    <div className="forum-post-detail">
      {/* Breadcrumb */}
      <div className="forum-breadcrumb" style={{ marginBottom: '1.5rem' }}>
        <Link to="/forum">Diễn đàn</Link>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
          <path d="M9 18l6-6-6-6" />
        </svg>
        {post.forum_categories && (
          <>
            <Link to={`/forum/category/${post.forum_categories.id}`}>{post.forum_categories.name}</Link>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </>
        )}
        <span style={{ color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '300px' }}>{post.title}</span>
      </div>

      {/* Post Header */}
      <div className="forum-post-detail-header">
        <h1 className="forum-post-detail-title">{post.title}</h1>
        <div className="forum-post-detail-meta">
          {post.forum_categories && (
            <Link
              to={`/forum/category/${post.forum_categories.id}`}
              className="forum-post-detail-category"
              style={{ background: post.forum_categories.color + '22', color: post.forum_categories.color, textDecoration: 'none' }}
            >
              {post.forum_categories.icon} {post.forum_categories.name}
            </Link>
          )}
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
              <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            {authorName}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
              <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {formatDate(post.created_at)}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
              <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            {post.views || 0} lượt xem
          </span>
        </div>
      </div>

      {/* Post Body */}
      <div className="forum-post-body">
        {post.content}
      </div>

      {/* Post Actions */}
      <div className="forum-post-actions">
        {isAuthor && (
          <>
            <button className="forum-action-btn danger" onClick={handleDeletePost}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Xóa bài
            </button>
          </>
        )}
      </div>

      {/* Locked Notice */}
      {post.is_locked && (
        <div className="forum-locked-notice">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
            <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Bài viết này đã bị khóa. Không thể trả lời.
        </div>
      )}

      {/* Replies Section */}
      {!post.is_locked && (
        <div className="forum-replies-section">
          <div className="forum-replies-count">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
              <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {replies.length} trả lời
          </div>

          <div className="forum-reply-list">
            {replies.map(reply => {
              const replyAuthor = reply.profiles?.full_name || reply.profiles?.email?.split('@')[0] || 'Ẩn danh';
              const isReplyAuthor = user?.id === reply.user_id;
              return (
                <div key={reply.id} className={`forum-reply-item${reply.is_accepted ? ' accepted' : ''}`}>
                  <div className="forum-reply-accepted-badge">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="12" height="12">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                    Được chấp nhận
                  </div>
                  <div className="forum-reply-header">
                    <div className="forum-reply-author">
                      <div className="forum-reply-avatar">
                        {replyAuthor.charAt(0).toUpperCase()}
                      </div>
                      <div className="forum-reply-author-info">
                        <span className="forum-reply-author-name">{replyAuthor}</span>
                        <span className="forum-reply-time">{formatTime(reply.created_at)}</span>
                      </div>
                    </div>
                    {isReplyAuthor && (
                      <button
                        className="forum-action-btn danger"
                        onClick={() => handleDeleteReply(reply.id)}
                        style={{ fontSize: '0.75rem' }}
                      >
                        Xóa
                      </button>
                    )}
                  </div>
                  <div className="forum-reply-content">{reply.content}</div>
                </div>
              );
            })}
          </div>

          {/* Reply Form */}
          {user ? (
            <div className="forum-reply-form">
              <h3 className="forum-reply-form-title">Trả lời bài viết</h3>
              <form onSubmit={handleSubmitReply}>
                <textarea
                  placeholder="Viết câu trả lời của bạn..."
                  value={replyContent}
                  onChange={e => setReplyContent(e.target.value)}
                  required
                />
                {replyError && <p className="forum-form-error">{replyError}</p>}
                <div className="forum-reply-form-actions">
                  <button
                    type="submit"
                    className="forum-submit-btn"
                    disabled={submitting || !replyContent.trim()}
                  >
                    {submitting ? 'Đang gửi...' : 'Gửi trả lời'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="forum-reply-form" style={{ textAlign: 'center', padding: '2rem' }}>
              <p style={{ color: 'var(--text-secondary)', margin: '0 0 1rem 0' }}>
                Bạn cần đăng nhập để trả lời bài viết.
              </p>
              <Link to="/login" className="forum-submit-btn" style={{ display: 'inline-flex', textDecoration: 'none' }}>
                Đăng nhập
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
