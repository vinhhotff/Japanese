import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../config/supabase';
import {
  browsePeers,
  getOrCreatePeerProfile,
  updatePeerProfile,
  getSentMatchRequests,
  getReceivedMatchRequests,
  getActiveMatches,
  sendMatchRequest,
  respondToMatchRequest,
  cancelMatchRequest,
  getPeerChatMessages,
  sendPeerChatMessage,
  setPeerOnline,
  getMatchByUserIds,
  PeerProfile,
  PeerMatchRequest,
  PeerChatMessage,
  StudyLevel,
  StudyGoal,
} from '../services/peerMatchingService';
import '../styles/peer-matching.css';

const STUDY_LEVELS: StudyLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1', 'HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6'];
const STUDY_GOALS: { value: StudyGoal; label: string }[] = [
  { value: 'conversation', label: 'Giao tiếp' },
  { value: 'jlpt', label: 'Luyện thi JLPT' },
  { value: 'hsk', label: 'Luyện thi HSK' },
  { value: 'business', label: 'Tiếng Nhật/Tiếng Trung thương mại' },
  { value: 'travel', label: 'Du lịch' },
  { value: 'reading', label: 'Đọc hiểu' },
  { value: 'writing', label: 'Viết' },
];
const DAYS = [
  { value: 'mon', label: 'T2' },
  { value: 'tue', label: 'T3' },
  { value: 'wed', label: 'T4' },
  { value: 'thu', label: 'T5' },
  { value: 'fri', label: 'T6' },
  { value: 'sat', label: 'T7' },
  { value: 'sun', label: 'CN' },
];

type Tab = 'browse' | 'requests' | 'matches' | 'setup';

export default function PeerMatching() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('browse');
  const [peers, setPeers] = useState<PeerProfile[]>([]);
  const [myProfile, setMyProfile] = useState<Partial<PeerProfile>>({});
  const [sentRequests, setSentRequests] = useState<PeerMatchRequest[]>([]);
  const [receivedRequests, setReceivedMatchRequests] = useState<PeerMatchRequest[]>([]);
  const [activeMatches, setActiveMatches] = useState<PeerMatchRequest[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [filterLang, setFilterLang] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [filterGoal, setFilterGoal] = useState('');

  // Chat
  const [chatPeer, setChatPeer] = useState<PeerProfile | null>(null);
  const [chatMessages, setChatMessages] = useState<PeerChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const isChatInitialized = useRef(false); // Track if chat is initialized to prevent duplicates
  const addedMessageIds = useRef<Set<string>>(new Set()); // Track added message IDs

  // Setup form
  const [setupLoading, setSetupLoading] = useState(false);
  const [setupError, setSetupError] = useState('');

  useEffect(() => {
    if (!user) return;
    loadData();
    // Set online presence
    setPeerOnline(user.id, true);
    return () => {
      if (user) setPeerOnline(user.id, false).catch(() => {});
    };
  }, [user]);

  // Track current match ID for subscription
  const currentMatchIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Only load chat when chatPeer changes to a non-null value (not on mount)
    if (!chatPeer) return;

    // Reset tracking variables when switching peers
    isChatInitialized.current = false;
    addedMessageIds.current = new Set();
    setChatMessages([]);
    currentMatchIdRef.current = null;

    // First find the match, then load messages
    const loadChatForPeer = async () => {
      if (!user) return;
      try {
        // Find the match between current user and chat peer
        const match = await getMatchByUserIds(user.id, chatPeer.user_id);
        if (match) {
          currentMatchIdRef.current = match.id;
          isChatInitialized.current = true;
          loadChat(match.id);
        }
      } catch (err) {
        console.error('Failed to find match for chat:', err);
      }
    };

    loadChatForPeer();

    // Cleanup function
    return () => {
      currentMatchIdRef.current = null;
      isChatInitialized.current = false;
    };
  }, [chatPeer]);

  // Real-time subscription for new messages
  useEffect(() => {
    if (!chatPeer || !user) return;

    const matchId = currentMatchIdRef.current;
    if (!matchId) return;

    const channel = supabase
      .channel(`chat:${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'peer_chat_messages',
          filter: `match_id=eq.${matchId}`,
        },
        async (payload) => {
          const newMsg = payload.new as PeerChatMessage;

          // Skip if this is our own message (already added via handleSendMessage)
          if (newMsg.sender_id === user.id) {
            return;
          }

          // Skip if already exists in messages
          if (addedMessageIds.current.has(newMsg.id)) {
            return;
          }

          // Skip if already in state
          setChatMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) {
              return prev;
            }
            return [...prev, newMsg];
          });

          // Track added message
          addedMessageIds.current.add(newMsg.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatPeer, user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const profile = await getOrCreatePeerProfile(user.id);
      setMyProfile(profile);

      const [sent, received, matches] = await Promise.all([
        getSentMatchRequests(user.id),
        getReceivedMatchRequests(user.id),
        getActiveMatches(user.id),
      ]);
      setSentRequests(sent);
      setReceivedMatchRequests(received);
      setActiveMatches(matches);

      // If no profile setup yet, go to setup tab
      if (!profile.display_name) {
        setActiveTab('setup');
      }
    } catch (err) {
      console.error('Failed to load peer data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBrowse = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const filters: any = {};
      if (filterLang) filters.language = filterLang;
      if (filterLevel) filters.level = filterLevel as StudyLevel;
      if (filterGoal) filters.goal = filterGoal as StudyGoal;
      const results = await browsePeers(filters);
      // Exclude self
      setPeers(results.filter(p => p.user_id !== user.id));
    } catch (err) {
      console.error('Browse failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (peer: PeerProfile) => {
    if (!user) return;
    try {
      const req = await sendMatchRequest({
        from_user_id: user.id,
        to_user_id: peer.user_id,
        message: `Mình muốn kết bạn học cùng bạn! Mình đang học ${myProfile.study_level || 'N5'}.`,
      });
      setSentRequests(prev => [req, ...prev]);
      setPeers(prev => prev.map(p => p.id === peer.id ? { ...p } as PeerProfile : p));
    } catch (err) {
      console.error('Send request failed:', err);
    }
  };

  const handleAccept = async (request: PeerMatchRequest) => {
    try {
      await respondToMatchRequest(request.id, 'accepted');
      // Remove from received requests
      setReceivedMatchRequests(prev => prev.filter(r => r.id !== request.id));
      // Reload active matches from database to get full data
      if (user) {
        const matches = await getActiveMatches(user.id);
        setActiveMatches(matches);
      }
    } catch (err) {
      console.error('Accept failed:', err);
    }
  };

  const handleDecline = async (request: PeerMatchRequest) => {
    try {
      await respondToMatchRequest(request.id, 'declined');
      setReceivedMatchRequests(prev => prev.filter(r => r.id !== request.id));
    } catch (err) {
      console.error('Decline failed:', err);
    }
  };

  const handleCancelRequest = async (request: PeerMatchRequest) => {
    try {
      await cancelMatchRequest(request.id);
      setSentRequests(prev => prev.filter(r => r.id !== request.id));
    } catch (err) {
      console.error('Cancel failed:', err);
    }
  };

  const loadChat = async (matchId: string) => {
    try {
      const msgs = await getPeerChatMessages(matchId);

      // Track all loaded message IDs to prevent duplicates
      const loadedIds = new Set(msgs.map(m => m.id));
      loadedIds.forEach(id => addedMessageIds.current.add(id));

      setChatMessages(msgs);
    } catch (err) {
      console.error('Load chat failed:', err);
    }
  };

  const handleSendMessage = async () => {
    if (!user || !chatPeer || !chatInput.trim()) return;

    // First try to find match in state
    let match = activeMatches.find(m =>
      m.from_user_id === user.id && m.to_user_id === chatPeer.user_id ||
      m.to_user_id === user.id && m.from_user_id === chatPeer.user_id
    );

    // If not found in state, query database
    if (!match) {
      match = await getMatchByUserIds(user.id, chatPeer.user_id);
    }

    if (!match) {
      console.warn('No active match found with this peer');
      return;
    }

    const currentMatchId = match.id;
    const currentContent = chatInput.trim();

    setSendingMsg(true);
    setChatInput('');

    try {
      const msg = await sendPeerChatMessage({
        match_id: currentMatchId,
        sender_id: user.id,
        content: currentContent,
      });

      // Track this message ID to prevent duplicates from subscription
      addedMessageIds.current.add(msg.id);

      // Only add to state if it doesn't already exist (prevent duplicates)
      setChatMessages(prev => {
        const exists = prev.some(m => m.id === msg.id);
        if (exists) return prev;
        return [...prev, msg];
      });
    } catch (err) {
      console.error('Send message failed:', err);
      // Restore input on error
      setChatInput(currentContent);
    } finally {
      setSendingMsg(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSetupLoading(true);
    setSetupError('');
    try {
      const updated = await updatePeerProfile(user.id, {
        display_name: myProfile.display_name || '',
        bio: myProfile.bio,
        language: myProfile.language as any || 'japanese',
        study_level: myProfile.study_level as any || 'N5',
        study_goal: myProfile.study_goal as any || 'jlpt',
        available_days: myProfile.available_days || [],
        available_hours: myProfile.available_hours || '',
        timezone: 'Asia/Ho_Chi_Minh',
      });
      setMyProfile(updated);
      setActiveTab('browse');
      handleBrowse();
    } catch (err: any) {
      console.error('Save profile failed:', err);
      setSetupError(err?.message || 'Lưu thất bại. Vui lòng thử lại.');
    } finally {
      setSetupLoading(false);
    }
  };

  const toggleDay = (day: string) => {
    const days = myProfile.available_days || [];
    if (days.includes(day)) {
      setMyProfile({ ...myProfile, available_days: days.filter(d => d !== day) });
    } else {
      setMyProfile({ ...myProfile, available_days: [...days, day] });
    }
  };

  const getOtherParty = (match: PeerMatchRequest) => {
    if (!user) return null;
    return match.from_user_id === user.id
      ? match.to_profile
      : match.from_profile;
  };

  const getRequester = (request: PeerMatchRequest) => {
    if (!user) return null;
    return request.from_user_id === user.id
      ? request.to_profile
      : request.from_profile;
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Vừa xong';
    if (mins < 60) return `${mins}p`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
    });
  };

  const getSentRequestToPeer = (peerId: string) => {
    return sentRequests.find(r => r.to_user_id === peerId);
  };

  const langLabel = (lang: string) => {
    if (lang === 'japanese') return 'Tiếng Nhật';
    if (lang === 'chinese') return 'Tiếng Trung';
    return 'Cả hai';
  };

  const goalLabel = (goal: string) => {
    return STUDY_GOALS.find(g => g.value === goal)?.label || goal;
  };

  if (!user) {
    return (
      <div className="peer-page">
        <div className="peer-empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <h3>Đăng nhập để sử dụng</h3>
          <p>Vui lòng đăng nhập để tìm bạn học cùng trình độ.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="peer-page">
      {/* Header */}
      <div className="peer-page-header">
        <h1 className="peer-page-title">
          <span style={{ marginRight: '0.5rem' }}>🤝</span>
          Tìm bạn học cùng trình độ
        </h1>
        <p className="peer-page-subtitle">
          Kết nối với những học viên cùng trình độ để học tập cùng nhau.
        </p>
      </div>

      {/* Tabs */}
      <div className="peer-tabs">
        <button
          className={`peer-tab${activeTab === 'browse' ? ' active' : ''}`}
          onClick={() => { setActiveTab('browse'); handleBrowse(); }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Tìm bạn học
        </button>
        <button
          className={`peer-tab${activeTab === 'requests' ? ' active' : ''}`}
          onClick={() => setActiveTab('requests')}
        >
          Lời mời
          {receivedRequests.length > 0 && (
            <span className="peer-tab-badge">{receivedRequests.length}</span>
          )}
        </button>
        <button
          className={`peer-tab${activeTab === 'matches' ? ' active' : ''}`}
          onClick={() => setActiveTab('matches')}
        >
          Bạn học đã kết nối
          {activeMatches.length > 0 && (
            <span className="peer-tab-badge">{activeMatches.length}</span>
          )}
        </button>
        <button
          className={`peer-tab${activeTab === 'setup' ? ' active' : ''}`}
          onClick={() => setActiveTab('setup')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
            <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Hồ sơ của tôi
        </button>
      </div>

      {/* ===== BROWSE TAB ===== */}
      {activeTab === 'browse' && (
        <>
          <div className="peer-filter-bar">
            <select className="peer-filter-select" value={filterLang} onChange={e => setFilterLang(e.target.value)}>
              <option value="">Tất cả ngôn ngữ</option>
              <option value="japanese">Tiếng Nhật</option>
              <option value="chinese">Tiếng Trung</option>
              <option value="both">Cả hai</option>
            </select>
            <select className="peer-filter-select" value={filterLevel} onChange={e => setFilterLevel(e.target.value)}>
              <option value="">Tất cả trình độ</option>
              <optgroup label="JLPT">
                {STUDY_LEVELS.filter(l => l.startsWith('N')).map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </optgroup>
              <optgroup label="HSK">
                {STUDY_LEVELS.filter(l => l.startsWith('H')).map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </optgroup>
            </select>
            <select className="peer-filter-select" value={filterGoal} onChange={e => setFilterGoal(e.target.value)}>
              <option value="">Tất cả mục tiêu</option>
              {STUDY_GOALS.map(g => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </select>
            <button className="peer-browse-btn" onClick={handleBrowse} disabled={loading}>
              {loading ? 'Đang tìm...' : '🔍 Tìm kiếm'}
            </button>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
              <div style={{ width: 40, height: 40, border: '4px solid var(--border-color)', borderTopColor: 'var(--primary-color)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            </div>
          ) : peers.length === 0 ? (
            <div className="peer-empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <h3>Chưa có ai được tìm thấy</h3>
              <p>Thử thay đổi bộ lọc hoặc quay lại sau.</p>
            </div>
          ) : (
            <div className="peer-grid">
              {peers.map(peer => {
                const sentReq = getSentRequestToPeer(peer.user_id);
                const matched = activeMatches.find(m =>
                  (m.from_user_id === user.id && m.to_user_id === peer.user_id) ||
                  (m.to_user_id === user.id && m.from_user_id === peer.user_id)
                );
                // Priority: peer.display_name > peer.profiles?.full_name > peer.profiles?.email > 'Ẩn danh'
                const peerName = peer.display_name || peer.profiles?.full_name || peer.profiles?.email?.split('@')[0] || 'Ẩn danh';
                const initials = peerName.slice(0, 2).toUpperCase();
                return (
                  <div key={peer.id} className="peer-card">
                    <div className="peer-card-top">
                      <div className="peer-card-avatar-wrap">
                        <div className="peer-card-avatar">{initials}</div>
                        <span className={`peer-card-online ${peer.is_online ? 'online' : 'offline'}`} />
                      </div>
                      <div className="peer-card-identity">
                        <span className="peer-card-name">{peerName}</span>
                        <div className="peer-card-meta">
                          <span className={`peer-lang-chip ${peer.language}`}>
                            {peer.language === 'both' ? 'JP+CN' : peer.language === 'japanese' ? 'JP' : 'CN'}
                          </span>
                          <span className="peer-level-chip">N{peer.study_level.replace('HSK', '')}</span>
                          {peer.is_online && <span className="peer-online-chip">🟢 Online</span>}
                        </div>
                      </div>
                    </div>

                    <div className="peer-card-goal-row">
                      <span className="peer-goal-chip">🎯 {goalLabel(peer.study_goal)}</span>
                    </div>

                    {peer.bio && (
                      <p className="peer-card-bio">{peer.bio}</p>
                    )}

                    <div className="peer-card-footer">
                      {peer.available_hours ? (
                        <span className="peer-card-schedule">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                            <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {peer.available_hours}
                        </span>
                      ) : (
                        <span className="peer-card-schedule empty">—</span>
                      )}

                      {matched ? (
                        <button className="peer-card-btn chat" onClick={() => setChatPeer(peer)}>
                          💬 Nhắn tin
                        </button>
                      ) : sentReq ? (
                        <button className="peer-card-btn sent" disabled>
                          ⏳ Đã gửi
                        </button>
                      ) : (
                        <button className="peer-card-btn connect" onClick={() => handleSendRequest(peer)}>
                          🤝 Kết nối
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ===== REQUESTS TAB ===== */}
      {activeTab === 'requests' && (
        <>
          {receivedRequests.length === 0 && sentRequests.length === 0 ? (
            <div className="peer-empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <h3>Không có lời mời nào</h3>
              <p>Khi có người muốn kết nối, họ sẽ xuất hiện ở đây.</p>
            </div>
          ) : (
            <>
              {receivedRequests.length > 0 && (
                <>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>
                    📥 Lời mời nhận được
                  </h3>
                  {receivedRequests.map(req => {
                    const from = req.from_profile;
                    // Priority: from_peer_profile.display_name > profiles.full_name > email
                    const fromName = req.from_peer_profile?.display_name || from?.full_name || from?.email?.split('@')[0] || 'Ẩn danh';
                    return (
                      <div key={req.id} className="peer-request-card">
                        <div className="peer-avatar" style={{ width: 40, height: 40, fontSize: '1rem' }}>
                          {fromName.charAt(0).toUpperCase()}
                        </div>
                        <div className="peer-request-info">
                          <p className="peer-request-name">{fromName}</p>
                          {req.message && <p className="peer-request-message">"{req.message}"</p>}
                          <p className="peer-request-time">{formatDateTime(req.created_at)}</p>
                        </div>
                        <div className="peer-request-actions">
                          <button className="peer-accept-btn" onClick={() => handleAccept(req)}>
                            ✅ Nhận
                          </button>
                          <button className="peer-decline-btn" onClick={() => handleDecline(req)}>
                            ❌
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}

              {sentRequests.length > 0 && (
                <>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', margin: '1.5rem 0 1rem' }}>
                    📤 Lời mời đã gửi
                  </h3>
                  {sentRequests.map(req => {
                    const to = req.to_profile;
                    // Priority: to_peer_profile.display_name > profiles.full_name > email
                    const toName = req.to_peer_profile?.display_name || to?.full_name || to?.email?.split('@')[0] || 'Ẩn danh';
                    return (
                      <div key={req.id} className="peer-request-card">
                        <div className="peer-avatar" style={{ width: 40, height: 40, fontSize: '1rem' }}>
                          {toName.charAt(0).toUpperCase()}
                        </div>
                        <div className="peer-request-info">
                          <p className="peer-request-name">{toName}</p>
                          <span className={`peer-status-badge ${req.status}`}>{req.status === 'pending' ? '⏳ Chờ trả lời' : req.status === 'accepted' ? '✅ Đã chấp nhận' : '❌ Đã từ chối'}</span>
                        </div>
                        {req.status === 'pending' && (
                          <button className="peer-cancel-btn" onClick={() => handleCancelRequest(req)}>
                            Hủy
                          </button>
                        )}
                      </div>
                    );
                  })}
                </>
              )}
            </>
          )}
        </>
      )}

      {/* ===== MATCHES TAB ===== */}
      {activeTab === 'matches' && (
        <>
          {activeMatches.length === 0 ? (
            <div className="peer-empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <h3>Chưa có bạn học nào</h3>
              <p>Tìm bạn học và gửi lời mời kết nối để bắt đầu trò chuyện!</p>
              <button className="peer-browse-btn" style={{ marginTop: '1rem' }} onClick={() => setActiveTab('browse')}>
                🔍 Tìm bạn học ngay
              </button>
            </div>
          ) : (
            <div className="peer-grid">
              {activeMatches.map(match => {
                const other = getOtherParty(match);
                // Get the other user's peer profile for display_name
                const otherPeerProfile = match.from_user_id === user.id ? match.to_peer_profile : match.from_peer_profile;
                // Priority: peer_profile.display_name > profiles.full_name > email
                const otherName = otherPeerProfile?.display_name || other?.full_name || other?.email?.split('@')[0] || 'Ẩn danh';
                const initials = otherName.slice(0, 2).toUpperCase();
                return (
                  <div key={match.id} className="peer-card">
                    <div className="peer-card-top">
                      <div className="peer-card-avatar-wrap">
                        <div className="peer-card-avatar">{initials}</div>
                        <span className="peer-card-online offline" />
                      </div>
                      <div className="peer-card-identity">
                        <span className="peer-card-name">{otherName}</span>
                        <div className="peer-card-meta">
                          <span className="peer-connected-chip">✅ Đã kết nối</span>
                        </div>
                      </div>
                    </div>
                    <div className="peer-card-footer" style={{ marginTop: '1rem' }}>
                      <span />
                      <button
                        className="peer-card-btn chat"
                        onClick={() => {
                          const peerUserId = match.from_user_id === user.id ? match.to_user_id : match.from_user_id;
                          // Use display_name from peer_profile
                          const peerProfile: PeerProfile = {
                            id: peerUserId,
                            user_id: peerUserId,
                            display_name: otherName,
                            language: otherPeerProfile?.language || 'japanese',
                            study_level: otherPeerProfile?.study_level || 'N5',
                            study_goal: otherPeerProfile?.study_goal || 'jlpt',
                            available_days: otherPeerProfile?.available_days || [],
                            available_hours: otherPeerProfile?.available_hours || '',
                            timezone: otherPeerProfile?.timezone || 'Asia/Ho_Chi_Minh',
                            is_online: otherPeerProfile?.is_online || false,
                            created_at: '',
                            updated_at: '',
                            profiles: other ? { email: other.email || '', full_name: other.full_name, avatar_url: other.avatar_url } : undefined,
                          };
                          setChatPeer(peerProfile);
                        }}
                      >
                        💬 Nhắn tin
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ===== SETUP TAB ===== */}
      {activeTab === 'setup' && (
        <div className="peer-setup-section">
          <h2 className="peer-setup-title">👤 Tạo hồ sơ bạn học</h2>
          <p className="peer-setup-subtitle">Hoàn thiện hồ sơ để người khác có thể tìm thấy bạn.</p>
          <form className="peer-setup-form" onSubmit={handleSaveProfile}>
            <div className="form-group">
              <label className="form-label">Tên hiển thị *</label>
              <input
                type="text"
                className="form-input"
                placeholder="VD: Minh Tanaka"
                value={myProfile.display_name || ''}
                onChange={e => setMyProfile({ ...myProfile, display_name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Ngôn ngữ học</label>
              <select
                className="form-select"
                value={myProfile.language || 'japanese'}
                onChange={e => setMyProfile({ ...myProfile, language: e.target.value as any })}
              >
                <option value="japanese">🇯🇵 Tiếng Nhật</option>
                <option value="chinese">🇨🇳 Tiếng Trung</option>
                <option value="both">Cả hai</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Trình độ</label>
              <select
                className="form-select"
                value={myProfile.study_level || 'N5'}
                onChange={e => setMyProfile({ ...myProfile, study_level: e.target.value as any })}
              >
                <optgroup label="JLPT">
                  {['N5', 'N4', 'N3', 'N2', 'N1'].map(l => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </optgroup>
                <optgroup label="HSK">
                  {['HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6'].map(l => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </optgroup>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Mục tiêu học tập</label>
              <select
                className="form-select"
                value={myProfile.study_goal || 'jlpt'}
                onChange={e => setMyProfile({ ...myProfile, study_goal: e.target.value as any })}
              >
                {STUDY_GOALS.map(g => (
                  <option key={g.value} value={g.value}>{g.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Giới thiệu bản thân</label>
              <textarea
                className="form-textarea"
                placeholder="VD: Mình đang học N4, muốn luyện giao tiếp..."
                value={myProfile.bio || ''}
                onChange={e => setMyProfile({ ...myProfile, bio: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Ngày rảnh học</label>
              <div className="peer-setup-days">
                {DAYS.map(d => (
                  <button
                    key={d.value}
                    type="button"
                    className={`peer-setup-day-btn${(myProfile.available_days || []).includes(d.value) ? ' active' : ''}`}
                    onClick={() => toggleDay(d.value)}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Khung giờ rảnh</label>
              <input
                type="text"
                className="form-input"
                placeholder="VD: 18:00 - 22:00"
                value={myProfile.available_hours || ''}
                onChange={e => setMyProfile({ ...myProfile, available_hours: e.target.value })}
              />
            </div>

            {setupError && (
              <div className="peer-error-banner">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                  <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {setupError}
              </div>
            )}

            <div className="peer-setup-actions">
              <button type="button" className="peer-skip-btn" onClick={() => setActiveTab('browse')}>
                Bỏ qua
              </button>
              <button type="submit" className="peer-save-btn" disabled={setupLoading}>
                {setupLoading ? 'Đang lưu...' : '💾 Lưu hồ sơ'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ===== CHAT WINDOW ===== */}
      {chatPeer && (
        <div className="peer-chat-overlay" onClick={() => setChatPeer(null)}>
          <div className="peer-chat-window" onClick={e => e.stopPropagation()}>
            <div className="peer-chat-header">
              <div className="peer-chat-header-avatar">
                {/* Priority: display_name > profiles.full_name > '?' */}
                {(chatPeer.display_name || chatPeer.profiles?.full_name || '?').slice(0, 2).toUpperCase()}
              </div>
              <div className="peer-chat-header-info">
                <p className="peer-chat-header-name">
                  {/* Priority: display_name > profiles.full_name > 'Bạn học' */}
                  {chatPeer.display_name || chatPeer.profiles?.full_name || 'Bạn học'}
                </p>
                <p className="peer-chat-header-lang">
                  {langLabel(chatPeer.language)} • {chatPeer.study_level}
                </p>
              </div>
              <button className="peer-chat-close" onClick={() => setChatPeer(null)}>&times;</button>
            </div>

            <div className="peer-chat-messages">
              {chatMessages.length === 0 ? (
                <div className="peer-chat-empty">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="40" height="40" style={{ opacity: 0.3 }}>
                    <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p>Chưa có tin nhắn nào. Bắt đầu cuộc trò chuyện!</p>
                </div>
              ) : (
                <>
                  {chatMessages.map(msg => {
                    const isSent = msg.sender_id === user?.id;
                    return (
                      <div key={msg.id} className={`peer-chat-msg ${isSent ? 'sent' : 'received'}`}>
                        <div className="peer-chat-msg-bubble">{msg.content}</div>
                        <span className="peer-chat-msg-time">{formatTime(msg.created_at)}</span>
                      </div>
                    );
                  })}
                  <div ref={chatEndRef} />
                </>
              )}
            </div>

            <div className="peer-chat-input-bar">
              <input
                type="text"
                placeholder="Nhắn tin..."
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
              />
              <button
                className="peer-chat-send-btn"
                onClick={handleSendMessage}
                disabled={sendingMsg || !chatInput.trim()}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                  <path d="M12 19V5M5 12l7-7 7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
