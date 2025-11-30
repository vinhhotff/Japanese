import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './Toast';
import { logger } from '../utils/logger';
import { 
  getCourses, createCourse, updateCourse, deleteCourse,
  getLessons, createLesson, updateLesson, deleteLesson,
  getVocabulary, createVocabulary, updateVocabulary, deleteVocabulary,
  getKanji, createKanji, updateKanji, deleteKanji,
  getGrammar, createGrammar, updateGrammar, deleteGrammar,
  getListeningExercises, createListeningExercise, updateListeningExercise, deleteListeningExercise,
  getSentenceGames, createSentenceGame, updateSentenceGame, deleteSentenceGame,
  getRoleplayScenarios, createRoleplayScenario, updateRoleplayScenario, deleteRoleplayScenario
} from '../services/supabaseService';
import { parseVocabularyBatch } from '../utils/vocabParser';
import { parseKanjiBatch } from '../utils/kanjiParser';
import { parseGrammarBatch } from '../utils/grammarParser';
import { parseSentenceGameBatch } from '../utils/sentenceGameParser';
import { uploadAudio, uploadImage, validateFileType, validateFileSize } from '../utils/fileUpload';
import '../App.css';

type TabType = 'courses' | 'lessons' | 'vocabulary' | 'kanji' | 'grammar' | 'listening' | 'games' | 'roleplay';

const AdminPanel = () => {
  const { user, signOut } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('courses');
  const [data, setData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  
  // Filter and Pagination states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [filterLesson, setFilterLesson] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  useEffect(() => {
    loadCourses();
    loadLessons();
  }, []);

  useEffect(() => {
    loadData();
    // Reset filters when changing tabs
    setSearchTerm('');
    setFilterLevel('');
    setFilterLesson('');
    setCurrentPage(1);
  }, [activeTab]);

  // Filter data whenever search term, filters, or data changes
  useEffect(() => {
    let filtered = [...data];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(item => {
        const searchLower = searchTerm.toLowerCase();
        return (
          (item.title?.toLowerCase().includes(searchLower)) ||
          (item.word?.toLowerCase().includes(searchLower)) ||
          (item.kanji?.toLowerCase().includes(searchLower)) ||
          (item.character?.toLowerCase().includes(searchLower)) ||
          (item.pattern?.toLowerCase().includes(searchLower)) ||
          (item.meaning?.toLowerCase().includes(searchLower)) ||
          (item.description?.toLowerCase().includes(searchLower))
        );
      });
    }

    // Level filter
    if (filterLevel) {
      filtered = filtered.filter(item => item.level === filterLevel);
    }

    // Lesson filter
    if (filterLesson) {
      filtered = filtered.filter(item => item.lesson_id === filterLesson);
    }

    setFilteredData(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [data, searchTerm, filterLevel, filterLesson]);

  const loadCourses = async () => {
    try {
      const coursesData = await getCourses();
      setCourses(coursesData || []);
    } catch (error) {
      console.error('Error loading courses:', error);
    }
  };

  const loadLessons = async () => {
    try {
      const lessonsData = await getLessons();
      setLessons(lessonsData || []);
    } catch (error) {
      console.error('Error loading lessons:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'courses':
          const coursesData = await getCourses();
          setData(coursesData || []);
          break;
        case 'lessons':
          const lessonsData = await getLessons();
          setData(lessonsData || []);
          break;
        case 'vocabulary':
          const vocabData = await getVocabulary();
          setData(vocabData || []);
          break;
        case 'kanji':
          const kanjiData = await getKanji();
          setData(kanjiData || []);
          break;
        case 'grammar':
          const grammarData = await getGrammar();
          setData(grammarData || []);
          break;
        case 'listening':
          const listeningData = await getListeningExercises();
          setData(listeningData || []);
          break;
        case 'games':
          const gamesData = await getSentenceGames();
          setData(gamesData || []);
          break;
        case 'roleplay':
          const roleplayData = await getRoleplayScenarios();
          setData(roleplayData || []);
          break;
      }
    } catch (error: any) {
      logger.error('Error loading data:', error);
      showToast('Lỗi khi tải dữ liệu: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (formData: any) => {
    try {
      switch (activeTab) {
        case 'courses':
          await createCourse(formData);
          break;
        case 'lessons':
          await createLesson(formData);
          break;
        case 'vocabulary':
          // Check if it's batch import (array)
          if (Array.isArray(formData)) {
            // Batch import - create multiple vocabularies
            let successCount = 0;
            let errorCount = 0;
            for (const vocab of formData) {
              try {
                await createVocabulary(vocab);
                successCount++;
              } catch (err) {
                console.error('Error creating vocabulary:', vocab, err);
                errorCount++;
              }
            }
            if (errorCount === 0) {
              showToast(`Đã thêm ${successCount} từ vựng thành công!`, 'success');
            } else {
              showToast(`Đã thêm ${successCount} từ vựng, ${errorCount} từ vựng bị lỗi.`, 'warning');
            }
          } else {
            // Single import
            await createVocabulary(formData);
          }
          break;
        case 'kanji':
          // Check if it's batch import (array)
          if (Array.isArray(formData)) {
            let successCount = 0;
            let errorCount = 0;
            for (const kanji of formData) {
              try {
                await createKanji(kanji);
                successCount++;
              } catch (err) {
                console.error('Error creating kanji:', kanji, err);
                errorCount++;
              }
            }
            if (errorCount === 0) {
              showToast(`Đã thêm ${successCount} kanji thành công!`, 'success');
            } else {
              showToast(`Đã thêm ${successCount} kanji, ${errorCount} kanji bị lỗi.`, 'warning');
            }
          } else {
            await createKanji(formData);
          }
          break;
        case 'grammar':
          // Check if it's batch import (array)
          if (Array.isArray(formData)) {
            let successCount = 0;
            let errorCount = 0;
            for (const grammar of formData) {
              try {
                await createGrammar(grammar);
                successCount++;
              } catch (err) {
                console.error('Error creating grammar:', grammar, err);
                errorCount++;
              }
            }
            if (errorCount === 0) {
              showToast(`Đã thêm ${successCount} ngữ pháp thành công!`, 'success');
            } else {
              showToast(`Đã thêm ${successCount} ngữ pháp, ${errorCount} ngữ pháp bị lỗi.`, 'warning');
            }
          } else {
            await createGrammar(formData);
          }
          break;
        case 'listening':
          await createListeningExercise(formData);
          break;
        case 'games':
          // Hỗ trợ cả tạo đơn lẻ và import hàng loạt
          if (Array.isArray(formData)) {
            let successCount = 0;
            let errorCount = 0;
            for (const game of formData) {
              try {
                await createSentenceGame(game);
                successCount++;
              } catch (err) {
                console.error('Error creating sentence game:', game, err);
                errorCount++;
              }
            }
            if (errorCount === 0) {
              showToast(`Đã thêm ${successCount} game sắp xếp câu thành công!`, 'success');
            } else {
              showToast(`Đã thêm ${successCount} game, ${errorCount} game bị lỗi.`, 'warning');
            }
          } else {
            await createSentenceGame(formData);
          }
          break;
        case 'roleplay':
          await createRoleplayScenario(formData);
          break;
      }
      setShowForm(false);
      setEditingItem(null);
      await loadData();
      if (activeTab === 'lessons') await loadLessons();
      if (activeTab === 'courses') await loadCourses();
      showToast('Tạo thành công!', 'success');
    } catch (error: any) {
      logger.error('Error creating:', error);
      showToast('Lỗi khi tạo: ' + error.message, 'error');
    }
  };

  const handleUpdate = async (id: string, formData: any) => {
    try {
      switch (activeTab) {
        case 'courses':
          await updateCourse(id, formData);
          break;
        case 'lessons':
          await updateLesson(id, formData);
          break;
        case 'vocabulary':
          await updateVocabulary(id, formData);
          break;
        case 'kanji':
          await updateKanji(id, formData);
          break;
        case 'grammar':
          await updateGrammar(id, formData);
          break;
        case 'roleplay':
          await updateRoleplayScenario(id, formData);
          break;
        case 'listening':
          await updateListeningExercise(id, formData);
          break;
        case 'games':
          await updateSentenceGame(id, formData);
          break;
      }
      setShowForm(false);
      setEditingItem(null);
      await loadData();
      showToast('Cập nhật thành công!', 'success');
    } catch (error: any) {
      logger.error('Error updating:', error);
      showToast('Lỗi khi cập nhật: ' + error.message, 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa?')) return;

    try {
      switch (activeTab) {
        case 'courses':
          await deleteCourse(id);
          break;
        case 'lessons':
          await deleteLesson(id);
          break;
        case 'vocabulary':
          await deleteVocabulary(id);
          break;
        case 'kanji':
          await deleteKanji(id);
          break;
        case 'grammar':
          await deleteGrammar(id);
          break;
        case 'roleplay':
          await deleteRoleplayScenario(id);
          break;
        case 'listening':
          await deleteListeningExercise(id);
          break;
        case 'games':
          await deleteSentenceGame(id);
          break;
      }
      await loadData();
      showToast('Xóa thành công!', 'success');
    } catch (error: any) {
      logger.error('Error deleting:', error);
      showToast('Lỗi khi xóa: ' + error.message, 'error');
    }
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <div>
          <h1>
            <svg style={{ width: '36px', height: '36px', display: 'inline', marginRight: '0.75rem' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Quản lý Dữ liệu
          </h1>
          <p>Thêm, sửa, xóa bài học, từ vựng, kanji...</p>
        </div>
        <div className="admin-user-info">
          <span>Xin chào, {user?.email}</span>
          <a href="/" className="btn btn-secondary" style={{ marginRight: '0.5rem' }}>
            <svg style={{ width: '18px', height: '18px', marginRight: '0.5rem' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Trang chủ
          </a>
          <button className="btn btn-outline" onClick={signOut}>
            <svg style={{ width: '18px', height: '18px', marginRight: '0.5rem' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Đăng xuất
          </button>
        </div>
      </div>

      <div className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === 'courses' ? 'active' : ''}`}
          onClick={() => setActiveTab('courses')}
        >
          <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
          </svg>
          Khóa học
        </button>
        <button
          className={`admin-tab ${activeTab === 'lessons' ? 'active' : ''}`}
          onClick={() => setActiveTab('lessons')}
        >
          <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          Bài học
        </button>
        <button
          className={`admin-tab ${activeTab === 'vocabulary' ? 'active' : ''}`}
          onClick={() => setActiveTab('vocabulary')}
        >
          <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          Từ vựng
        </button>
        <button
          className={`admin-tab ${activeTab === 'kanji' ? 'active' : ''}`}
          onClick={() => setActiveTab('kanji')}
        >
          <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          Kanji
        </button>
        <button
          className={`admin-tab ${activeTab === 'grammar' ? 'active' : ''}`}
          onClick={() => setActiveTab('grammar')}
        >
          <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Ngữ pháp
        </button>
        <button
          className={`admin-tab ${activeTab === 'listening' ? 'active' : ''}`}
          onClick={() => setActiveTab('listening')}
        >
          <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
          Nghe
        </button>
        <button
          className={`admin-tab ${activeTab === 'games' ? 'active' : ''}`}
          onClick={() => setActiveTab('games')}
        >
          <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
          </svg>
          Game
        </button>
        <button
          className={`admin-tab ${activeTab === 'roleplay' ? 'active' : ''}`}
          onClick={() => setActiveTab('roleplay')}
        >
          <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          Roleplay
        </button>
      </div>

      <div className="admin-content">
        <div className="admin-actions">
          <button
            className="btn btn-primary"
            onClick={() => {
              setEditingItem(null);
              setShowForm(true);
            }}
          >
            ➕ Thêm mới
          </button>
        </div>

        {/* Filters */}
        <div style={{ 
          display: 'flex', 
          gap: '1rem', 
          marginBottom: '1.5rem', 
          flexWrap: 'wrap',
          padding: '1rem',
          background: 'var(--bg-secondary)',
          borderRadius: '12px'
        }}>
          {/* Search */}
          <div style={{ flex: '1 1 300px' }}>
            <input
              type="text"
              placeholder="🔍 Tìm kiếm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '2px solid var(--border-color)',
                fontSize: '0.9375rem'
              }}
            />
          </div>

          {/* Level Filter */}
          {(activeTab === 'courses' || activeTab === 'lessons' || activeTab === 'vocabulary' || activeTab === 'kanji' || activeTab === 'grammar') && (
            <div style={{ flex: '0 1 150px' }}>
              <select
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '2px solid var(--border-color)',
                  fontSize: '0.9375rem'
                }}
              >
                <option value="">Tất cả cấp độ</option>
                <option value="N5">N5</option>
                <option value="N4">N4</option>
                <option value="N3">N3</option>
                <option value="N2">N2</option>
                <option value="N1">N1</option>
                <option value="HSK1">HSK1</option>
                <option value="HSK2">HSK2</option>
                <option value="HSK3">HSK3</option>
                <option value="HSK4">HSK4</option>
                <option value="HSK5">HSK5</option>
                <option value="HSK6">HSK6</option>
              </select>
            </div>
          )}

          {/* Lesson Filter */}
          {(activeTab === 'vocabulary' || activeTab === 'kanji' || activeTab === 'grammar') && (
            <div style={{ flex: '0 1 200px' }}>
              <select
                value={filterLesson}
                onChange={(e) => setFilterLesson(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '2px solid var(--border-color)',
                  fontSize: '0.9375rem'
                }}
              >
                <option value="">Tất cả bài học</option>
                {lessons.map((lesson: any) => (
                  <option key={lesson.id} value={lesson.id}>
                    {lesson.title} ({lesson.level})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Clear Filters */}
          {(searchTerm || filterLevel || filterLesson) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterLevel('');
                setFilterLesson('');
              }}
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                border: 'none',
                background: '#ef4444',
                color: 'white',
                cursor: 'pointer',
                fontSize: '0.9375rem',
                fontWeight: '600'
              }}
            >
              ✕ Xóa bộ lọc
            </button>
          )}
        </div>

        {/* Results count */}
        <div style={{ 
          marginBottom: '1rem', 
          color: 'var(--text-secondary)',
          fontSize: '0.9375rem',
          fontWeight: '600'
        }}>
          Hiển thị {Math.min((currentPage - 1) * itemsPerPage + 1, filteredData.length)}-{Math.min(currentPage * itemsPerPage, filteredData.length)} / {filteredData.length} kết quả
        </div>

        {loading ? (
          <div className="loading">Đang tải...</div>
        ) : (
          <>
            <div className="admin-list">
              {filteredData.length === 0 ? (
                <div className="empty-state">
                  <p>{data.length === 0 ? 'Chưa có dữ liệu. Hãy thêm mới!' : 'Không tìm thấy kết quả phù hợp.'}</p>
                </div>
              ) : (
                filteredData
                  .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                  .map((item) => (
                <div key={item.id} className="admin-item">
                  <div className="item-content">
                    {activeTab === 'kanji' ? (
                      <h3 className="kanji-display">{item.character}</h3>
                    ) : (
                      <h3>{item.title || item.word || item.pattern || item.sentence || 'N/A'}</h3>
                    )}
                    <p>{item.description || item.meaning || item.translation || item.prompt || 'N/A'}</p>
                    {item.level && (
                      <span className={`badge badge-${item.level.toLowerCase()}`}>
                        {item.level}
                      </span>
                    )}
                  </div>
                  <div className="item-actions">
                    <button
                      className="btn btn-outline"
                      onClick={() => {
                        setEditingItem(item);
                        setShowForm(true);
                      }}
                    >
                      ✏️ Sửa
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleDelete(item.id)}
                    >
                      🗑️ Xóa
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {filteredData.length > itemsPerPage && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '0.5rem',
              marginTop: '2rem',
              padding: '1rem',
              background: 'var(--bg-secondary)',
              borderRadius: '12px'
            }}>
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: currentPage === 1 ? 'var(--border-color)' : 'var(--primary-color)',
                  color: 'white',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '600'
                }}
              >
                ⏮️ Đầu
              </button>
              
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: currentPage === 1 ? 'var(--border-color)' : 'var(--primary-color)',
                  color: 'white',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '600'
                }}
              >
                ◀️ Trước
              </button>

              <span style={{
                padding: '0.5rem 1rem',
                fontSize: '0.9375rem',
                fontWeight: '600',
                color: 'var(--text-primary)'
              }}>
                Trang {currentPage} / {Math.ceil(filteredData.length / itemsPerPage)}
              </span>

              <button
                onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredData.length / itemsPerPage), prev + 1))}
                disabled={currentPage >= Math.ceil(filteredData.length / itemsPerPage)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: currentPage >= Math.ceil(filteredData.length / itemsPerPage) ? 'var(--border-color)' : 'var(--primary-color)',
                  color: 'white',
                  cursor: currentPage >= Math.ceil(filteredData.length / itemsPerPage) ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '600'
                }}
              >
                Sau ▶️
              </button>

              <button
                onClick={() => setCurrentPage(Math.ceil(filteredData.length / itemsPerPage))}
                disabled={currentPage >= Math.ceil(filteredData.length / itemsPerPage)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: currentPage >= Math.ceil(filteredData.length / itemsPerPage) ? 'var(--border-color)' : 'var(--primary-color)',
                  color: 'white',
                  cursor: currentPage >= Math.ceil(filteredData.length / itemsPerPage) ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '600'
                }}
              >
                Cuối ⏭️
              </button>
            </div>
          )}
        </>
        )}
      </div>

      {showForm && (
        <AdminForm
          key={editingItem?.id || 'new'} // Force re-render when switching between edit/new
          type={activeTab}
          item={editingItem}
          courses={courses}
          lessons={lessons}
          onSave={editingItem ? (id: string, data: any) => handleUpdate(id, data) : handleCreate}
          onCancel={() => {
            setShowForm(false);
            setEditingItem(null);
          }}
        />
      )}
    </div>
  );
};

// Comprehensive Admin Form
const AdminForm = ({ type, item, courses, lessons, onSave, onCancel }: any) => {
  // Initialize formData properly to avoid duplication
  const initializeFormData = () => {
    if (item) {
      // When editing, create a deep copy to avoid reference issues
      const baseData = JSON.parse(JSON.stringify(item));
      
      // Handle examples for grammar - remove duplicates
      if (type === 'grammar' && baseData.examples) {
        if (Array.isArray(baseData.examples)) {
          // Use Set to track seen examples by id or content
          const seen = new Set<string>();
          baseData.examples = baseData.examples.filter((ex: any) => {
            // Create unique key from id or content
            const key = ex.id 
              ? `id_${ex.id}` 
              : `content_${(ex.japanese || '').trim()}_${(ex.translation || '').trim()}`;
            
            if (seen.has(key)) {
              return false; // Duplicate, remove it
            }
            seen.add(key);
            return true;
          });
        } else {
          baseData.examples = [];
        }
      }
      
      // Handle examples for kanji - remove duplicates
      if (type === 'kanji' && baseData.examples) {
        if (Array.isArray(baseData.examples)) {
          const seen = new Set<string>();
          baseData.examples = baseData.examples.filter((ex: any) => {
            const key = ex.id 
              ? `id_${ex.id}` 
              : `content_${(ex.word || '').trim()}_${(ex.meaning || '').trim()}`;
            
            if (seen.has(key)) {
              return false; // Duplicate, remove it
            }
            seen.add(key);
            return true;
          });
        } else {
          baseData.examples = [];
        }
      }
      
      return baseData;
    }
    return getDefaultFormData(type);
  };

  const [formData, setFormData] = useState<any>(() => initializeFormData());
  const [importMode, setImportMode] = useState<'single' | 'batch'>('single');
  const [batchText, setBatchText] = useState('');
  const [batchPreview, setBatchPreview] = useState<any[]>([]);
  const [batchError, setBatchError] = useState<string | null>(null);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [aiJsonText, setAiJsonText] = useState(''); // ô dán JSON từ AI
  const [aiJsonStatus, setAiJsonStatus] = useState<string | null>(null); // trạng thái parse JSON

  // Check if this type supports batch import
  const supportsBatchImport = type === 'vocabulary' || type === 'kanji' || type === 'grammar' || type === 'games';

  // Reset formData when item changes (when switching between edit/new or different items)
  useEffect(() => {
    const newFormData = initializeFormData();
    setFormData(newFormData);
    
    if (item) {
      // Editing mode - always single
      setImportMode('single');
      setBatchText('');
      setBatchPreview([]);
      setBatchError(null);
      setAiJsonText('');
      setAiJsonStatus(null);
    } else if (supportsBatchImport) {
      // New item with batch support - default to single
      setImportMode('single');
      setBatchText('');
      setBatchPreview([]);
      setBatchError(null);
      setAiJsonText('');
      setAiJsonStatus(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id, type]); // Only depend on item.id, not the whole item object

  // Parse JSON từ AI và đổ vào form tương ứng
  const handleParseAiJson = () => {
    if (!aiJsonText.trim()) {
      // showToast('Vui lòng dán JSON trước.', 'warning');
      console.warn('Vui lòng dán JSON trước.');
      return;
    }
    let json: any;
    try {
      json = JSON.parse(aiJsonText);
    } catch (e) {
      // showToast('JSON không hợp lệ. Hãy kiểm tra lại (không được có text ngoài JSON).', 'error');
      console.error('JSON không hợp lệ.');
      return;
    }

    try {
      setAiJsonStatus(null);
      switch (type as TabType) {
        case 'listening': {
          const questions =
            Array.isArray(json.questions) && json.questions.length
              ? json.questions.map((q: any) => ({
                  question: q.question || '',
                  options: Array.isArray(q.options) ? q.options.slice(0, 4) : [],
                  correct_answer:
                    typeof q.correct_answer === 'number' && q.correct_answer >= 0 && q.correct_answer <= 3
                      ? q.correct_answer
                      : 0,
                }))
              : [];
          setFormData({
            ...formData,
            title: json.title || formData.title,
            transcript: json.transcript || formData.transcript,
            questions,
          });
          setAiJsonStatus('Đã parse JSON bài nghe vào form.');
          break;
        }
        case 'roleplay': {
          setFormData({
            ...formData,
            title: json.title || formData.title,
            description: json.description || formData.description,
            scenario: json.scenario || formData.scenario,
            character_a: json.character_a || formData.character_a,
            character_b: json.character_b || formData.character_b,
            character_a_script: Array.isArray(json.character_a_script)
              ? json.character_a_script
              : formData.character_a_script || [],
            character_b_script: Array.isArray(json.character_b_script)
              ? json.character_b_script
              : formData.character_b_script || [],
            vocabulary_hints: Array.isArray(json.vocabulary_hints)
              ? json.vocabulary_hints
              : formData.vocabulary_hints || [],
            grammar_points: Array.isArray(json.grammar_points)
              ? json.grammar_points
              : formData.grammar_points || [],
            difficulty: json.difficulty || formData.difficulty || 'easy',
            image_url: json.image_url || formData.image_url,
          });
          setAiJsonStatus('Đã parse JSON roleplay vào form.');
          break;
        }
        case 'games': {
          // JSON 1 câu game sắp xếp câu
          setFormData({
            ...formData,
            sentence: json.sentence || formData.sentence,
            translation: json.translation || formData.translation,
            words: Array.isArray(json.words) ? json.words : formData.words || [],
            correct_order: Array.isArray(json.correct_order) ? json.correct_order : formData.correct_order || [],
            hint: json.hint || formData.hint,
          });
          setAiJsonStatus('Đã parse JSON game sắp xếp câu vào form.');
          break;
        }
        default: {
          showToast('Loại này hiện chỉ hỗ trợ import dạng text/batch, chưa hỗ trợ JSON tự parse.', 'info');
          break;
        }
      }
    } catch (e) {
      logger.error('Parse AI JSON error', e);
      showToast('Có lỗi khi áp dụng JSON vào form. Hãy kiểm tra lại cấu trúc.', 'error');
    }
  };

  // Hướng dẫn prompt JSON cho AI theo từng chức năng (chỉ hiển thị khi tạo mới)
  const renderAIPromptHint = () => {
    if (item) return null;

    switch (type as TabType) {
      case 'vocabulary':
        return (
          <div className="form-group">
            <label>Hướng dẫn JSON/format cho AI (Từ vựng)</label>
            <div className="format-hint" style={{ lineHeight: 1.6 }}>
              Gợi ý có thể gửi cho AI:
              <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.8rem', marginTop: '0.5rem', background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: '8px', color: 'var(--text-primary)' }}>{`Hãy tạo một danh sách từ vựng tiếng Nhật trình độ N5.
- Trả về dạng text, mỗi dòng một từ.
- Không giải thích thêm.
- Format mỗi dòng:
  kanji=hiragana=nghĩa_tiếng_Việt
  hoặc nếu không có kanji: hiragana=nghĩa_tiếng_Việt

Ví dụ:
学生=がくせい=sinh viên
先生=せんせい=giáo viên
ありがとう=ありがとう=cảm ơn`}</pre>
              Sau đó copy toàn bộ và dán vào ô import hàng loạt từ vựng.
            </div>
          </div>
        );
      case 'kanji':
        return (
          <div className="form-group">
            <label>Hướng dẫn JSON/format cho AI (Kanji)</label>
            <div className="format-hint" style={{ lineHeight: 1.6 }}>
              Gợi ý:
              <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.8rem', marginTop: '0.5rem', background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: '8px', color: 'var(--text-primary)' }}>{`Hãy liệt kê một số kanji trình độ N5 liên quan tới chủ đề tôi đưa.
- Trả về dạng text, mỗi dòng một kanji.
- Không giải thích thêm.
- Format mỗi dòng:
  kanji=nghĩa
  hoặc:
  kanji=nghĩa=onyomi1|onyomi2=kunyomi1|kunyomi2=số_nét

Ví dụ:
学=Học
校=Trường học
先=Trước, đầu tiên=セン|=さき=6`}</pre>
              Copy kết quả và dán vào ô import hàng loạt Kanji.
            </div>
          </div>
        );
      case 'grammar':
        return (
          <div className="form-group">
            <label>Hướng dẫn JSON/format cho AI (Ngữ pháp)</label>
            <div className="format-hint" style={{ lineHeight: 1.6 }}>
              Gợi ý:
              <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.8rem', marginTop: '0.5rem', background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: '8px', color: 'var(--text-primary)' }}>{`Hãy liệt kê các mẫu ngữ pháp tiếng Nhật trình độ N5 cho chủ đề tôi đưa.
- Trả về dạng text, mỗi dòng một mẫu.
- Không giải thích thêm.
- Format mỗi dòng:
  pattern=nghĩa_tiếng_Việt
  hoặc:
  pattern=nghĩa_tiếng_Việt=giải_thích_ngắn

Ví dụ:
〜たいです=Muốn làm gì đó=Diễn tả mong muốn của người nói
〜てください=Hãy làm gì đó=Dùng khi nhờ vả lịch sự`}</pre>
              Dán vào import hàng loạt Ngữ pháp.
            </div>
          </div>
        );
      case 'listening':
        return (
          <div className="form-group">
            <label>Hướng dẫn JSON cho AI (Bài nghe + câu hỏi)</label>
            <div className="format-hint" style={{ lineHeight: 1.6 }}>
              Gợi ý:
              <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.8rem', marginTop: '0.5rem', background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: '8px', color: 'var(--text-primary)' }}>{`Hãy tạo một bài nghe tiếng Nhật trình độ N5.
- Trả về JSON, không giải thích thêm.
- Không cần audio_url (tôi sẽ upload sau), chỉ cần transcript và câu hỏi.
- Cấu trúc JSON:
{
  "title": "Tiêu đề bài nghe",
  "transcript": "Transcript tiếng Nhật (có thể xuống dòng)",
  "questions": [
    {
      "question": "Câu hỏi tiếng Việt hoặc Nhật",
      "options": ["Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D"],
      "correct_answer": 0
    }
  ]
}`}</pre>
              Bạn có thể copy `title`, `transcript` và từng câu hỏi (A/B/C/D + đáp án đúng) vào form Nghe.
            </div>
          </div>
        );
      case 'games':
        return (
          <div className="form-group">
            <label>Hướng dẫn JSON/format cho AI (Game sắp xếp câu)</label>
            <div className="format-hint" style={{ lineHeight: 1.6 }}>
              Gợi ý 1 (dạng text để import hàng loạt):
              <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.8rem', marginTop: '0.5rem', background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: '8px', color: 'var(--text-primary)' }}>{`Hãy tạo các câu ví dụ tiếng Nhật trình độ N5, đã được tách sẵn từng từ bằng khoảng trắng.
- Trả về dạng text, mỗi dòng:
  câu_tiếng_Nhật_đã_tách=nghĩa_tiếng_Việt
Ví dụ:
私 は 学生 です=Tôi là học sinh
これは 本 です=Đây là quyển sách`}</pre>
              Gợi ý 2 (JSON chi tiết cho từng câu):
              <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.8rem', marginTop: '0.5rem', background: '#f9fafb', padding: '0.75rem', borderRadius: '8px' }}>{`{
  "sentence": "私 は 学生 です",
  "translation": "Tôi là học sinh",
  "words": ["私", "は", "学生", "です"],
  "correct_order": [0, 1, 2, 3],
  "hint": "Tôi là học sinh"
}`}</pre>
              Bạn có thể dùng JSON để tham khảo, hoặc dùng dạng text để import hàng loạt.
            </div>
          </div>
        );
      case 'roleplay':
        return (
          <div className="form-group">
            <label>Hướng dẫn JSON cho AI (Roleplay)</label>
            <div className="format-hint" style={{ lineHeight: 1.6 }}>
              Gợi ý gửi cho AI:
              <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.8rem', marginTop: '0.5rem', background: '#f9fafb', padding: '0.75rem', borderRadius: '8px' }}>{`Hãy tạo 1 kịch bản hội thoại roleplay tiếng Nhật trình độ N5.
- Trả về đúng JSON, không giải thích thêm.
- Không dùng markdown, chỉ JSON thuần.
- Giữ nguyên tên các key:
{
  "title": "Tiêu đề kịch bản",
  "description": "Mô tả ngắn (tiếng Việt hoặc Nhật)",
  "scenario": "Mô tả tình huống roleplay",
  "character_a": "Tên nhân vật A",
  "character_b": "Tên nhân vật B",
  "character_a_script": [
    "Câu 1 của nhân vật A bằng tiếng Nhật",
    "Câu 2 của nhân vật A bằng tiếng Nhật"
  ],
  "character_b_script": [
    "Câu 1 của nhân vật B bằng tiếng Nhật",
    "Câu 2 của nhân vật B bằng tiếng Nhật"
  ],
  "vocabulary_hints": [
    "từ vựng 1 - nghĩa tiếng Việt",
    "từ vựng 2 - nghĩa tiếng Việt"
  ],
  "grammar_points": [
    "mẫu ngữ pháp 1",
    "mẫu ngữ pháp 2"
  ],
  "difficulty": "easy",
  "image_url": ""
}`}</pre>
              Sau khi AI trả JSON, copy nội dung các field vào form Roleplay tương ứng.
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  function getDefaultFormData(type: TabType) {
    switch (type) {
      case 'courses':
        return { level: 'N5', title: '', description: '' };
      case 'lessons':
        return { course_id: '', title: '', lesson_number: 1, description: '', level: 'N5' };
      case 'vocabulary':
        return { lesson_id: '', word: '', kanji: '', hiragana: '', meaning: '', example: '', example_translation: '', difficulty: 'easy', is_difficult: false, language: 'japanese' };
      case 'kanji':
        return { lesson_id: '', character: '', meaning: '', onyomi: [], kunyomi: [], stroke_count: 0, examples: [] };
      case 'grammar':
        return { lesson_id: '', pattern: '', meaning: '', explanation: '', examples: [], language: 'japanese' };
      case 'listening':
        return { lesson_id: '', title: '', audio_url: '', image_url: '', transcript: '', questions: [], language: 'japanese' };
      case 'games':
        return { lesson_id: '', sentence: '', translation: '', words: [], correct_order: [], hint: '', language: 'japanese' };
      case 'roleplay':
        return { 
          lesson_id: '', 
          title: '', 
          description: '', 
          scenario: '', 
          character_a: '', 
          character_b: '', 
          character_a_script: [], 
          character_b_script: [],
          character_a_correct_answers: [],
          character_b_correct_answers: [],
          vocabulary_hints: [], 
          grammar_points: [], 
          difficulty: 'easy',
          image_url: '',
          enable_scoring: false,
          language: 'japanese'
        };
      default:
        return {};
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Handle batch import for vocabulary
    if (type === 'vocabulary' && importMode === 'batch' && !item) {
      if (!formData.lesson_id) {
        showToast('Vui lòng chọn bài học', 'warning');
        return;
      }
      
      if (batchPreview.length === 0) {
        showToast('Vui lòng nhập từ vựng', 'warning');
        return;
      }

      if (batchError) {
        showToast('Vui lòng sửa lỗi trước khi lưu', 'warning');
        return;
      }

      // Convert preview to form data format
      const batchData = batchPreview.map(vocab => ({
        lesson_id: formData.lesson_id,
        word: vocab.word,
        kanji: vocab.kanji,
        hiragana: vocab.hiragana,
        meaning: vocab.meaning,
        difficulty: formData.difficulty || 'easy',
        is_difficult: false,
        language: formData.language || 'japanese',
      }));

      onSave(batchData);
      return;
    }

    // Handle batch import for kanji
    if (type === 'kanji' && importMode === 'batch' && !item) {
      if (!formData.lesson_id) {
        alert('Vui lòng chọn bài học');
        return;
      }
      
      if (batchPreview.length === 0) {
        alert('Vui lòng nhập kanji');
        return;
      }

      if (batchError) {
        alert('Vui lòng sửa lỗi trước khi lưu');
        return;
      }

      // Convert preview to form data format
      const batchData = batchPreview.map(kanji => ({
        lesson_id: formData.lesson_id,
        character: kanji.character,
        meaning: kanji.meaning,
        onyomi: kanji.onyomi || [],
        kunyomi: kanji.kunyomi || [],
        stroke_count: kanji.stroke_count,
      }));

      onSave(batchData);
      return;
    }

    // Handle batch import for grammar
    if (type === 'grammar' && importMode === 'batch' && !item) {
      if (!formData.lesson_id) {
        alert('Vui lòng chọn bài học');
        return;
      }
      
      if (batchPreview.length === 0) {
        alert('Vui lòng nhập ngữ pháp');
        return;
      }

      if (batchError) {
        alert('Vui lòng sửa lỗi trước khi lưu');
        return;
      }

      // Convert preview to form data format
      const batchData = batchPreview.map(grammar => ({
        lesson_id: formData.lesson_id,
        pattern: grammar.pattern,
        meaning: grammar.meaning,
        explanation: grammar.explanation || '',
      }));

      onSave(batchData);
      return;
    }

    // Handle batch import for sentence games (sắp xếp câu)
    if (type === 'games' && importMode === 'batch' && !item) {
      if (!formData.lesson_id) {
        alert('Vui lòng chọn bài học');
        return;
      }

      if (batchPreview.length === 0) {
        alert('Vui lòng nhập danh sách câu');
        return;
      }

      if (batchError) {
        alert('Vui lòng sửa lỗi trước khi lưu');
        return;
      }

      const batchData = batchPreview.map((game) => ({
        lesson_id: formData.lesson_id,
        sentence: game.sentence,
        translation: game.translation,
        words: game.words,
        correct_order: game.correct_order,
        hint: '',
      }));

      onSave(batchData);
      return;
    }
    
    // Process form data based on type
    let processedData = { ...formData };
    
    if (type === 'kanji' && typeof formData.onyomi === 'string') {
      processedData.onyomi = formData.onyomi.split(',').map((s: string) => s.trim()).filter(Boolean);
    }
    if (type === 'kanji' && typeof formData.kunyomi === 'string') {
      processedData.kunyomi = formData.kunyomi.split(',').map((s: string) => s.trim()).filter(Boolean);
    }
    if (type === 'games' && typeof formData.words === 'string') {
      processedData.words = formData.words.split(',').map((s: string) => s.trim()).filter(Boolean);
    }
    if (type === 'games' && typeof formData.correct_order === 'string') {
      processedData.correct_order = formData.correct_order.split(',').map((s: string) => parseInt(s.trim())).filter((n: number) => !isNaN(n));
    }
    if (type === 'roleplay' && typeof formData.character_a_script === 'string') {
      processedData.character_a_script = formData.character_a_script.split('\n').map((s: string) => s.trim()).filter(Boolean);
    }
    if (type === 'roleplay' && typeof formData.character_b_script === 'string') {
      processedData.character_b_script = formData.character_b_script.split('\n').map((s: string) => s.trim()).filter(Boolean);
    }
    if (type === 'roleplay' && typeof formData.vocabulary_hints === 'string') {
      processedData.vocabulary_hints = formData.vocabulary_hints.split(',').map((s: string) => s.trim()).filter(Boolean);
    }
    if (type === 'roleplay' && typeof formData.grammar_points === 'string') {
      processedData.grammar_points = formData.grammar_points.split(',').map((s: string) => s.trim()).filter(Boolean);
    }

    if (item) {
      onSave(item.id, processedData);
    } else {
      onSave(processedData);
    }
  };

  const addExample = (type: 'kanji' | 'grammar') => {
    if (type === 'kanji') {
      setFormData({
        ...formData,
        examples: [...(formData.examples || []), { word: '', reading: '', meaning: '' }]
      });
    } else {
      setFormData({
        ...formData,
        examples: [...(formData.examples || []), { japanese: '', romaji: '', translation: '' }]
      });
    }
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>{item ? 'Sửa' : 'Thêm mới'} {getTypeLabel(type)}</h2>
        <form onSubmit={handleSubmit}>
          {renderAIPromptHint()}
          {type === 'courses' && (
            <>
              <div className="form-group">
                <label>Ngôn ngữ *</label>
                <select
                  value={formData.language || 'japanese'}
                  onChange={(e) => {
                    const newLanguage = e.target.value;
                    setFormData({ 
                      ...formData, 
                      language: newLanguage,
                      level: newLanguage === 'japanese' ? 'N5' : 'HSK1'
                    });
                  }}
                  required
                >
                  <option value="japanese">🇯🇵 Tiếng Nhật</option>
                  <option value="chinese">🇨🇳 Tiếng Trung</option>
                </select>
              </div>
              <div className="form-group">
                <label>Cấp độ *</label>
                <select
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                  required
                >
                  {(formData.language === 'chinese') ? (
                    <>
                      <option value="HSK1">HSK1</option>
                      <option value="HSK2">HSK2</option>
                      <option value="HSK3">HSK3</option>
                      <option value="HSK4">HSK4</option>
                      <option value="HSK5">HSK5</option>
                      <option value="HSK6">HSK6</option>
                    </>
                  ) : (
                    <>
                      <option value="N5">N5</option>
                      <option value="N4">N4</option>
                      <option value="N3">N3</option>
                      <option value="N2">N2</option>
                      <option value="N1">N1</option>
                    </>
                  )}
                </select>
              </div>
              <div className="form-group">
                <label>Tiêu đề *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Mô tả</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
            </>
          )}

          {type === 'lessons' && (
            <>
              <div className="form-group">
                <label>Ngôn ngữ *</label>
                <select
                  value={formData.language || 'japanese'}
                  onChange={(e) => {
                    const newLanguage = e.target.value;
                    setFormData({ 
                      ...formData, 
                      language: newLanguage,
                      level: newLanguage === 'japanese' ? 'N5' : 'HSK1',
                      course_id: '' // Reset course selection when language changes
                    });
                  }}
                  required
                >
                  <option value="japanese">🇯🇵 Tiếng Nhật</option>
                  <option value="chinese">🇨🇳 Tiếng Trung</option>
                </select>
              </div>
              <div className="form-group">
                <label>Khóa học *</label>
                <select
                  value={formData.course_id}
                  onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
                  required
                >
                  <option value="">Chọn khóa học</option>
                  {courses
                    .filter((c: any) => c.language === (formData.language || 'japanese'))
                    .map((c: any) => (
                      <option key={c.id} value={c.id}>{c.title} ({c.level})</option>
                    ))}
                </select>
              </div>
              <div className="form-group">
                <label>Tiêu đề *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Số bài *</label>
                <input
                  type="number"
                  value={formData.lesson_number}
                  onChange={(e) => setFormData({ ...formData, lesson_number: parseInt(e.target.value) })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Cấp độ *</label>
                <select
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                  required
                >
                  {(formData.language === 'chinese') ? (
                    <>
                      <option value="HSK1">HSK1</option>
                      <option value="HSK2">HSK2</option>
                      <option value="HSK3">HSK3</option>
                      <option value="HSK4">HSK4</option>
                      <option value="HSK5">HSK5</option>
                      <option value="HSK6">HSK6</option>
                    </>
                  ) : (
                    <>
                      <option value="N5">N5</option>
                      <option value="N4">N4</option>
                      <option value="N3">N3</option>
                      <option value="N2">N2</option>
                      <option value="N1">N1</option>
                    </>
                  )}
                </select>
              </div>
              <div className="form-group">
                <label>Mô tả</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
            </>
          )}

          {type === 'vocabulary' && !item && (
            <div className="form-group">
              <label>Chế độ thêm</label>
              <div className="import-mode-selector">
                <button
                  type="button"
                  className={`mode-btn ${importMode === 'single' ? 'active' : ''}`}
                  onClick={() => {
                    setImportMode('single');
                    setBatchText('');
                    setBatchPreview([]);
                    setBatchError(null);
                  }}
                >
                  ➕ Thêm từng từ
                </button>
                <button
                  type="button"
                  className={`mode-btn ${importMode === 'batch' ? 'active' : ''}`}
                  onClick={() => {
                    setImportMode('batch');
                    setFormData({ ...formData, word: '', kanji: '', hiragana: '', meaning: '' });
                  }}
                >
                  📋 Import hàng loạt
                </button>
              </div>
            </div>
          )}

          {type === 'vocabulary' && importMode === 'single' && (
            <>
              <div className="form-group">
                <label>Ngôn ngữ *</label>
                <select
                  value={formData.language || 'japanese'}
                  onChange={(e) => {
                    const newLanguage = e.target.value as 'japanese' | 'chinese';
                    setFormData({ 
                      ...formData, 
                      language: newLanguage,
                      lesson_id: '' // Reset lesson when language changes
                    });
                  }}
                  required
                >
                  <option value="japanese">🇯🇵 Tiếng Nhật</option>
                  <option value="chinese">🇨🇳 Tiếng Trung</option>
                </select>
              </div>
              <div className="form-group">
                <label>Bài học *</label>
                <select
                  value={formData.lesson_id}
                  onChange={(e) => setFormData({ ...formData, lesson_id: e.target.value })}
                  required
                >
                  <option value="">Chọn bài học</option>
                  {lessons
                    .filter((l: any) => {
                      // Filter lessons by language
                      const lessonCourse = courses.find((c: any) => c.id === l.course_id);
                      return lessonCourse?.language === (formData.language || 'japanese');
                    })
                    .map((l: any) => {
                      const course = courses.find((c: any) => c.id === l.course_id);
                      return (
                        <option key={l.id} value={l.id}>
                          {course ? `[${course.title} - ${course.level}] ${l.title}` : l.title}
                        </option>
                      );
                    })}
                </select>
              </div>
              
              {formData.language === 'chinese' ? (
                <>
                  <div className="form-group">
                    <label>Hán tự giản thể (简体) *</label>
                    <input
                      type="text"
                      value={formData.word}
                      onChange={(e) => setFormData({ ...formData, word: e.target.value })}
                      required
                      placeholder="你好"
                    />
                  </div>
                  <div className="form-group">
                    <label>Hán tự phồn thể (繁體)</label>
                    <input
                      type="text"
                      value={formData.kanji || ''}
                      onChange={(e) => setFormData({ ...formData, kanji: e.target.value })}
                      placeholder="你好 (để trống nếu giống giản thể)"
                    />
                  </div>
                  <div className="form-group">
                    <label>Pinyin (拼音) *</label>
                    <input
                      type="text"
                      value={formData.hiragana}
                      onChange={(e) => setFormData({ ...formData, hiragana: e.target.value })}
                      required
                      placeholder="nǐ hǎo"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="form-group">
                    <label>Từ (Hiragana) *</label>
                    <input
                      type="text"
                      value={formData.word}
                      onChange={(e) => setFormData({ ...formData, word: e.target.value })}
                      required
                      placeholder="こんにちは"
                    />
                  </div>
                  <div className="form-group">
                    <label>Kanji (漢字)</label>
                    <input
                      type="text"
                      value={formData.kanji || ''}
                      onChange={(e) => setFormData({ ...formData, kanji: e.target.value })}
                      placeholder="今日は"
                    />
                  </div>
                  <div className="form-group">
                    <label>Hiragana (ひらがな) *</label>
                    <input
                      type="text"
                      value={formData.hiragana}
                      onChange={(e) => setFormData({ ...formData, hiragana: e.target.value })}
                      required
                      placeholder="こんにちは"
                    />
                  </div>
                </>
              )}
              
              <div className="form-group">
                <label>Nghĩa *</label>
                <input
                  type="text"
                  value={formData.meaning}
                  onChange={(e) => setFormData({ ...formData, meaning: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Ví dụ</label>
                <input
                  type="text"
                  value={formData.example || ''}
                  onChange={(e) => setFormData({ ...formData, example: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Dịch ví dụ</label>
                <input
                  type="text"
                  value={formData.example_translation || ''}
                  onChange={(e) => setFormData({ ...formData, example_translation: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Độ khó</label>
                <select
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                >
                  <option value="easy">Dễ</option>
                  <option value="medium">Trung bình</option>
                  <option value="hard">Khó</option>
                </select>
              </div>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.is_difficult || false}
                    onChange={(e) => setFormData({ ...formData, is_difficult: e.target.checked })}
                  />
                  Từ vựng khó
                </label>
              </div>
            </>
          )}

          {type === 'vocabulary' && importMode === 'batch' && (
            <>
              <div className="form-group">
                <label>Ngôn ngữ *</label>
                <select
                  value={formData.language || 'japanese'}
                  onChange={(e) => {
                    const newLanguage = e.target.value as 'japanese' | 'chinese';
                    setFormData({ 
                      ...formData, 
                      language: newLanguage,
                      lesson_id: '' // Reset lesson when language changes
                    });
                  }}
                  required
                >
                  <option value="japanese">🇯🇵 Tiếng Nhật</option>
                  <option value="chinese">🇨🇳 Tiếng Trung</option>
                </select>
              </div>
              <div className="form-group">
                <label>Bài học *</label>
                <select
                  value={formData.lesson_id}
                  onChange={(e) => setFormData({ ...formData, lesson_id: e.target.value })}
                  required
                >
                  <option value="">Chọn bài học</option>
                  {lessons
                    .filter((l: any) => {
                      // Filter lessons by language
                      const lessonCourse = courses.find((c: any) => c.id === l.course_id);
                      return lessonCourse?.language === (formData.language || 'japanese');
                    })
                    .map((l: any) => {
                      const course = courses.find((c: any) => c.id === l.course_id);
                      return (
                        <option key={l.id} value={l.id}>
                          {course ? `[${course.title} - ${course.level}] ${l.title}` : l.title}
                        </option>
                      );
                    })}
                </select>
              </div>
              <div className="form-group">
                <label>
                  Nhập từ vựng (mỗi dòng một từ) *
                  <span className="format-hint">
                    {formData.language === 'chinese' ? (
                      <>Format: <code>hanzi=pinyin=nghĩa</code> hoặc <code>hanzi_phồn_thể=hanzi_giản_thể=pinyin=nghĩa</code></>
                    ) : (
                      <>Format: <code>kanji=hiragana=nghĩa</code> hoặc <code>hiragana=nghĩa</code></>
                    )}
                  </span>
                </label>
                <textarea
                  className="batch-input"
                  value={batchText}
                  onChange={(e) => {
                    setBatchText(e.target.value);
                    const { vocabularies, errors } = parseVocabularyBatch(e.target.value);
                    setBatchPreview(vocabularies);
                    setBatchError(errors.length > 0 ? errors.join('\n') : null);
                  }}
                  placeholder={formData.language === 'chinese' ? 
                    `你好=nǐ hǎo=Xin chào
谢谢=xiè xie=Cảm ơn
再见=zài jiàn=Tạm biệt
学习=xué xí=Học tập` :
                    `私=わたし=Tôi
学生=がくせい=Học sinh
こんにちは=Xin chào (ban ngày)
はじめまして=Lần đầu gặp mặt`}
                  rows={10}
                  required
                />
                <div className="format-example">
                  <strong>Ví dụ {formData.language === 'chinese' ? 'tiếng Trung' : 'tiếng Nhật'}:</strong>
                  <pre>{formData.language === 'chinese' ? 
                    `你好=nǐ hǎo=Xin chào
谢谢=xiè xie=Cảm ơn
再见=zài jiàn=Tạm biệt
学习=xué xí=Học tập` :
                    `私=わたし=Tôi
学生=がくせい=Học sinh
こんにちは=Xin chào
はじめまして=Lần đầu gặp mặt`}</pre>
                </div>
              </div>

              {batchError && (
                <div className="error-message">
                  <strong>⚠️ Lỗi:</strong>
                  <pre>{batchError}</pre>
                </div>
              )}

              {batchPreview.length > 0 && !batchError && (
                <div className="batch-preview">
                  <div className="preview-header">
                    <strong>✅ Preview ({batchPreview.length} từ vựng):</strong>
                  </div>
                  <div className="preview-list">
                    {batchPreview.map((vocab, idx) => (
                      <div key={idx} className="preview-item">
                        <span className="preview-kanji">
                          {formData.language === 'chinese' ? 
                            (vocab.kanji ? `${vocab.kanji} / ${vocab.word}` : vocab.word) : 
                            (vocab.kanji || '-')}
                        </span>
                        <span className="preview-hiragana">
                          {formData.language === 'chinese' ? vocab.hiragana : vocab.hiragana}
                        </span>
                        <span className="preview-meaning">{vocab.meaning}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>Độ khó mặc định</label>
                <select
                  value={formData.difficulty || 'easy'}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                >
                  <option value="easy">Dễ</option>
                  <option value="medium">Trung bình</option>
                  <option value="hard">Khó</option>
                </select>
              </div>
            </>
          )}

          {type === 'vocabulary' && item && (
            <>
              <div className="form-group">
                <label>Bài học *</label>
                <select
                  value={formData.lesson_id}
                  onChange={(e) => setFormData({ ...formData, lesson_id: e.target.value })}
                  required
                >
                  <option value="">Chọn bài học</option>
                  {lessons.map((l: any) => {
                    const course = courses.find((c: any) => c.id === l.course_id);
                    return (
                      <option key={l.id} value={l.id}>
                        {course ? `[${course.title} - ${course.level}] ${l.title}` : l.title}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div className="form-group">
                <label>Từ (Hiragana) *</label>
                <input
                  type="text"
                  value={formData.word}
                  onChange={(e) => setFormData({ ...formData, word: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Kanji</label>
                <input
                  type="text"
                  value={formData.kanji || ''}
                  onChange={(e) => setFormData({ ...formData, kanji: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Hiragana *</label>
                <input
                  type="text"
                  value={formData.hiragana}
                  onChange={(e) => setFormData({ ...formData, hiragana: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Nghĩa *</label>
                <input
                  type="text"
                  value={formData.meaning}
                  onChange={(e) => setFormData({ ...formData, meaning: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Ví dụ</label>
                <input
                  type="text"
                  value={formData.example || ''}
                  onChange={(e) => setFormData({ ...formData, example: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Dịch ví dụ</label>
                <input
                  type="text"
                  value={formData.example_translation || ''}
                  onChange={(e) => setFormData({ ...formData, example_translation: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Độ khó</label>
                <select
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                >
                  <option value="easy">Dễ</option>
                  <option value="medium">Trung bình</option>
                  <option value="hard">Khó</option>
                </select>
              </div>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.is_difficult || false}
                    onChange={(e) => setFormData({ ...formData, is_difficult: e.target.checked })}
                  />
                  Từ vựng khó
                </label>
              </div>
            </>
          )}

          {type === 'kanji' && !item && (
            <div className="form-group">
              <label>Chế độ thêm</label>
              <div className="import-mode-selector">
                <button
                  type="button"
                  className={`mode-btn ${importMode === 'single' ? 'active' : ''}`}
                  onClick={() => {
                    setImportMode('single');
                    setBatchText('');
                    setBatchPreview([]);
                    setBatchError(null);
                  }}
                >
                  ➕ Thêm từng kanji
                </button>
                <button
                  type="button"
                  className={`mode-btn ${importMode === 'batch' ? 'active' : ''}`}
                  onClick={() => {
                    setImportMode('batch');
                    setFormData({ ...formData, character: '', meaning: '', onyomi: [], kunyomi: [] });
                  }}
                >
                  📋 Import hàng loạt
                </button>
              </div>
            </div>
          )}

          {type === 'kanji' && importMode === 'single' && (
            <>
              <div className="form-group">
                <label>Bài học *</label>
                <select
                  value={formData.lesson_id}
                  onChange={(e) => setFormData({ ...formData, lesson_id: e.target.value })}
                  required
                >
                  <option value="">Chọn bài học</option>
                  {lessons.map((l: any) => {
                    const course = courses.find((c: any) => c.id === l.course_id);
                    return (
                      <option key={l.id} value={l.id}>
                        {course ? `[${course.title} - ${course.level}] ${l.title}` : l.title}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div className="form-group">
                <label>Kanji *</label>
                <input
                  type="text"
                  value={formData.character}
                  onChange={(e) => setFormData({ ...formData, character: e.target.value })}
                  required
                  maxLength={1}
                />
              </div>
              <div className="form-group">
                <label>Nghĩa *</label>
                <input
                  type="text"
                  value={formData.meaning}
                  onChange={(e) => setFormData({ ...formData, meaning: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Âm On (音読み) - cách nhau bằng dấu phẩy</label>
                <input
                  type="text"
                  value={Array.isArray(formData.onyomi) ? formData.onyomi.join(', ') : formData.onyomi || ''}
                  onChange={(e) => setFormData({ ...formData, onyomi: e.target.value })}
                  placeholder="シ, ジ"
                />
              </div>
              <div className="form-group">
                <label>Âm Kun (訓読み) - cách nhau bằng dấu phẩy</label>
                <input
                  type="text"
                  value={Array.isArray(formData.kunyomi) ? formData.kunyomi.join(', ') : formData.kunyomi || ''}
                  onChange={(e) => setFormData({ ...formData, kunyomi: e.target.value })}
                  placeholder="わたし, わたくし"
                />
              </div>
              <div className="form-group">
                <label>Số nét</label>
                <input
                  type="number"
                  value={formData.stroke_count || 0}
                  onChange={(e) => setFormData({ ...formData, stroke_count: parseInt(e.target.value) })}
                />
              </div>
            </>
          )}

          {type === 'kanji' && importMode === 'batch' && (
            <>
              <div className="form-group">
                <label>Bài học *</label>
                <select
                  value={formData.lesson_id}
                  onChange={(e) => setFormData({ ...formData, lesson_id: e.target.value })}
                  required
                >
                  <option value="">Chọn bài học</option>
                  {lessons.map((l: any) => {
                    const course = courses.find((c: any) => c.id === l.course_id);
                    return (
                      <option key={l.id} value={l.id}>
                        {course ? `[${course.title} - ${course.level}] ${l.title}` : l.title}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div className="form-group">
                <label>
                  Nhập kanji (mỗi dòng một kanji) *
                  <span className="format-hint">
                    Format: <code>kanji=nghĩa</code> hoặc <code>kanji=nghĩa=onyomi|kunyomi=số_nét</code>
                  </span>
                </label>
                <textarea
                  className="batch-input"
                  value={batchText}
                  onChange={(e) => {
                    setBatchText(e.target.value);
                    const { kanjis, errors } = parseKanjiBatch(e.target.value);
                    setBatchPreview(kanjis);
                    setBatchError(errors.length > 0 ? errors.join('\n') : null);
                  }}
                  placeholder={`私=Tôi, riêng tư
学=Học
生=Sinh sống, sống
時=Thời gian, giờ`}
                  rows={10}
                  required
                />
                <div className="format-example">
                  <strong>Ví dụ:</strong>
                  <pre>{`私=Tôi, riêng tư
学=Học
生=Sinh sống, sống
時=Thời gian, giờ

Hoặc với đọc âm:
私=Tôi, riêng tư=シ|わたし=7
学=Học=ガク|まなぶ=8`}</pre>
                </div>
              </div>

              {batchError && (
                <div className="error-message">
                  <strong>⚠️ Lỗi:</strong>
                  <pre>{batchError}</pre>
                </div>
              )}

              {batchPreview.length > 0 && !batchError && (
                <div className="batch-preview">
                  <div className="preview-header">
                    <strong>✅ Preview ({batchPreview.length} kanji):</strong>
                  </div>
                  <div className="preview-list">
                    {batchPreview.map((kanji, idx) => (
                      <div key={idx} className="preview-item kanji-preview-item">
                        <span className="preview-kanji">{kanji.character}</span>
                        <span className="preview-meaning">{kanji.meaning}</span>
                        <div className="preview-details">
                          <div>On: {kanji.onyomi.length > 0 ? kanji.onyomi.join(', ') : '-'}</div>
                          <div>Kun: {kanji.kunyomi.length > 0 ? kanji.kunyomi.join(', ') : '-'}</div>
                          {kanji.stroke_count && <div>Nét: {kanji.stroke_count}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {type === 'kanji' && item && (
            <>
              <div className="form-group">
                <label>Bài học *</label>
                <select
                  value={formData.lesson_id}
                  onChange={(e) => setFormData({ ...formData, lesson_id: e.target.value })}
                  required
                >
                  <option value="">Chọn bài học</option>
                  {lessons.map((l: any) => {
                    const course = courses.find((c: any) => c.id === l.course_id);
                    return (
                      <option key={l.id} value={l.id}>
                        {course ? `[${course.title} - ${course.level}] ${l.title}` : l.title}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div className="form-group">
                <label>Kanji *</label>
                <input
                  type="text"
                  value={formData.character}
                  onChange={(e) => setFormData({ ...formData, character: e.target.value })}
                  required
                  maxLength={1}
                />
              </div>
              <div className="form-group">
                <label>Nghĩa *</label>
                <input
                  type="text"
                  value={formData.meaning}
                  onChange={(e) => setFormData({ ...formData, meaning: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Âm On (音読み) - cách nhau bằng dấu phẩy</label>
                <input
                  type="text"
                  value={Array.isArray(formData.onyomi) ? formData.onyomi.join(', ') : formData.onyomi || ''}
                  onChange={(e) => setFormData({ ...formData, onyomi: e.target.value })}
                  placeholder="シ, ジ"
                />
              </div>
              <div className="form-group">
                <label>Âm Kun (訓読み) - cách nhau bằng dấu phẩy</label>
                <input
                  type="text"
                  value={Array.isArray(formData.kunyomi) ? formData.kunyomi.join(', ') : formData.kunyomi || ''}
                  onChange={(e) => setFormData({ ...formData, kunyomi: e.target.value })}
                  placeholder="わたし, わたくし"
                />
              </div>
              <div className="form-group">
                <label>Số nét</label>
                <input
                  type="number"
                  value={formData.stroke_count || 0}
                  onChange={(e) => setFormData({ ...formData, stroke_count: parseInt(e.target.value) })}
                />
              </div>
            </>
          )}

          {type === 'grammar' && !item && (
            <div className="form-group">
              <label>Chế độ thêm</label>
              <div className="import-mode-selector">
                <button
                  type="button"
                  className={`mode-btn ${importMode === 'single' ? 'active' : ''}`}
                  onClick={() => {
                    setImportMode('single');
                    setBatchText('');
                    setBatchPreview([]);
                    setBatchError(null);
                  }}
                >
                  ➕ Thêm từng mẫu câu
                </button>
                <button
                  type="button"
                  className={`mode-btn ${importMode === 'batch' ? 'active' : ''}`}
                  onClick={() => {
                    setImportMode('batch');
                    setFormData({ ...formData, pattern: '', meaning: '', explanation: '' });
                  }}
                >
                  📋 Import hàng loạt
                </button>
              </div>
            </div>
          )}

          {type === 'grammar' && importMode === 'single' && !item && (
            <>
              <div className="form-group">
                <label>Ngôn ngữ *</label>
                <select
                  value={formData.language || 'japanese'}
                  onChange={(e) => {
                    const newLanguage = e.target.value as 'japanese' | 'chinese';
                    setFormData({ 
                      ...formData, 
                      language: newLanguage,
                      lesson_id: '' // Reset lesson when language changes
                    });
                  }}
                  required
                >
                  <option value="japanese">🇯🇵 Tiếng Nhật</option>
                  <option value="chinese">🇨🇳 Tiếng Trung</option>
                </select>
              </div>
              <div className="form-group">
                <label>Bài học *</label>
                <select
                  value={formData.lesson_id}
                  onChange={(e) => setFormData({ ...formData, lesson_id: e.target.value })}
                  required
                >
                  <option value="">Chọn bài học</option>
                  {lessons
                    .filter((l: any) => {
                      const lessonCourse = courses.find((c: any) => c.id === l.course_id);
                      return lessonCourse?.language === (formData.language || 'japanese');
                    })
                    .map((l: any) => (
                      <option key={l.id} value={l.id}>{l.title}</option>
                    ))}
                </select>
              </div>
              <div className="form-group">
                <label>Mẫu câu *</label>
                <input
                  type="text"
                  value={formData.pattern}
                  onChange={(e) => setFormData({ ...formData, pattern: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Nghĩa *</label>
                <input
                  type="text"
                  value={formData.meaning}
                  onChange={(e) => setFormData({ ...formData, meaning: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Giải thích</label>
                <textarea
                  value={formData.explanation || ''}
                  onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                  rows={3}
                />
              </div>
            </>
          )}

          {type === 'grammar' && importMode === 'batch' && !item && (
            <>
              <div className="form-group">
                <label>Ngôn ngữ *</label>
                <select
                  value={formData.language || 'japanese'}
                  onChange={(e) => {
                    const newLanguage = e.target.value as 'japanese' | 'chinese';
                    setFormData({ 
                      ...formData, 
                      language: newLanguage,
                      lesson_id: '' // Reset lesson when language changes
                    });
                  }}
                  required
                >
                  <option value="japanese">🇯🇵 Tiếng Nhật</option>
                  <option value="chinese">🇨🇳 Tiếng Trung</option>
                </select>
              </div>
              <div className="form-group">
                <label>Bài học *</label>
                <select
                  value={formData.lesson_id}
                  onChange={(e) => setFormData({ ...formData, lesson_id: e.target.value })}
                  required
                >
                  <option value="">Chọn bài học</option>
                  {lessons
                    .filter((l: any) => {
                      const lessonCourse = courses.find((c: any) => c.id === l.course_id);
                      return lessonCourse?.language === (formData.language || 'japanese');
                    })
                    .map((l: any) => {
                      const course = courses.find((c: any) => c.id === l.course_id);
                      return (
                        <option key={l.id} value={l.id}>
                          {course ? `[${course.title} - ${course.level}] ${l.title}` : l.title}
                        </option>
                      );
                    })}
                </select>
              </div>
              <div className="form-group">
                <label>
                  Nhập ngữ pháp (mỗi dòng một mẫu câu) *
                  <span className="format-hint">
                    Format: <code>pattern=nghĩa</code> hoặc <code>pattern=nghĩa=giải_thích</code>
                  </span>
                </label>
                <textarea
                  className="batch-input"
                  value={batchText}
                  onChange={(e) => {
                    setBatchText(e.target.value);
                    const { grammars, errors } = parseGrammarBatch(e.target.value);
                    setBatchPreview(grammars);
                    setBatchError(errors.length > 0 ? errors.join('\n') : null);
                  }}
                  placeholder={`です=Là (cách nói lịch sự)
ます=Động từ thể lịch sự
ません=Phủ định thể lịch sự`}
                  rows={10}
                  required
                />
                <div className="format-example">
                  <strong>Ví dụ:</strong>
                  <pre>{`です=Là (cách nói lịch sự)
ます=Động từ thể lịch sự
ません=Phủ định thể lịch sự`}</pre>
                </div>
              </div>

              {batchError && (
                <div className="error-message">
                  <strong>⚠️ Lỗi:</strong>
                  <pre>{batchError}</pre>
                </div>
              )}

              {batchPreview.length > 0 && !batchError && (
                <div className="batch-preview">
                  <div className="preview-header">
                    <strong>✅ Preview ({batchPreview.length} ngữ pháp):</strong>
                  </div>
                  <div className="preview-list">
                    {batchPreview.map((grammar, idx) => (
                      <div key={idx} className="preview-item grammar-preview-item">
                        <span className="preview-pattern">{grammar.pattern}</span>
                        <span className="preview-meaning">{grammar.meaning}</span>
                        {grammar.explanation && (
                          <span className="preview-explanation">{grammar.explanation}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {type === 'grammar' && item && (
            <>
              <div className="form-group">
                <label>Bài học *</label>
                <select
                  value={formData.lesson_id}
                  onChange={(e) => setFormData({ ...formData, lesson_id: e.target.value })}
                  required
                >
                  <option value="">Chọn bài học</option>
                  {lessons.map((l: any) => {
                    const course = courses.find((c: any) => c.id === l.course_id);
                    return (
                      <option key={l.id} value={l.id}>
                        {course ? `[${course.title} - ${course.level}] ${l.title}` : l.title}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div className="form-group">
                <label>Mẫu câu *</label>
                <input
                  type="text"
                  value={formData.pattern}
                  onChange={(e) => setFormData({ ...formData, pattern: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Nghĩa *</label>
                <input
                  type="text"
                  value={formData.meaning}
                  onChange={(e) => setFormData({ ...formData, meaning: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Giải thích</label>
                <textarea
                  value={formData.explanation || ''}
                  onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="form-group">
                <label>Ví dụ</label>
                <div style={{ marginTop: '0.5rem' }}>
                  {(formData.examples || []).map((ex: any, idx: number) => (
                    <div key={idx} style={{ marginBottom: '1rem', padding: '1rem', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <strong>Ví dụ {idx + 1}</strong>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => {
                            const newExamples = [...(formData.examples || [])];
                            newExamples.splice(idx, 1);
                            setFormData({ ...formData, examples: newExamples });
                          }}
                        >
                          🗑️ Xóa
                        </button>
                      </div>
                      <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                        <label>Câu tiếng Nhật</label>
                        <input
                          type="text"
                          value={ex.japanese || ''}
                          onChange={(e) => {
                            const newExamples = [...(formData.examples || [])];
                            newExamples[idx] = { ...newExamples[idx], japanese: e.target.value };
                            setFormData({ ...formData, examples: newExamples });
                          }}
                          placeholder="今日は暑いです"
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                        <label>Romaji (tùy chọn)</label>
                        <input
                          type="text"
                          value={ex.romaji || ''}
                          onChange={(e) => {
                            const newExamples = [...(formData.examples || [])];
                            newExamples[idx] = { ...newExamples[idx], romaji: e.target.value };
                            setFormData({ ...formData, examples: newExamples });
                          }}
                          placeholder="Kyou wa atsui desu"
                        />
                      </div>
                      <div className="form-group">
                        <label>Dịch tiếng Việt</label>
                        <input
                          type="text"
                          value={ex.translation || ''}
                          onChange={(e) => {
                            const newExamples = [...(formData.examples || [])];
                            newExamples[idx] = { ...newExamples[idx], translation: e.target.value };
                            setFormData({ ...formData, examples: newExamples });
                          }}
                          placeholder="Hôm nay nóng"
                        />
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => addExample('grammar')}
                  >
                    ➕ Thêm ví dụ
                  </button>
                </div>
              </div>
            </>
          )}

          {type === 'listening' && (
            <>
              <div className="form-group">
                <label>Ngôn ngữ *</label>
                <select
                  value={formData.language || 'japanese'}
                  onChange={(e) => {
                    const newLanguage = e.target.value as 'japanese' | 'chinese';
                    setFormData({ 
                      ...formData, 
                      language: newLanguage,
                      lesson_id: '' // Reset lesson when language changes
                    });
                  }}
                  required
                >
                  <option value="japanese">🇯🇵 Tiếng Nhật</option>
                  <option value="chinese">🇨🇳 Tiếng Trung</option>
                </select>
              </div>
              <div className="form-group">
                <label>Bài học *</label>
                <select
                  value={formData.lesson_id}
                  onChange={(e) => setFormData({ ...formData, lesson_id: e.target.value })}
                  required
                >
                  <option value="">Chọn bài học</option>
                  {lessons
                    .filter((l: any) => {
                      const lessonCourse = courses.find((c: any) => c.id === l.course_id);
                      return lessonCourse?.language === (formData.language || 'japanese');
                    })
                    .map((l: any) => {
                      const course = courses.find((c: any) => c.id === l.course_id);
                      return (
                        <option key={l.id} value={l.id}>
                          {course ? `[${course.title} - ${course.level}] ${l.title}` : l.title}
                        </option>
                      );
                    })}
                </select>
              </div>
              <div className="form-group">
                <label>Tiêu đề *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Audio File</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      // Validate file type
                      if (!validateFileType(file, ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3'])) {
                        showToast('Chỉ chấp nhận file audio (MP3, WAV, OGG)', 'error');
                        return;
                      }

                      // Validate file size (10MB)
                      if (!validateFileSize(file, 10)) {
                        showToast('File quá lớn. Tối đa 10MB', 'error');
                        return;
                      }

                      setUploadingAudio(true);
                      const result = await uploadAudio(file);
                      setUploadingAudio(false);

                      if (result.error) {
                        showToast('Lỗi upload: ' + result.error, 'error');
                      } else {
                        setFormData({ ...formData, audio_url: result.url });
                        showToast('Upload thành công!', 'success');
                      }
                    }}
                    disabled={uploadingAudio}
                  />
                  {uploadingAudio && <span>Đang upload...</span>}
                </div>
                {formData.audio_url && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    URL: <a href={formData.audio_url} target="_blank" rel="noopener noreferrer">{formData.audio_url}</a>
                  </div>
                )}
              </div>
              <div className="form-group">
                <label>URL Audio (hoặc nhập URL trực tiếp)</label>
                <input
                  type="text"
                  value={formData.audio_url || ''}
                  onChange={(e) => setFormData({ ...formData, audio_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="form-group">
                <label>Image File</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      // Validate file type
                      if (!validateFileType(file, ['image/jpeg', 'image/png', 'image/webp', 'image/gif'])) {
                        showToast('Chỉ chấp nhận file ảnh (JPG, PNG, WebP, GIF)', 'error');
                        return;
                      }

                      // Validate file size (5MB)
                      if (!validateFileSize(file, 5)) {
                        showToast('File quá lớn. Tối đa 5MB', 'error');
                        return;
                      }

                      setUploadingImage(true);
                      const result = await uploadImage(file, 'listening');
                      setUploadingImage(false);

                      if (result.error) {
                        showToast('Lỗi upload: ' + result.error, 'error');
                      } else {
                        setFormData({ ...formData, image_url: result.url });
                        showToast('Upload thành công!', 'success');
                      }
                    }}
                    disabled={uploadingImage}
                  />
                  {uploadingImage && <span>Đang upload...</span>}
                </div>
                {formData.image_url && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <img src={formData.image_url} alt="Preview" style={{ maxWidth: '200px', maxHeight: '200px', borderRadius: '8px' }} />
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                      URL: <a href={formData.image_url} target="_blank" rel="noopener noreferrer">{formData.image_url}</a>
                    </div>
                  </div>
                )}
              </div>
              <div className="form-group">
                <label>URL Image (hoặc nhập URL trực tiếp)</label>
                <input
                  type="text"
                  value={formData.image_url || ''}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="form-group">
                <label>Transcript *</label>
                <textarea
                  value={formData.transcript}
                  onChange={(e) => setFormData({ ...formData, transcript: e.target.value })}
                  required
                  rows={5}
                />
              </div>
              {!item && (
                <div className="form-group">
                  <label>Dán JSON từ AI (Bài nghe)</label>
                  <textarea
                    value={aiJsonText}
                    onChange={(e) => setAiJsonText(e.target.value)}
                    rows={4}
                    placeholder='Dán JSON {"title": "...", "transcript": "...", "questions": [...]}'
                  />
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ marginTop: '0.5rem' }}
                    onClick={handleParseAiJson}
                  >
                    🔁 Parse JSON vào form
                  </button>
                  {aiJsonStatus && (
                    <div style={{ marginTop: '0.5rem', color: 'var(--success-color)', fontSize: '0.875rem' }}>
                      {aiJsonStatus}
                    </div>
                  )}
                </div>
              )}
              <div className="form-group">
                <label>Câu hỏi (tùy chọn)</label>
                <div style={{ marginTop: '0.5rem' }}>
                  {(formData.questions || []).map((q: any, idx: number) => (
                    <div key={idx} style={{ marginBottom: '1rem', padding: '1rem', background: 'var(--bg-color)', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <strong>Câu hỏi {idx + 1}</strong>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => {
                            const newQuestions = [...(formData.questions || [])];
                            newQuestions.splice(idx, 1);
                            setFormData({ ...formData, questions: newQuestions });
                          }}
                        >
                          Xóa
                        </button>
                      </div>
                      {(() => {
                        const options = Array.isArray(q.options) ? [...q.options] : [];
                        while (options.length < 4) options.push('');
                        return (
                          <>
                      <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                        <label>Câu hỏi</label>
                        <input
                          type="text"
                          value={q.question || ''}
                          onChange={(e) => {
                            const newQuestions = [...(formData.questions || [])];
                            newQuestions[idx] = { ...newQuestions[idx], question: e.target.value };
                            setFormData({ ...formData, questions: newQuestions });
                          }}
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                        <label>Đáp án A / B / C / D</label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.5rem', marginTop: '0.5rem' }}>
                          {['A', 'B', 'C', 'D'].map((label, optIdx) => (
                            <div key={optIdx} className="form-group" style={{ marginBottom: 0 }}>
                              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Đáp án {label}</label>
                              <input
                                type="text"
                                value={options[optIdx] || ''}
                                onChange={(e) => {
                                  const newQuestions = [...(formData.questions || [])];
                                  const qOptions = Array.isArray(newQuestions[idx].options) ? [...newQuestions[idx].options] : [];
                                  while (qOptions.length < 4) qOptions.push('');
                                  qOptions[optIdx] = e.target.value;
                                  newQuestions[idx] = {
                                    ...newQuestions[idx],
                                    options: qOptions,
                                  };
                                  setFormData({ ...formData, questions: newQuestions });
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="form-group">
                        <label>Đáp án đúng (A / B / C / D)</label>
                        <select
                          value={q.correct_answer !== undefined ? q.correct_answer : 0}
                          onChange={(e) => {
                            const newQuestions = [...(formData.questions || [])];
                            newQuestions[idx] = { 
                              ...newQuestions[idx], 
                              correct_answer: parseInt(e.target.value) || 0
                            };
                            setFormData({ ...formData, questions: newQuestions });
                          }}
                        >
                          <option value={0}>A</option>
                          <option value={1}>B</option>
                          <option value={2}>C</option>
                          <option value={3}>D</option>
                        </select>
                      </div>
                          </>
                        );
                      })()}
                    </div>
                  ))}
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        questions: [...(formData.questions || []), { question: '', options: [], correct_answer: 0 }]
                      });
                    }}
                  >
                    ➕ Thêm câu hỏi
                  </button>
                </div>
              </div>
            </>
          )}

          {type === 'games' && !item && (
            <>
              <div className="form-group">
                <label>Chế độ thêm</label>
                <div className="import-mode-selector">
                  <button
                    type="button"
                    className={`mode-btn ${importMode === 'single' ? 'active' : ''}`}
                    onClick={() => {
                      setImportMode('single');
                      setBatchText('');
                      setBatchPreview([]);
                      setBatchError(null);
                    }}
                  >
                    ➕ Thêm từng câu
                  </button>
                  <button
                    type="button"
                    className={`mode-btn ${importMode === 'batch' ? 'active' : ''}`}
                    onClick={() => {
                      setImportMode('batch');
                      setFormData({ ...formData, sentence: '', translation: '', words: [], correct_order: [] });
                    }}
                  >
                    📋 Import hàng loạt
                  </button>
                </div>
              </div>
            </>
          )}

          {type === 'games' && importMode === 'single' && (
            <>
              <div className="form-group">
                <label>Ngôn ngữ *</label>
                <select
                  value={formData.language || 'japanese'}
                  onChange={(e) => {
                    const newLanguage = e.target.value as 'japanese' | 'chinese';
                    setFormData({ 
                      ...formData, 
                      language: newLanguage,
                      lesson_id: '' // Reset lesson when language changes
                    });
                  }}
                  required
                >
                  <option value="japanese">🇯🇵 Tiếng Nhật</option>
                  <option value="chinese">🇨🇳 Tiếng Trung</option>
                </select>
              </div>
              <div className="form-group">
                <label>Bài học *</label>
                <select
                  value={formData.lesson_id}
                  onChange={(e) => setFormData({ ...formData, lesson_id: e.target.value })}
                  required
                >
                  <option value="">Chọn bài học</option>
                  {lessons
                    .filter((l: any) => {
                      const lessonCourse = courses.find((c: any) => c.id === l.course_id);
                      return lessonCourse?.language === (formData.language || 'japanese');
                    })
                    .map((l: any) => {
                      const course = courses.find((c: any) => c.id === l.course_id);
                      return (
                        <option key={l.id} value={l.id}>
                          {course ? `[${course.title} - ${course.level}] ${l.title}` : l.title}
                        </option>
                      );
                    })}
                </select>
              </div>
              <div className="form-group">
                <label>Câu tiếng Nhật *</label>
                <input
                  type="text"
                  value={formData.sentence}
                  onChange={(e) => setFormData({ ...formData, sentence: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Dịch *</label>
                <input
                  type="text"
                  value={formData.translation}
                  onChange={(e) => setFormData({ ...formData, translation: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Các từ (cách nhau bằng dấu phẩy) *</label>
                <input
                  type="text"
                  value={Array.isArray(formData.words) ? formData.words.join(', ') : formData.words || ''}
                  onChange={(e) => setFormData({ ...formData, words: e.target.value })}
                  placeholder="私, は, 学生, です"
                  required
                />
              </div>
              <div className="form-group">
                <label>Thứ tự đúng (số, cách nhau bằng dấu phẩy) *</label>
                <input
                  type="text"
                  value={Array.isArray(formData.correct_order) ? formData.correct_order.join(', ') : formData.correct_order || ''}
                  onChange={(e) => setFormData({ ...formData, correct_order: e.target.value })}
                  placeholder="0, 1, 2, 3"
                  required
                />
              </div>
              <div className="form-group">
                <label>Gợi ý</label>
                <input
                  type="text"
                  value={formData.hint || ''}
                  onChange={(e) => setFormData({ ...formData, hint: e.target.value })}
                />
              </div>
              {!item && (
                <div className="form-group">
                  <label>Dán JSON từ AI (1 câu game)</label>
                  <textarea
                    value={aiJsonText}
                    onChange={(e) => setAiJsonText(e.target.value)}
                    rows={4}
                    placeholder='Dán JSON {"sentence": "...", "translation": "...", "words": [...], "correct_order": [...]}'
                  />
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ marginTop: '0.5rem' }}
                    onClick={handleParseAiJson}
                  >
                    🔁 Parse JSON vào form
                  </button>
                  {aiJsonStatus && (
                    <div style={{ marginTop: '0.5rem', color: 'var(--success-color)', fontSize: '0.875rem' }}>
                      {aiJsonStatus}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {type === 'games' && importMode === 'batch' && !item && (
            <>
              <div className="form-group">
                <label>Ngôn ngữ *</label>
                <select
                  value={formData.language || 'japanese'}
                  onChange={(e) => {
                    const newLanguage = e.target.value as 'japanese' | 'chinese';
                    setFormData({ 
                      ...formData, 
                      language: newLanguage,
                      lesson_id: '' // Reset lesson when language changes
                    });
                  }}
                  required
                >
                  <option value="japanese">🇯🇵 Tiếng Nhật</option>
                  <option value="chinese">🇨🇳 Tiếng Trung</option>
                </select>
              </div>
              <div className="form-group">
                <label>Bài học *</label>
                <select
                  value={formData.lesson_id}
                  onChange={(e) => setFormData({ ...formData, lesson_id: e.target.value })}
                  required
                >
                  <option value="">Chọn bài học</option>
                  {lessons
                    .filter((l: any) => {
                      const lessonCourse = courses.find((c: any) => c.id === l.course_id);
                      return lessonCourse?.language === (formData.language || 'japanese');
                    })
                    .map((l: any) => {
                      const course = courses.find((c: any) => c.id === l.course_id);
                      return (
                        <option key={l.id} value={l.id}>
                          {course ? `[${course.title} - ${course.level}] ${l.title}` : l.title}
                        </option>
                      );
                    })}
                </select>
              </div>
              <div className="form-group">
                <label>
                  Nhập các câu sắp xếp (mỗi dòng một câu) *
                  <span className="format-hint">
                    Format: <code>câu_tiếng_Nhật=nghĩa_tiếng_Việt</code><br />
                    Lưu ý: hãy tách sẵn câu tiếng Nhật bằng khoảng trắng theo từng từ, ví dụ:
                    <code>私 は 学生 です=Tôi là học sinh</code>
                  </span>
                </label>
                <textarea
                  className="batch-input"
                  value={batchText}
                  onChange={(e) => {
                    setBatchText(e.target.value);
                    const { games, errors } = parseSentenceGameBatch(e.target.value);
                    setBatchPreview(games);
                    setBatchError(errors.length > 0 ? errors.join('\n') : null);
                  }}
                  placeholder={`私 は 学生 です=Tôi là học sinh
これは 本 です=Đây là quyển sách
明日 は 日曜日 です=Ngày mai là chủ nhật`}
                  rows={10}
                  required
                />
                {batchError && (
                  <div className="error-message">
                    <strong>⚠️ Lỗi:</strong>
                    <pre>{batchError}</pre>
                  </div>
                )}
                {batchPreview.length > 0 && !batchError && (
                  <div className="batch-preview">
                    <div className="preview-header">
                      <strong>✅ Preview ({batchPreview.length} câu):</strong>
                    </div>
                    <div className="preview-list">
                      {batchPreview.map((game, idx) => (
                        <div key={idx} className="preview-item">
                          <span className="preview-pattern">{game.sentence}</span>
                          <span className="preview-meaning">{game.translation}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {type === 'roleplay' && (
            <>
              <div className="form-group">
                <label>Ngôn ngữ *</label>
                <select
                  value={formData.language || 'japanese'}
                  onChange={(e) => {
                    const newLanguage = e.target.value as 'japanese' | 'chinese';
                    setFormData({ 
                      ...formData, 
                      language: newLanguage,
                      lesson_id: '' // Reset lesson when language changes
                    });
                  }}
                  required
                >
                  <option value="japanese">🇯🇵 Tiếng Nhật</option>
                  <option value="chinese">🇨🇳 Tiếng Trung</option>
                </select>
              </div>
              <div className="form-group">
                <label>Bài học *</label>
                <select
                  value={formData.lesson_id}
                  onChange={(e) => setFormData({ ...formData, lesson_id: e.target.value })}
                  required
                >
                  <option value="">Chọn bài học</option>
                  {lessons
                    .filter((l: any) => {
                      const lessonCourse = courses.find((c: any) => c.id === l.course_id);
                      return lessonCourse?.language === (formData.language || 'japanese');
                    })
                    .map((l: any) => {
                      const course = courses.find((c: any) => c.id === l.course_id);
                      return (
                        <option key={l.id} value={l.id}>
                          {course ? `[${course.title} - ${course.level}] ${l.title}` : l.title}
                        </option>
                      );
                    })}
                </select>
              </div>

              {!item && (
                <div className="form-group">
                  <label>Template nhanh (dễ)</label>
                  <div className="template-buttons">
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          title: 'Chào hỏi lần đầu gặp mặt',
                          description: 'Hội thoại chào hỏi cơ bản khi gặp người mới lần đầu.',
                          scenario: 'Hai người gặp nhau lần đầu trong lớp học tiếng Nhật.',
                          character_a: 'A (Bạn)',
                          character_b: 'B (Bạn mới)',
                          character_a_script: [
                            'はじめまして。わたしは [Tên] です。',
                            'どうぞよろしくおねがいします。'
                          ],
                          character_b_script: [
                            'はじめまして。[Tên] さん。わたしは [Tên bạn B] です。',
                            'こちらこそ、よろしくおねがいします。'
                          ],
                          vocabulary_hints: [
                            'はじめまして - Rất hân hạnh được gặp bạn',
                            'わたしは〜です - Tôi là ~',
                            'どうぞよろしくおねがいします - Rất mong được giúp đỡ'
                          ],
                          grammar_points: ['はじめまして', 'N は N です'],
                          difficulty: 'easy'
                        });
                      }}
                    >
                      👋 Chào hỏi
                    </button>

                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          title: 'Gọi món ở quán ăn',
                          description: 'Hội thoại đơn giản khi gọi món ở quán ăn.',
                          scenario: 'Bạn đến một quán ăn và gọi món với nhân viên.',
                          character_a: 'A (Khách)',
                          character_b: 'B (Nhân viên)',
                          character_a_script: [
                            'すみません。メニューをください。',
                            'カレーをひとつください。',
                            'みずもおねがいします。'
                          ],
                          character_b_script: [
                            'はい、しょうしょうおまちください。',
                            'かしこまりました。',
                            'はい、どうぞ。'
                          ],
                          vocabulary_hints: [
                            'すみません - Xin lỗi/cho tôi hỏi',
                            'メニュー - Menu',
                            '〜をください - Cho tôi ~',
                            'みず - Nước',
                            'しょうしょうおまちください - Vui lòng đợi một chút'
                          ],
                          grammar_points: ['〜をください', '〜も おねがいします'],
                          difficulty: 'easy'
                        });
                      }}
                    >
                      🍛 Gọi món
                    </button>

                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          title: 'Mua sắm ở cửa hàng tiện lợi',
                          description: 'Hội thoại cơ bản khi thanh toán ở cửa hàng tiện lợi.',
                          scenario: 'Bạn mua vài món ở cửa hàng tiện lợi và thanh toán tại quầy.',
                          character_a: 'A (Khách)',
                          character_b: 'B (Nhân viên)',
                          character_a_script: [
                            'これとこれをください。',
                            'ポイントカードはありません。',
                            'レジぶくろはいりません。'
                          ],
                          character_b_script: [
                            'いらっしゃいませ。',
                            'ポイントカードはおもちですか。',
                            'ぜんぶで５００えんです。',
                            'ありがとうございました。'
                          ],
                          vocabulary_hints: [
                            'これ - Cái này',
                            'いらっしゃいませ - Xin chào quý khách',
                            'ポイントカード - Thẻ tích điểm',
                            'レジぶくろ - Túi nylon',
                            '〜はいりません - Không cần ~'
                          ],
                          grammar_points: ['これ/それ', '〜は ありません', '〜はいりません'],
                          difficulty: 'easy'
                        });
                      }}
                    >
                      🛒 Mua sắm
                    </button>
                  </div>
                  <div className="format-hint">
                    Chọn một template để tự động điền sẵn hội thoại. Bạn có thể chỉnh lại nội dung cho phù hợp.
                  </div>
                </div>
              )}

              {!item && (
                <div className="form-group">
                  <label>Dán JSON từ AI (Roleplay)</label>
                  <textarea
                    value={aiJsonText}
                    onChange={(e) => setAiJsonText(e.target.value)}
                    rows={5}
                    placeholder='Dán JSON roleplay với các key: title, description, scenario, character_a/b, character_a_script, character_b_script, vocabulary_hints, grammar_points, difficulty, image_url'
                  />
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ marginTop: '0.5rem' }}
                    onClick={handleParseAiJson}
                  >
                    🔁 Parse JSON vào form
                  </button>
                  {aiJsonStatus && (
                    <div style={{ marginTop: '0.5rem', color: 'var(--success-color)', fontSize: '0.875rem' }}>
                      {aiJsonStatus}
                    </div>
                  )}
                </div>
              )}

              <div className="form-group">
                <label>Tiêu đề *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Mô tả</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="form-group">
                <label>Tình huống *</label>
                <textarea
                  value={formData.scenario}
                  onChange={(e) => setFormData({ ...formData, scenario: e.target.value })}
                  required
                  rows={3}
                  placeholder="Mô tả tình huống roleplay..."
                />
              </div>
              <div className="form-group">
                <label>Nhân vật A *</label>
                <input
                  type="text"
                  value={formData.character_a}
                  onChange={(e) => setFormData({ ...formData, character_a: e.target.value })}
                  required
                  placeholder="Ví dụ: Khách hàng, Bạn, Học sinh..."
                />
              </div>
              <div className="form-group">
                <label>Nhân vật B *</label>
                <input
                  type="text"
                  value={formData.character_b}
                  onChange={(e) => setFormData({ ...formData, character_b: e.target.value })}
                  required
                  placeholder="Ví dụ: Nhân viên, Giáo viên, Bạn bè..."
                />
              </div>
              <div className="form-group">
                <label>Script nhân vật A (mỗi dòng một câu) *</label>
                <textarea
                  value={Array.isArray(formData.character_a_script) ? formData.character_a_script.join('\n') : formData.character_a_script || ''}
                  onChange={(e) => setFormData({ ...formData, character_a_script: e.target.value.split('\n').filter(l => l.trim()) })}
                  required
                  rows={5}
                  placeholder="Xin chào&#10;Tôi muốn đặt bàn cho 2 người&#10;Cảm ơn"
                />
                <div className="format-hint">
                  Mỗi dòng là một câu của nhân vật A
                </div>
              </div>
              <div className="form-group">
                <label>Script nhân vật B (mỗi dòng một câu) *</label>
                <textarea
                  value={Array.isArray(formData.character_b_script) ? formData.character_b_script.join('\n') : formData.character_b_script || ''}
                  onChange={(e) => setFormData({ ...formData, character_b_script: e.target.value.split('\n').filter(l => l.trim()) })}
                  required
                  rows={5}
                  placeholder="Xin chào, chào mừng đến nhà hàng&#10;Vâng, để tôi kiểm tra&#10;Đã đặt xong"
                />
                <div className="format-hint">
                  Mỗi dòng là một câu của nhân vật B
                </div>
              </div>
              <div className="form-group">
                <label>Gợi ý từ vựng (cách nhau bằng dấu phẩy)</label>
                <input
                  type="text"
                  value={Array.isArray(formData.vocabulary_hints) ? formData.vocabulary_hints.join(', ') : formData.vocabulary_hints || ''}
                  onChange={(e) => setFormData({ ...formData, vocabulary_hints: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                  placeholder="Xin chào, đặt bàn, cảm ơn"
                />
              </div>
              <div className="form-group">
                <label>Điểm ngữ pháp (cách nhau bằng dấu phẩy)</label>
                <input
                  type="text"
                  value={Array.isArray(formData.grammar_points) ? formData.grammar_points.join(', ') : formData.grammar_points || ''}
                  onChange={(e) => setFormData({ ...formData, grammar_points: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                  placeholder="です, ます, ません"
                />
              </div>
              <div className="form-group">
                <label>Độ khó</label>
                <select
                  value={formData.difficulty || 'medium'}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                >
                  <option value="easy">Dễ</option>
                  <option value="medium">Trung bình</option>
                  <option value="hard">Khó</option>
                </select>
              </div>
              <div className="form-group">
                <label>Image File</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      if (!validateFileType(file, ['image/jpeg', 'image/png', 'image/webp', 'image/gif'])) {
                        alert('Chỉ chấp nhận file ảnh (JPG, PNG, WebP, GIF)');
                        return;
                      }

                      if (!validateFileSize(file, 5)) {
                        alert('File quá lớn. Tối đa 5MB');
                        return;
                      }

                      setUploadingImage(true);
                      const result = await uploadImage(file, 'roleplay');
                      setUploadingImage(false);

                      if (result.error) {
                        showToast('Lỗi upload: ' + result.error, 'error');
                      } else {
                        setFormData({ ...formData, image_url: result.url });
                        showToast('Upload thành công!', 'success');
                      }
                    }}
                    disabled={uploadingImage}
                  />
                  {uploadingImage && <span>Đang upload...</span>}
                </div>
                {formData.image_url && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <img src={formData.image_url} alt="Preview" style={{ maxWidth: '200px', maxHeight: '200px', borderRadius: '8px' }} />
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                      URL: <a href={formData.image_url} target="_blank" rel="noopener noreferrer">{formData.image_url}</a>
                    </div>
                  </div>
                )}
              </div>
              <div className="form-group">
                <label>URL Image (hoặc nhập URL trực tiếp)</label>
                <input
                  type="text"
                  value={formData.image_url || ''}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </>
          )}

          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              {item ? 'Cập nhật' : 'Tạo mới'}
            </button>
            <button type="button" className="btn btn-outline" onClick={onCancel}>
              Hủy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

function getTypeLabel(type: TabType): string {
  const labels: Record<TabType, string> = {
    courses: 'Khóa học',
    lessons: 'Bài học',
    vocabulary: 'Từ vựng',
    kanji: 'Kanji',
    grammar: 'Ngữ pháp',
    listening: 'Bài tập nghe',
    games: 'Game sắp xếp câu',
    roleplay: 'Roleplay',
  };
  return labels[type];
}

export default AdminPanel;
