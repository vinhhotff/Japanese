import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../contexts/AuthContext';
import { getUserStats } from '../services/statsService';

const Leaderboard: React.FC = () => {
    const { user } = useAuth();
    const [topUsers, setTopUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUserStats, setCurrentUserStats] = useState<any>(null);

    useEffect(() => {
        fetchLeaderboard();
        if (user) {
            fetchUserStats();
        }
    }, [user]);

    const fetchLeaderboard = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('user_stats')
                .select('user_id, total_points, level, current_streak')
                .order('total_points', { ascending: false })
                .limit(10);

            if (error) throw error;

            // Note: In a real app, you'd join with profiles table for names/avatars
            setTopUsers(data || []);
        } catch (e) {
            console.error('Error fetching leaderboard:', e);
        } finally {
            setLoading(false);
        }
    };

    const fetchUserStats = async () => {
        const stats = await getUserStats(user!.id);
        setCurrentUserStats(stats);
    };

    return (
        <div className="card" style={{ padding: '2rem', borderRadius: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ fontSize: '2.5rem' }}>🏆</div>
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Bảng Xếp Hạng</h2>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Top 10 học viên xuất sắc nhất</p>
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>Đang tải...</div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {topUsers.map((item, index) => (
                        <div
                            key={item.user_id}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '1rem',
                                borderRadius: '16px',
                                background: item.user_id === user?.id ? 'var(--primary-light)' : 'var(--bg-secondary)',
                                border: item.user_id === user?.id ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                                transition: 'transform 0.2s'
                            }}
                        >
                            <div style={{
                                width: '32px',
                                fontWeight: 800,
                                fontSize: '1.1rem',
                                color: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : 'var(--text-secondary)'
                            }}>
                                #{index + 1}
                            </div>

                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '12px',
                                background: 'white',
                                marginRight: '1rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.2rem'
                            }}>
                                👤
                            </div>

                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 700, fontSize: '1rem' }}>
                                    {item.user_id === user?.id ? 'Bạn (Học viên)' : `Học viên ${item.user_id.substring(0, 5)}...`}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                    Cấp độ {item.level} • {item.current_streak} ngày streak
                                </div>
                            </div>

                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontWeight: 800, color: 'var(--primary-color)', fontSize: '1.2rem' }}>
                                    {item.total_points}
                                </div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                    Điểm XP
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {user && currentUserStats && !topUsers.find(u => u.user_id === user.id) && (
                <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '2px dashed var(--border-color)' }}>
                    <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>Vị trí của bạn</div>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '1rem',
                        borderRadius: '16px',
                        background: 'var(--primary-light)',
                        border: '2px solid var(--primary-color)'
                    }}>
                        <div style={{ width: '32px', fontWeight: 800 }}>-</div>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'white', marginRight: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👤</div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700 }}>Bạn</div>
                            <div style={{ fontSize: '0.8rem' }}>Cấp độ {currentUserStats.level}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 800, color: 'var(--primary-color)' }}>{currentUserStats.totalPoints}</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Leaderboard;
