import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  getForumCategories,
  getForumPosts,
  getRecentForumPosts,
  searchForumPosts,
  createForumPost,
  ForumCategory,
  ForumPost,
} from '../services/forumService';
import '../styles/forum.css';

export default function Forum() {
  const { categoryId } = useParams<{ categoryId?: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [recentPosts, setRecentPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ForumPost[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [forumLoadError, setForumLoadError] = useState<string | null>(null);
  const [categoriesEmptyHint, setCategoriesEmptyHint] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (categoryId) {
      setSelectedCategory(categoryId);
    }
  }, [categoryId]);

  const loadData = async () => {
    setLoading(true);
    setForumLoadError(null);
    setCategoriesEmptyHint(false);
    try {
      const [cats, recents] = await Promise.all([
        getForumCategories(),
        getRecentForumPosts(5),
      ]);
      setCategories(cats);
      setRecentPosts(recents);
      setPosts([]);

      if (cats.length === 0) {
        setCategoriesEmptyHint(true);
      }

      if (cats.length > 0 && !selectedCategory) {
        const allPosts = await getForumPosts();
        setPosts(allPosts);
      }
    } catch (err) {
      console.error('Failed to load forum data:', err);
      const msg =
        err instanceof Error ? err.message : 'Không tải được dữ liệu diễn đàn.';
      setForumLoadError(msg);
    } finally {
      setLoading(false);
    }
  };

  /** Mở modal: tải lại danh mục (tránh RLS/cache lúc mới seed). */
  useEffect(() => {
    if (!showCreateModal) return;
    let cancelled = false;
    (async () => {
      try {
        const cats = await getForumCategories();
        if (!cancelled) {
          setCategories(cats);
          setForumLoadError(null);
          setCategoriesEmptyHint(cats.length === 0);
        }
      } catch (e) {
        if (!cancelled) {
          setForumLoadError(
            e instanceof Error ? e.message : 'Không tải được chủ đề.'
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [showCreateModal]);

  const handleCategoryClick = async (category: ForumCategory) => {
    setSelectedCategory(category.id);
    setSearchQuery('');
    setIsSearching(false);
    try {
      const catPosts = await getForumPosts(category.id);
      setPosts(catPosts);
    } catch (err) {
      console.error('Failed to load posts:', err);
    }
  };

  const handleBackToCategories = () => {
    setSelectedCategory('');
    setSearchQuery('');
    setIsSearching(false);
    setPosts([]);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSelectedCategory('');
    try {
      const results = await searchForumPosts(searchQuery.trim());
      setSearchResults(results);
    } catch (err) {
      console.error('Search failed:', err);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!selectedCategory) {
      setFormError('Vui lòng chọn chủ đề.');
      return;
    }
    if (!newPostTitle.trim()) {
      setFormError('Vui lòng nhập tiêu đề.');
      return;
    }
    if (!newPostContent.trim()) {
      setFormError('Vui lòng nhập nội dung.');
      return;
    }
    setSubmitting(true);
    setFormError('');
    try {
      const newPost = await createForumPost({
        category_id: selectedCategory,
        user_id: user.id,
        title: newPostTitle.trim(),
        content: newPostContent.trim(),
      });
      setShowCreateModal(false);
      setNewPostTitle('');
      setNewPostContent('');
      navigate(`/forum/post/${newPost.id}`);
    } catch (err: any) {
      setFormError(err.message || 'Không thể tạo bài viết.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCat = categories.find(c => c.id === selectedCategory);
  const displayPosts = isSearching ? searchResults : posts;

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
    return d.toLocaleDateString('vi-VN');
  };

  if (loading) {
    return (
      <div className="forum-page">
        <div className="forum-empty-state">
          <div style={{ width: 48, height: 48, border: '4px solid var(--border-color)', borderTopColor: 'var(--primary-color)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
          <p>Đang tải diễn đàn...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="forum-page">
      {forumLoadError && (
        <div className="forum-banner forum-banner--error" role="alert">
          <strong>Không tải được diễn đàn:</strong> {forumLoadError}
        </div>
      )}
      {categoriesEmptyHint && !forumLoadError && (
        <div className="forum-banner forum-banner--warn">
          Chưa có chủ đề từ API. Nếu SQL Editor đã có dữ liệu, hãy chạy policy RLS trong{' '}
          <code className="forum-banner-code">supabase/forum_categories_rls.sql</code>{' '}
          rồi tải lại trang.
        </div>
      )}

      {/* Header */}
      <div className="forum-page-header">
        <div>
          {!selectedCategory && !isSearching ? (
            <h1 className="forum-page-title">
              <span>💬</span> Diễn đàn học tập
            </h1>
          ) : (
            <h1 className="forum-page-title">
              <span>💬</span> {selectedCat?.name || (isSearching ? 'Kết quả tìm kiếm' : 'Diễn đàn')}
            </h1>
          )}
        </div>
        <div className="forum-search-bar">
          <input
            type="text"
            placeholder="Tìm kiếm bài viết..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
          <button onClick={handleSearch}>Tìm</button>
          {user && (
            <button
              onClick={() => setShowCreateModal(true)}
              style={{ background: '#10b981', whiteSpace: 'nowrap' }}
            >
              + Bài mới
            </button>
          )}
        </div>
      </div>

      {/* Breadcrumb */}
      {(selectedCategory || isSearching) && (
        <div className="forum-breadcrumb">
          <button
            onClick={handleBackToCategories}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary-color)', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem', padding: 0 }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Tất cả chủ đề
          </button>
          {selectedCat && !isSearching && (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                <path d="M9 18l6-6-6-6" />
              </svg>
              <span>{selectedCat.name}</span>
            </>
          )}
          {isSearching && (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                <path d="M9 18l6-6-6-6" />
              </svg>
              <span>Tìm: "{searchQuery}"</span>
            </>
          )}
        </div>
      )}

      {/* Categories Grid */}
      {!selectedCategory && !isSearching && (
        <>
          <div className="forum-categories-grid">
            {categories.map(cat => (
              <div
                key={cat.id}
                className="forum-category-card"
                onClick={() => handleCategoryClick(cat)}
              >
                <div className="forum-category-header">
                  <div
                    className="forum-category-icon"
                    style={{ background: cat.color + '22', color: cat.color }}
                  >
                    {cat.icon}
                  </div>
                  <h3 className="forum-category-name">{cat.name}</h3>
                </div>
                <p className="forum-category-desc">{cat.description}</p>
                <div className="forum-category-stats">
                  <span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    {cat.post_count || 0} bài
                  </span>
                  <span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                      <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Thảo luận
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Recent Posts */}
          {recentPosts.length > 0 && (
            <>
              <div className="forum-post-list-header" style={{ marginTop: '2rem' }}>
                <h2 className="forum-post-list-title">🆕 Bài viết mới nhất</h2>
              </div>
              <div className="forum-post-list">
                {recentPosts.map(post => (
                  <Link
                    key={post.id}
                    to={`/forum/post/${post.id}`}
                    className={`forum-post-item${post.is_pinned ? ' pinned' : ''}`}
                  >
                    <div className="forum-post-item-header">
                      {post.is_pinned && (
                        <span className="forum-post-pinned-badge">📌 Ghim</span>
                      )}
                      {post.forum_categories && (
                        <span
                          className="forum-post-pinned-badge"
                          style={{ background: post.forum_categories.color + '22', color: post.forum_categories.color }}
                        >
                          {post.forum_categories.icon} {post.forum_categories.name}
                        </span>
                      )}
                    </div>
                    <h3 className="forum-post-title">{post.title}</h3>
                    <div className="forum-post-meta">
                      <span className="forum-post-author">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                          <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {post.profiles?.full_name || post.profiles?.email?.split('@')[0] || 'Ẩn danh'}
                      </span>
                      <span>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                          <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        {post.reply_count || 0}
                      </span>
                      <span>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                          <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        {post.views || 0}
                      </span>
                      <span>{formatTime(post.last_reply_at || post.created_at)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* Post List (Category or Search) */}
      {(selectedCategory || isSearching) && (
        <>
          {!isSearching && selectedCat && (
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              {selectedCat.description}
            </p>
          )}

          {displayPosts.length === 0 ? (
            <div className="forum-empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <h3>Chưa có bài viết nào</h3>
              <p>{isSearching ? 'Thử từ khóa khác.' : 'Hãy là người đầu tiên đăng bài!'}</p>
              {user && !isSearching && (
                <button
                  className="forum-new-post-btn"
                  style={{ marginTop: '1rem' }}
                  onClick={() => setShowCreateModal(true)}
                >
                  + Đăng bài mới
                </button>
              )}
            </div>
          ) : (
            <div className="forum-post-list">
              {displayPosts.map(post => (
                <Link
                  key={post.id}
                  to={`/forum/post/${post.id}`}
                  className={`forum-post-item${post.is_pinned ? ' pinned' : ''}`}
                >
                  <div className="forum-post-item-header">
                    {post.is_pinned && (
                      <span className="forum-post-pinned-badge">📌 Ghim</span>
                    )}
                    {post.is_locked && (
                      <span className="forum-post-pinned-badge" style={{ background: '#fee2e2', color: '#dc2626' }}>
                        🔒 Khóa
                      </span>
                    )}
                  </div>
                  <h3 className="forum-post-title">{post.title}</h3>
                  <div className="forum-post-meta">
                    <span className="forum-post-author">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                        <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {post.profiles?.full_name || post.profiles?.email?.split('@')[0] || 'Ẩn danh'}
                    </span>
                    <span>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                        <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      {post.reply_count || 0}
                    </span>
                    <span>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                        <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      {post.views || 0}
                    </span>
                    <span>{formatTime(post.last_reply_at || post.created_at)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}

      {/* Create Post Modal */}
      {showCreateModal && (
        <div className="forum-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div
            className="forum-modal forum-modal--create"
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-labelledby="forum-create-post-title"
          >
            <div className="forum-modal-header">
              <h2 id="forum-create-post-title" className="forum-modal-title">
                Tạo bài viết mới
              </h2>
              <button
                type="button"
                className="forum-modal-close"
                onClick={() => setShowCreateModal(false)}
                aria-label="Đóng"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleCreatePost}>
              <div className="forum-form-group">
                <label className="forum-form-label" id="forum-category-label">
                  Chủ đề *
                </label>
                <div
                  className="forum-category-picker"
                  role="listbox"
                  aria-labelledby="forum-category-label"
                >
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      role="option"
                      aria-selected={selectedCategory === cat.id}
                      className={`forum-category-chip${selectedCategory === cat.id ? ' selected' : ''}`}
                      style={
                        {
                          '--chip-accent': cat.color,
                        } as React.CSSProperties
                      }
                      onClick={() => setSelectedCategory(cat.id)}
                    >
                      <span className="forum-category-chip-icon" aria-hidden>
                        {cat.icon}
                      </span>
                      <span className="forum-category-chip-text">
                        <span className="forum-category-chip-name">{cat.name}</span>
                        {cat.description ? (
                          <span className="forum-category-chip-desc">{cat.description}</span>
                        ) : null}
                      </span>
                    </button>
                  ))}
                </div>
                {categories.length === 0 && (
                  <p className="forum-form-hint">
                    Đang không có chủ đề. Kiểm tra RLS và chạy{' '}
                    <code>supabase/forum_categories_rls.sql</code> trên Supabase nếu cần.
                  </p>
                )}
              </div>
              <div className="forum-form-group">
                <label className="forum-form-label">Tiêu đề *</label>
                <input
                  type="text"
                  className="forum-form-input"
                  placeholder="Nhập tiêu đề bài viết..."
                  value={newPostTitle}
                  onChange={e => setNewPostTitle(e.target.value)}
                  maxLength={200}
                  required
                />
              </div>
              <div className="forum-form-group">
                <label className="forum-form-label">Nội dung *</label>
                <textarea
                  className="forum-form-textarea"
                  placeholder="Viết nội dung bài viết của bạn ở đây..."
                  value={newPostContent}
                  onChange={e => setNewPostContent(e.target.value)}
                  required
                />
              </div>
              {formError && <p className="forum-form-error">{formError}</p>}
              <div className="forum-modal-actions">
                <button
                  type="button"
                  className="forum-cancel-btn"
                  onClick={() => setShowCreateModal(false)}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="forum-submit-btn"
                  disabled={submitting}
                >
                  {submitting ? 'Đang đăng...' : 'Đăng bài'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
