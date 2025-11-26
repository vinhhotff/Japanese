import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  getCourses, createCourse, updateCourse, deleteCourse,
  getLessons, createLesson, updateLesson, deleteLesson,
  getVocabulary, createVocabulary, updateVocabulary, deleteVocabulary,
  getKanji, createKanji, updateKanji, deleteKanji,
  getGrammar, createGrammar, updateGrammar, deleteGrammar,
  getListeningExercises, createListeningExercise,
  getSpeakingExercises, createSpeakingExercise,
  getSentenceGames, createSentenceGame,
  getRoleplayScenarios, createRoleplayScenario, updateRoleplayScenario, deleteRoleplayScenario
} from '../services/supabaseService';
import { parseVocabularyBatch } from '../utils/vocabParser';
import { parseKanjiBatch } from '../utils/kanjiParser';
import { parseGrammarBatch } from '../utils/grammarParser';
import { parseSentenceGameBatch } from '../utils/sentenceGameParser';
import { uploadAudio, uploadImage, validateFileType, validateFileSize } from '../utils/fileUpload';
import '../App.css';

type TabType = 'courses' | 'lessons' | 'vocabulary' | 'kanji' | 'grammar' | 'listening' | 'speaking' | 'games' | 'roleplay';

const AdminPanel = () => {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('courses');
  const [data, setData] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadCourses();
    loadLessons();
  }, []);

  useEffect(() => {
    loadData();
  }, [activeTab]);

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
        case 'speaking':
          const speakingData = await getSpeakingExercises();
          setData(speakingData || []);
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
      alert('Lỗi khi tải dữ liệu: ' + error.message);
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
              alert(`✅ Đã thêm ${successCount} từ vựng thành công!`);
            } else {
              alert(`⚠️ Đã thêm ${successCount} từ vựng, ${errorCount} từ vựng bị lỗi.`);
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
              alert(`✅ Đã thêm ${successCount} kanji thành công!`);
            } else {
              alert(`⚠️ Đã thêm ${successCount} kanji, ${errorCount} kanji bị lỗi.`);
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
              alert(`✅ Đã thêm ${successCount} ngữ pháp thành công!`);
            } else {
              alert(`⚠️ Đã thêm ${successCount} ngữ pháp, ${errorCount} ngữ pháp bị lỗi.`);
            }
          } else {
            await createGrammar(formData);
          }
          break;
        case 'listening':
          await createListeningExercise(formData);
          break;
        case 'speaking':
          await createSpeakingExercise(formData);
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
              alert(`✅ Đã thêm ${successCount} game sắp xếp câu thành công!`);
            } else {
              alert(`⚠️ Đã thêm ${successCount} game, ${errorCount} game bị lỗi.`);
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
    } catch (error: any) {
      alert('Lỗi khi tạo: ' + error.message);
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
        // Add update for other types if needed
      }
      setShowForm(false);
      setEditingItem(null);
      await loadData();
    } catch (error: any) {
      alert('Lỗi khi cập nhật: ' + error.message);
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
      }
      await loadData();
    } catch (error: any) {
      alert('Lỗi khi xóa: ' + error.message);
    }
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <div>
          <h1>
            <svg style={{ width: '36px', height: '36px', display: 'inline', marginRight: '0.75rem' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Quản lý Dữ liệu
          </h1>
          <p>Thêm, sửa, xóa bài học, từ vựng, kanji...</p>
        </div>
        <div className="admin-user-info">
          <span>Xin chào, {user?.email}</span>
          <button className="btn btn-outline" onClick={signOut}>
            <svg style={{ width: '18px', height: '18px', marginRight: '0.5rem' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
          <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
          </svg>
          Khóa học
        </button>
        <button
          className={`admin-tab ${activeTab === 'lessons' ? 'active' : ''}`}
          onClick={() => setActiveTab('lessons')}
        >
          <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          Bài học
        </button>
        <button
          className={`admin-tab ${activeTab === 'vocabulary' ? 'active' : ''}`}
          onClick={() => setActiveTab('vocabulary')}
        >
          <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          Từ vựng
        </button>
        <button
          className={`admin-tab ${activeTab === 'kanji' ? 'active' : ''}`}
          onClick={() => setActiveTab('kanji')}
        >
          <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          Kanji
        </button>
        <button
          className={`admin-tab ${activeTab === 'grammar' ? 'active' : ''}`}
          onClick={() => setActiveTab('grammar')}
        >
          <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Ngữ pháp
        </button>
        <button
          className={`admin-tab ${activeTab === 'listening' ? 'active' : ''}`}
          onClick={() => setActiveTab('listening')}
        >
          <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
          Nghe
        </button>
        <button
          className={`admin-tab ${activeTab === 'speaking' ? 'active' : ''}`}
          onClick={() => setActiveTab('speaking')}
        >
          <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
          Nói
        </button>
        <button
          className={`admin-tab ${activeTab === 'games' ? 'active' : ''}`}
          onClick={() => setActiveTab('games')}
        >
          <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
          </svg>
          Game
        </button>
        <button
          className={`admin-tab ${activeTab === 'roleplay' ? 'active' : ''}`}
          onClick={() => setActiveTab('roleplay')}
        >
          <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
          <a href="/" className="btn btn-outline">
            ← Về trang chủ
          </a>
        </div>

        {loading ? (
          <div className="loading">Đang tải...</div>
        ) : (
          <div className="admin-list">
            {data.length === 0 ? (
              <div className="empty-state">
                <p>Chưa có dữ liệu. Hãy thêm mới!</p>
              </div>
            ) : (
              data.map((item) => (
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
    } else if (supportsBatchImport) {
      // New item with batch support - default to single
      setImportMode('single');
      setBatchText('');
      setBatchPreview([]);
      setBatchError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id, type]); // Only depend on item.id, not the whole item object

  function getDefaultFormData(type: TabType) {
    switch (type) {
      case 'courses':
        return { level: 'N5', title: '', description: '' };
      case 'lessons':
        return { course_id: '', title: '', lesson_number: 1, description: '', level: 'N5' };
      case 'vocabulary':
        return { lesson_id: '', word: '', kanji: '', hiragana: '', meaning: '', example: '', example_translation: '', difficulty: 'easy', is_difficult: false };
      case 'kanji':
        return { lesson_id: '', character: '', meaning: '', onyomi: [], kunyomi: [], stroke_count: 0, examples: [] };
      case 'grammar':
        return { lesson_id: '', pattern: '', meaning: '', explanation: '', examples: [] };
      case 'listening':
        return { lesson_id: '', title: '', audio_url: '', image_url: '', transcript: '', questions: [] };
      case 'speaking':
        return { lesson_id: '', title: '', prompt: '', example_response: '' };
      case 'games':
        return { lesson_id: '', sentence: '', translation: '', words: [], correct_order: [], hint: '' };
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
          vocabulary_hints: [], 
          grammar_points: [], 
          difficulty: 'easy',
          image_url: ''
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
        alert('Vui lòng chọn bài học');
        return;
      }
      
      if (batchPreview.length === 0) {
        alert('Vui lòng nhập từ vựng');
        return;
      }

      if (batchError) {
        alert('Vui lòng sửa lỗi trước khi lưu');
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
      processedData.correct_order = formData.correct_order.split(',').map((s: string) => parseInt(s.trim())).filter(n => !isNaN(n));
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
          {type === 'courses' && (
            <>
              <div className="form-group">
                <label>Cấp độ *</label>
                <select
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                  required
                >
                  <option value="N5">N5</option>
                  <option value="N4">N4</option>
                  <option value="N3">N3</option>
                  <option value="N2">N2</option>
                  <option value="N1">N1</option>
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
                <label>Khóa học *</label>
                <select
                  value={formData.course_id}
                  onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
                  required
                >
                  <option value="">Chọn khóa học</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
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
                  <option value="N5">N5</option>
                  <option value="N4">N4</option>
                  <option value="N3">N3</option>
                  <option value="N2">N2</option>
                  <option value="N1">N1</option>
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
                <label>Bài học *</label>
                <select
                  value={formData.lesson_id}
                  onChange={(e) => setFormData({ ...formData, lesson_id: e.target.value })}
                  required
                >
                  <option value="">Chọn bài học</option>
                  {lessons.map(l => (
                    <option key={l.id} value={l.id}>{l.title}</option>
                  ))}
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

          {type === 'vocabulary' && importMode === 'batch' && (
            <>
              <div className="form-group">
                <label>Bài học *</label>
                <select
                  value={formData.lesson_id}
                  onChange={(e) => setFormData({ ...formData, lesson_id: e.target.value })}
                  required
                >
                  <option value="">Chọn bài học</option>
                  {lessons.map(l => (
                    <option key={l.id} value={l.id}>{l.title}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>
                  Nhập từ vựng (mỗi dòng một từ) *
                  <span className="format-hint">
                    Format: <code>kanji=hiragana=nghĩa</code> hoặc <code>hiragana=nghĩa</code>
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
                  placeholder={`私=わたし=Tôi
学生=がくせい=Học sinh
こんにちは=Xin chào (ban ngày)
はじめまして=Lần đầu gặp mặt`}
                  rows={10}
                  required
                />
                <div className="format-example">
                  <strong>Ví dụ:</strong>
                  <pre>{`私=わたし=Tôi
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
                        <span className="preview-kanji">{vocab.kanji || '-'}</span>
                        <span className="preview-hiragana">{vocab.hiragana}</span>
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
                  {lessons.map(l => (
                    <option key={l.id} value={l.id}>{l.title}</option>
                  ))}
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
                  {lessons.map(l => (
                    <option key={l.id} value={l.id}>{l.title}</option>
                  ))}
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
                  {lessons.map(l => (
                    <option key={l.id} value={l.id}>{l.title}</option>
                  ))}
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
                  {lessons.map(l => (
                    <option key={l.id} value={l.id}>{l.title}</option>
                  ))}
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
                <label>Bài học *</label>
                <select
                  value={formData.lesson_id}
                  onChange={(e) => setFormData({ ...formData, lesson_id: e.target.value })}
                  required
                >
                  <option value="">Chọn bài học</option>
                  {lessons.map(l => (
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
                <label>Bài học *</label>
                <select
                  value={formData.lesson_id}
                  onChange={(e) => setFormData({ ...formData, lesson_id: e.target.value })}
                  required
                >
                  <option value="">Chọn bài học</option>
                  {lessons.map(l => (
                    <option key={l.id} value={l.id}>{l.title}</option>
                  ))}
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
                  {lessons.map(l => (
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
                <label>Bài học *</label>
                <select
                  value={formData.lesson_id}
                  onChange={(e) => setFormData({ ...formData, lesson_id: e.target.value })}
                  required
                >
                  <option value="">Chọn bài học</option>
                  {lessons.map(l => (
                    <option key={l.id} value={l.id}>{l.title}</option>
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
                        alert('Chỉ chấp nhận file audio (MP3, WAV, OGG)');
                        return;
                      }

                      // Validate file size (10MB)
                      if (!validateFileSize(file, 10)) {
                        alert('File quá lớn. Tối đa 10MB');
                        return;
                      }

                      setUploadingAudio(true);
                      const result = await uploadAudio(file);
                      setUploadingAudio(false);

                      if (result.error) {
                        alert('Lỗi upload: ' + result.error);
                      } else {
                        setFormData({ ...formData, audio_url: result.url });
                        alert('Upload thành công!');
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
                        alert('Chỉ chấp nhận file ảnh (JPG, PNG, WebP, GIF)');
                        return;
                      }

                      // Validate file size (5MB)
                      if (!validateFileSize(file, 5)) {
                        alert('File quá lớn. Tối đa 5MB');
                        return;
                      }

                      setUploadingImage(true);
                      const result = await uploadImage(file, 'listening');
                      setUploadingImage(false);

                      if (result.error) {
                        alert('Lỗi upload: ' + result.error);
                      } else {
                        setFormData({ ...formData, image_url: result.url });
                        alert('Upload thành công!');
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
                        <label>Đáp án (cách nhau bằng dấu phẩy)</label>
                        <input
                          type="text"
                          value={Array.isArray(q.options) ? q.options.join(', ') : q.options || ''}
                          onChange={(e) => {
                            const newQuestions = [...(formData.questions || [])];
                            newQuestions[idx] = { 
                              ...newQuestions[idx], 
                              options: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                            };
                            setFormData({ ...formData, questions: newQuestions });
                          }}
                        />
                      </div>
                      <div className="form-group">
                        <label>Đáp án đúng (số thứ tự, bắt đầu từ 0)</label>
                        <input
                          type="number"
                          min="0"
                          value={q.correct_answer !== undefined ? q.correct_answer : 0}
                          onChange={(e) => {
                            const newQuestions = [...(formData.questions || [])];
                            newQuestions[idx] = { 
                              ...newQuestions[idx], 
                              correct_answer: parseInt(e.target.value) || 0
                            };
                            setFormData({ ...formData, questions: newQuestions });
                          }}
                        />
                      </div>
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

          {type === 'speaking' && (
            <>
              <div className="form-group">
                <label>Bài học *</label>
                <select
                  value={formData.lesson_id}
                  onChange={(e) => setFormData({ ...formData, lesson_id: e.target.value })}
                  required
                >
                  <option value="">Chọn bài học</option>
                  {lessons.map(l => (
                    <option key={l.id} value={l.id}>{l.title}</option>
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
                <label>Đề bài *</label>
                <textarea
                  value={formData.prompt}
                  onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                  required
                  rows={3}
                />
              </div>
              <div className="form-group">
                <label>Ví dụ trả lời</label>
                <textarea
                  value={formData.example_response || ''}
                  onChange={(e) => setFormData({ ...formData, example_response: e.target.value })}
                  rows={3}
                />
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
                <label>Bài học *</label>
                <select
                  value={formData.lesson_id}
                  onChange={(e) => setFormData({ ...formData, lesson_id: e.target.value })}
                  required
                >
                  <option value="">Chọn bài học</option>
                  {lessons.map(l => (
                    <option key={l.id} value={l.id}>{l.title}</option>
                  ))}
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
            </>
          )}

          {type === 'games' && importMode === 'batch' && !item && (
            <>
              <div className="form-group">
                <label>Bài học *</label>
                <select
                  value={formData.lesson_id}
                  onChange={(e) => setFormData({ ...formData, lesson_id: e.target.value })}
                  required
                >
                  <option value="">Chọn bài học</option>
                  {lessons.map(l => (
                    <option key={l.id} value={l.id}>{l.title}</option>
                  ))}
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
                <label>Bài học *</label>
                <select
                  value={formData.lesson_id}
                  onChange={(e) => setFormData({ ...formData, lesson_id: e.target.value })}
                  required
                >
                  <option value="">Chọn bài học</option>
                  {lessons.map(l => (
                    <option key={l.id} value={l.id}>{l.title}</option>
                  ))}
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
                        alert('Lỗi upload: ' + result.error);
                      } else {
                        setFormData({ ...formData, image_url: result.url });
                        alert('Upload thành công!');
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
    speaking: 'Bài tập nói',
    games: 'Game sắp xếp câu',
    roleplay: 'Roleplay',
  };
  return labels[type];
}

export default AdminPanel;
