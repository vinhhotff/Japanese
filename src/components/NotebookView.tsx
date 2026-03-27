import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../config/supabase';
import { getNotebookItems, removeFromNotebook } from '../services/notebookService';
import { Link } from 'react-router-dom';
import '../styles/notebook.css';

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
            <div className="notebook-page" style={{ paddingTop: '100px' }}>
                <div className="card notebook-empty">
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
                    <div className="notebook-card-content">
                        <div className="notebook-word">{details.word}</div>
                        <div className="notebook-reading">{details.reading}</div>
                        <div className="notebook-meaning">{details.meaning}</div>
                    </div>
                );
            case 'kanji':
                return (
                    <div className="notebook-card-content">
                        <div className="notebook-kanji-char">{details.character}</div>
                        <div className="notebook-meaning">{details.meaning}</div>
                        <div className="notebook-kanji-readings">
                            {details.readings?.onyomi?.join(', ')} / {details.readings?.kunyomi?.join(', ')}
                        </div>
                    </div>
                );
            case 'grammar':
                return (
                    <div className="notebook-card-content">
                        <div className="notebook-pattern">{details.pattern}</div>
                        <div className="notebook-meaning">{details.meaning}</div>
                        <p className="notebook-explanation">{details.explanation}</p>
                    </div>
                );
            default:
                return <div>Loại mục không xác định</div>;
        }
    };

    return (
        <div className="notebook-page">
            <div className="notebook-header">
                <Link to="/" className="notebook-back-link">← Quay lại Dashboard</Link>
                <h1 className="notebook-title">Sổ Tay Của Tôi 📔</h1>
                <p className="notebook-subtitle">Nơi lưu trữ những từ vựng và kiến thức quan trọng của bạn.</p>
            </div>

            {loading ? (
                <div className="notebook-loading">
                    <div className="notebook-loading-spinner"></div>
                    <p>Đang tải dữ liệu Sổ tay...</p>
                </div>
            ) : items.length === 0 ? (
                <div className="notebook-empty">
                    <span className="notebook-empty-icon">🏜️</span>
                    <h3 className="notebook-empty-title">Sổ tay còn trống</h3>
                    <p className="notebook-empty-desc">Hãy bấm vào biểu tượng ⭐ ở các bài học để lưu kiến thức quan trọng vào đây để ôn tập sau.</p>
                    <Link to="/japanese/courses" className="notebook-empty-cta">Khám phá các bài học</Link>
                </div>
            ) : (
                <div className="notebook-grid">
                    {items.map((item) => (
                        <div key={item.id} className="notebook-card">
                            <button
                                onClick={() => handleRemove(item.item_id)}
                                className="notebook-card-remove"
                                title="Xóa khỏi sổ tay"
                            >
                                🗑️
                            </button>

                            <span className={`notebook-card-type ${item.item_type}`}>
                                {item.item_type === 'vocabulary' ? 'Từ vựng' :
                                    item.item_type === 'kanji' ? 'Kanji' : 'Ngữ pháp'}
                            </span>

                            {renderItemContent(item)}

                            <div className="notebook-card-footer">
                                <p className="notebook-card-date">
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
