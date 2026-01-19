import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../config/supabase';
import { getNotebookItems, removeFromNotebook } from '../services/notebookService';
import { Link } from 'react-router-dom';
import '../App.css';

const NotebookView: React.FC = () => {
    const { user } = useAuth();
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            loadItems();
        }
    }, [user]);

    const loadItems = async () => {
        try {
            setLoading(true);
            const notebookData = await getNotebookItems(user!.id);

            // Enrich data with actual content
            const enrichedItems = await Promise.all(notebookData.map(async (item) => {
                let details = null;
                const { data, error } = await supabase
                    .from(item.item_type)
                    .select('*')
                    .eq('id', item.item_id)
                    .maybeSingle();

                if (!error && data) {
                    details = data;
                }

                return { ...item, details };
            }));

            setItems(enrichedItems);
        } catch (e) {
            console.error('Error loading notebook:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = async (itemId: string) => {
        if (confirm('Bạn có chắc muốn xóa mục này khỏi sổ tay?')) {
            await removeFromNotebook(user!.id, itemId);
            setItems(items.filter(i => i.item_id !== itemId));
        }
    };

    if (!user) {
        return (
            <div className="container" style={{ paddingTop: '100px' }}>
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <h2>Vui lòng đăng nhập</h2>
                    <p>Bạn cần đăng nhập để xem sổ tay cá nhân.</p>
                    <Link to="/login" className="btn btn-primary">Đăng nhập ngay</Link>
                </div>
            </div>
        );
    }

    const renderItemContent = (item: any) => {
        const { item_type, details } = item;
        if (!details) return <div>Nội dung không khả dụng hoặc đã bị xóa.</div>;

        switch (item_type) {
            case 'vocabulary':
                return (
                    <>
                        <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary-color)' }}>{details.word}</div>
                        <div style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{details.reading}</div>
                        <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{details.meaning}</div>
                    </>
                );
            case 'kanji':
                return (
                    <>
                        <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--secondary-color)', marginBottom: '0.5rem' }}>{details.character}</div>
                        <div style={{ fontWeight: 600, fontSize: '1.2rem' }}>{details.meaning}</div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                            {details.readings?.onyomi?.join(', ')} / {details.readings?.kunyomi?.join(', ')}
                        </div>
                    </>
                );
            case 'grammar':
                return (
                    <>
                        <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--success-color)', marginBottom: '0.5rem' }}>{details.pattern}</div>
                        <div style={{ fontWeight: 600 }}>{details.meaning}</div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{details.explanation}</p>
                    </>
                );
            default:
                return <div>Loại mục không xác định</div>;
        }
    };

    return (
        <div className="container" style={{ paddingTop: '80px', minHeight: '100vh', paddingBottom: '4rem' }}>
            <div style={{ marginBottom: '2rem' }}>
                <Link to="/" className="back-button" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: 700 }}>← Quay lại Dashboard</Link>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginTop: '1rem', background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--primary-color) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Sổ Tay Của Tôi 📔</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Nơi lưu trữ những từ vựng và kiến thức quan trọng của bạn.</p>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '4rem' }}>
                    <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
                    <p>Đang tải dữ liệu Sổ tay...</p>
                </div>
            ) : items.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '4rem', borderRadius: '24px' }}>
                    <div style={{ fontSize: '5rem', marginBottom: '1.5rem' }}>🏜️</div>
                    <h3 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '1rem' }}>Sổ tay còn trống</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem', maxWidth: '400px', margin: '0 auto 2.5rem' }}>Hãy bấm vào biểu tượng ⭐ ở các bài học để lưu kiến thức quan trọng vào đây để ôn tập sau.</p>
                    <Link to="/japanese/courses" className="btn btn-primary" style={{ padding: '1rem 2.5rem', borderRadius: '12px' }}>Khám phá các bài học</Link>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
                    {items.map((item) => (
                        <div key={item.id} className="card notebook-card" style={{
                            position: 'relative',
                            padding: '2rem',
                            borderRadius: '24px',
                            border: '1px solid var(--border-color)',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            display: 'flex',
                            flexDirection: 'column'
                        }}>
                            <button
                                onClick={() => handleRemove(item.item_id)}
                                style={{
                                    position: 'absolute',
                                    top: '1.25rem',
                                    right: '1.25rem',
                                    background: 'var(--bg-secondary)',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '1.1rem',
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '10px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    opacity: 0.6,
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                                onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}
                                title="Xóa khỏi sổ tay"
                            >
                                🗑️
                            </button>

                            <div style={{
                                alignSelf: 'flex-start',
                                padding: '0.35rem 1rem',
                                borderRadius: '10px',
                                background: item.item_type === 'vocabulary' ? 'var(--primary-light)' :
                                    item.item_type === 'kanji' ? 'var(--secondary-light)' : 'var(--success-light)',
                                color: item.item_type === 'vocabulary' ? 'var(--primary-color)' :
                                    item.item_type === 'kanji' ? 'var(--secondary-color)' : 'var(--success-color)',
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                marginBottom: '1.5rem'
                            }}>
                                {item.item_type === 'vocabulary' ? 'Từ vựng' :
                                    item.item_type === 'kanji' ? 'Kanji' : 'Ngữ pháp'}
                            </div>

                            <div style={{ flex: 1 }}>
                                {renderItemContent(item)}
                            </div>

                            <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0 }}>
                                    Lưu ngày {new Date(item.created_at).toLocaleDateString('vi-VN')}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default NotebookView;
