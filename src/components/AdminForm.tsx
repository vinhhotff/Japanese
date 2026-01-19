import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from './Toast';
import { logger } from '../utils/logger';
import { parseVocabularyBatch } from '../utils/vocabParser';
import { parseKanjiBatch } from '../utils/kanjiParser';
import { parseGrammarBatch } from '../utils/grammarParser';
import { parseSentenceGameBatch } from '../utils/sentenceGameParser';
import { uploadAudio, uploadImage, validateFileType, validateFileSize } from '../utils/fileUpload';
import '../App.css';
import '../styles/admin-panel-complete.css';
import '../styles/admin-help-guide.css';

export type TabType = 'courses' | 'lessons' | 'vocabulary' | 'kanji' | 'grammar' | 'listening' | 'games' | 'roleplay' | 'users';

const AdminForm = ({ type, item, courses, lessons, currentLanguage, currentCourse, currentLevel, currentLesson, onSave, onCancel }: any) => {
  const { showToast } = useToast();
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
  const [showJSONHint, setShowJSONHint] = useState<Record<string, boolean>>({});
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
        const showVocabJSON = showJSONHint['vocabulary'] ?? false;
        return (
          <div className="form-group">
            <label>
              Hướng dẫn JSON/format cho AI (Từ vựng)
              <button
                type="button"
                className="btn-toggle-hint"
                onClick={() => setShowJSONHint({ ...showJSONHint, vocabulary: !showVocabJSON })}
              >
                {showVocabJSON ? '▼ Thu gọn' : '▶ Mở rộng'}
              </button>
            </label>
            {showVocabJSON && (
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
            )}
          </div>
        );
      case 'kanji':
        const showKanjiJSON = showJSONHint['kanji'] ?? false;
        return (
          <div className="form-group">
            <label>
              Hướng dẫn JSON/format cho AI (Kanji)
              <button
                type="button"
                className="btn-toggle-hint"
                onClick={() => setShowJSONHint({ ...showJSONHint, kanji: !showKanjiJSON })}
              >
                {showKanjiJSON ? '▼ Thu gọn' : '▶ Mở rộng'}
              </button>
            </label>
            {showKanjiJSON && (
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
            )}
          </div>
        );
      case 'grammar':
        const showGrammarJSON = showJSONHint['grammar'] ?? false;
        return (
          <div className="form-group">
            <label>
              Hướng dẫn JSON/format cho AI (Ngữ pháp)
              <button
                type="button"
                className="btn-toggle-hint"
                onClick={() => setShowJSONHint({ ...showJSONHint, grammar: !showGrammarJSON })}
              >
                {showGrammarJSON ? '▼ Thu gọn' : '▶ Mở rộng'}
              </button>
            </label>
            {showGrammarJSON && (
              <div className="format-hint" style={{ lineHeight: 1.6 }}>
                <strong>Gợi ý 1 (JSON đầy đủ - khuyến nghị):</strong>
                <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.8rem', marginTop: '0.5rem', background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: '8px', color: 'var(--text-primary)' }}>{`Hãy tạo các mẫu ngữ pháp tiếng Nhật trình độ N5 cho chủ đề tôi đưa.
- Trả về JSON array, không giải thích thêm.
- Không dùng markdown, chỉ JSON thuần.
- Giữ nguyên tên các key:

[
  {
    "pattern": "〜たいです",
    "meaning": "Muốn làm gì đó",
    "explanation": "Diễn tả mong muốn của người nói. Động từ chuyển sang thể ます rồi bỏ ます, thêm たいです.",
    "examples": [
      {
        "japanese": "コーヒーを飲みたいです。",
        "romaji": "Kōhī o nomitai desu.",
        "translation": "Tôi muốn uống cà phê."
      },
      {
        "japanese": "日本に行きたいです。",
        "romaji": "Nihon ni ikitai desu.",
        "translation": "Tôi muốn đi Nhật Bản."
      }
    ]
  },
  {
    "pattern": "〜てください",
    "meaning": "Hãy làm gì đó",
    "explanation": "Dùng khi nhờ vả, yêu cầu một cách lịch sự. Động từ chuyển sang thể て rồi thêm ください.",
    "examples": [
      {
        "japanese": "窓を開けてください。",
        "romaji": "Mado o akete kudasai.",
        "translation": "Hãy mở cửa sổ."
      },
      {
        "japanese": "静かにしてください。",
        "romaji": "Shizuka ni shite kudasai.",
        "translation": "Hãy giữ yên lặng."
      }
    ]
  }
]`}</pre>
                <strong style={{ marginTop: '1rem', display: 'block' }}>Gợi ý 2 (Format text đơn giản - để import hàng loạt):</strong>
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
                <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#fef3c7', borderRadius: '6px', fontSize: '0.875rem' }}>
                  <strong>💡 Lưu ý:</strong> Nếu dùng JSON, bạn có thể copy từng field (pattern, meaning, explanation) và thêm examples vào form. Nếu dùng format text, chỉ có thể import pattern và meaning, cần thêm examples sau.
                </div>
              </div>
            )}
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
        return { level: currentLevel || 'N5', title: '', description: '', language: currentLanguage || 'japanese', price: 0 };
      case 'lessons':
        const currentCourseLessons = lessons.filter((l: any) => l.course_id === currentCourse?.id);
        const maxNumber = currentCourseLessons.length > 0
          ? Math.max(...currentCourseLessons.map((l: any) => l.lesson_number || 0))
          : 0;
        return {
          course_id: currentCourse?.id || '',
          title: '',
          lesson_number: maxNumber + 1,
          description: '',
          level: currentLevel || currentCourse?.level || 'N5',
          language: currentLanguage || currentCourse?.language || 'japanese',
          is_free: false, // Default to locked
        };
      case 'vocabulary':
        return { lesson_id: currentLesson?.id || '', word: '', kanji: '', hiragana: '', meaning: '', example: '', example_translation: '', difficulty: 'easy', is_difficult: false, language: currentLanguage || currentCourse?.language || currentLesson?.language || 'japanese' };
      case 'kanji':
        return { lesson_id: currentLesson?.id || '', character: '', meaning: '', onyomi: [], kunyomi: [], stroke_count: 0, examples: [] };
      case 'grammar':
        return { lesson_id: currentLesson?.id || '', pattern: '', meaning: '', explanation: '', examples: [], language: currentLanguage || currentCourse?.language || currentLesson?.language || 'japanese' };
      case 'listening':
        return { lesson_id: currentLesson?.id || '', title: '', audio_url: '', image_url: '', transcript: '', questions: [], language: currentLanguage || currentCourse?.language || currentLesson?.language || 'japanese' };
      case 'games':
        return { lesson_id: currentLesson?.id || '', sentence: '', translation: '', words: [], correct_order: [], hint: '', language: currentLanguage || currentCourse?.language || currentLesson?.language || 'japanese' };
      case 'roleplay':
        return {
          lesson_id: currentLesson?.id || '',
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
          language: currentLanguage || currentCourse?.language || currentLesson?.language || 'japanese'
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
        showToast('⚠️ Vui lòng chọn bài học trước khi import từ vựng. Nếu chưa có bài học, hãy tạo bài học trước.', 'warning');
        return;
      }

      if (batchPreview.length === 0) {
        showToast('⚠️ Vui lòng nhập từ vựng theo format đúng. Xem ví dụ trong form để biết cách nhập.', 'warning');
        return;
      }

      if (batchError) {
        showToast('⚠️ Có lỗi trong format. Vui lòng xem phần "Lỗi" bên dưới và sửa lại. Format đúng: kanji=hiragana=nghĩa hoặc hiragana=nghĩa', 'error');
        return;
      }

      // Convert preview to form data format
      const batchData = batchPreview.map(vocab => {
        if (formData.language === 'chinese') {
          const simplified = vocab.simplified || vocab.word || '';
          const pinyin = vocab.pinyin || '';
          if (!simplified || !pinyin || !vocab.meaning) {
            throw new Error(`Thiếu thông tin: hán tự, pinyin hoặc nghĩa`);
          }
          return {
            lesson_id: formData.lesson_id,
            word: simplified, // word should be simplified hanzi
            character: simplified, // character is simplified hanzi for Chinese
            hiragana: pinyin, // Use pinyin for hiragana field (database compatibility)
            simplified: simplified,
            traditional: vocab.traditional || null,
            pinyin: pinyin,
            meaning: vocab.meaning,
            difficulty: formData.difficulty || 'easy',
            is_difficult: false,
            language: 'chinese',
          };
        } else {
          const hiragana = vocab.hiragana || '';
          if (!hiragana || !vocab.meaning) {
            throw new Error(`Thiếu thông tin: hiragana hoặc nghĩa`);
          }
          return {
            lesson_id: formData.lesson_id,
            word: vocab.word || hiragana,
            character: vocab.kanji || null,
            hiragana: hiragana,
            meaning: vocab.meaning,
            difficulty: formData.difficulty || 'easy',
            is_difficult: false,
            language: 'japanese',
          };
        }
      });

      onSave(batchData);
      return;
    }

    // Handle batch import for kanji
    if (type === 'kanji' && importMode === 'batch' && !item) {
      if (!formData.lesson_id) {
        showToast('⚠️ Vui lòng chọn bài học trước khi import kanji/hán tự. Nếu chưa có bài học, hãy tạo bài học trước.', 'warning');
        return;
      }

      if (batchPreview.length === 0) {
        showToast('⚠️ Vui lòng nhập kanji/hán tự theo format đúng. Xem ví dụ trong form để biết cách nhập.', 'warning');
        return;
      }

      if (batchError) {
        showToast('⚠️ Có lỗi trong format. Vui lòng xem phần "Lỗi" bên dưới và sửa lại. Format đúng: kanji=nghĩa', 'error');
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
        showToast('⚠️ Vui lòng chọn bài học trước khi import ngữ pháp. Nếu chưa có bài học, hãy tạo bài học trước.', 'warning');
        return;
      }

      if (batchPreview.length === 0) {
        showToast('⚠️ Vui lòng nhập ngữ pháp theo format đúng. Xem ví dụ trong form để biết cách nhập.', 'warning');
        return;
      }

      if (batchError) {
        showToast('⚠️ Có lỗi trong format. Vui lòng xem phần "Lỗi" bên dưới và sửa lại. Format đúng: pattern=nghĩa', 'error');
        return;
      }

      // Convert preview to form data format
      const batchData = batchPreview.map((grammar: any) => {
        // Map examples to correct format for database
        let examples = [];
        if (grammar.examples && Array.isArray(grammar.examples)) {
          examples = grammar.examples.map((ex: any) => {
            // Ensure examples have correct field names for database
            return {
              japanese: ex.japanese || ex.chinese || '', // Support both japanese and chinese
              romaji: ex.romaji || ex.pinyin || '', // Support both romaji and pinyin
              translation: ex.translation || ''
            };
          }).filter((ex: any) => ex.japanese && ex.translation); // Filter out invalid examples
        }

        return {
          lesson_id: formData.lesson_id,
          pattern: grammar.pattern || '',
          meaning: grammar.meaning || '',
          explanation: grammar.explanation || '',
          examples: examples,
          language: formData.language || 'japanese',
        };
      });

      onSave(batchData);
      return;
    }

    // Handle batch import for sentence games (sắp xếp câu)
    if (type === 'games' && importMode === 'batch' && !item) {
      if (!formData.lesson_id) {
        showToast('⚠️ Vui lòng chọn bài học trước khi import game. Nếu chưa có bài học, hãy tạo bài học trước.', 'warning');
        return;
      }

      if (batchPreview.length === 0) {
        showToast('⚠️ Vui lòng nhập danh sách câu theo format đúng. Xem ví dụ trong form để biết cách nhập.', 'warning');
        return;
      }

      if (batchError) {
        showToast('⚠️ Có lỗi trong format. Vui lòng xem phần "Lỗi" bên dưới và sửa lại. Format đúng: câu_đã_tách_từ=nghĩa', 'error');
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

    // Process vocabulary fields for Chinese
    if (type === 'vocabulary' && formData.language === 'chinese') {
      // Map form fields to database fields for Chinese
      const simplified = formData.word || '';
      const pinyin = formData.hiragana || ''; // pinyin is stored in hiragana field in form
      const traditional = formData.kanji || null; // traditional hanzi (stored in kanji field in form)

      processedData.word = simplified;
      processedData.character = simplified; // character is simplified hanzi for Chinese
      processedData.hiragana = pinyin; // Use pinyin for hiragana field (database compatibility)
      processedData.simplified = simplified;
      processedData.traditional = traditional;
      processedData.pinyin = pinyin;
      // Remove Japanese-specific fields
      delete processedData.kanji;
    }

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


  // Keyboard shortcuts for form
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        // Allow Ctrl/Cmd + S to save even when in input
        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        const ctrlKey = isMac ? e.metaKey : e.ctrlKey;
        if (ctrlKey && e.key === 's') {
          e.preventDefault();
          const form = document.querySelector('.modal-content form') as HTMLFormElement;
          if (form) {
            form.requestSubmit();
          }
        }
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const ctrlKey = isMac ? e.metaKey : e.ctrlKey;

      // Ctrl/Cmd + S: Lưu
      if (ctrlKey && e.key === 's') {
        e.preventDefault();
        const form = document.querySelector('.modal-content form') as HTMLFormElement;
        if (form) {
          form.requestSubmit();
        }
      }

      // Esc: Hủy
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="admin-text-primary">{item ? 'Sửa' : 'Thêm mới'} {getTypeLabel(type)}</h2>
        <form onSubmit={handleSubmit}>
          {renderAIPromptHint()}
          {type === 'courses' && (
            <>
              <div className="form-group">
                <label className="admin-label">
                  Ngôn ngữ *
                </label>
                <select
                  className="admin-input-base"
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
                  <option value="japanese">Tiếng Nhật</option>
                  <option value="chinese">Tiếng Trung</option>
                </select>
              </div>
              <div className="form-group">
                <label className="admin-label">
                  Cấp độ *
                </label>
                <select
                  className="admin-input-base"
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
                <label className="admin-label">
                  Tiêu đề *
                </label>
                <input
                  type="text"
                  className="admin-input-base"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder="Ví dụ: Tiếng Nhật N5 - Cơ bản"
                />
              </div>
              <div className="form-group">
                <label className="admin-label">
                  Mô tả
                </label>
                <textarea
                  className="admin-input-base"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  placeholder="Ví dụ: Khóa học dành cho người mới bắt đầu học tiếng Nhật, bao gồm các bài học cơ bản về chào hỏi, giới thiệu bản thân..."
                />
              </div>
              <div className="form-group">
                <label className="admin-label">
                  Giá tiền (VND)
                </label>
                <input
                  type="number"
                  className="admin-input-base"
                  value={formData.price || 0}
                  onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                  placeholder="Nhập giá tiền ví dụ: 500000"
                />
              </div>
            </>
          )}

          {type === 'lessons' && (
            <>
              <div className="form-group">
                <label className="admin-label">Ngôn ngữ *</label>
                <select
                  className="admin-input-base"
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
                  disabled={!!currentLanguage}
                >
                  <option value="japanese">Tiếng Nhật</option>
                  <option value="chinese">Tiếng Trung</option>
                </select>
              </div>
              <div className="form-group">
                <label className="admin-label">Khóa học *</label>
                <select
                  className="admin-input-base"
                  value={formData.course_id}
                  onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
                  required
                  disabled={!!currentCourse}
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
                <label className="admin-label">Tiêu đề *</label>
                <input
                  type="text"
                  className="admin-input-base"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="admin-label">Bài số mấy *</label>
                <input
                  type="number"
                  className="admin-input-base"
                  value={formData.lesson_number}
                  onChange={(e) => setFormData({ ...formData, lesson_number: parseInt(e.target.value) })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="admin-label">Cấp độ *</label>
                <select
                  className="admin-input-base"
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                  required
                  disabled={!!currentLevel || !!currentCourse}
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
                <label className="admin-label">Mô tả</label>
                <textarea
                  className="admin-input-base"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="form-group" style={{ marginTop: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <input
                    type="checkbox"
                    id="is_free"
                    checked={formData.is_free || false}
                    onChange={(e) => setFormData({ ...formData, is_free: e.target.checked })}
                    style={{ width: '20px', height: '20px', marginTop: '2px', cursor: 'pointer' }}
                  />
                  <div>
                    <label
                      className="admin-label"
                      htmlFor="is_free"
                      style={{ marginBottom: 0, cursor: 'pointer', fontSize: '1rem' }}
                    >
                      Bài học miễn phí (Học thử)
                    </label>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                      Nếu tích chọn, học sinh <strong>chưa mua khóa học</strong> vẫn có thể vào học bài này.
                      Các bài học khác sẽ bị khóa.
                    </p>
                  </div>
                </div>
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
                <label>
                  Ngôn ngữ *
                </label>
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
                <label>
                  Bài học *
                </label>
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
                {lessons.filter((l: any) => {
                  const lessonCourse = courses.find((c: any) => c.id === l.course_id);
                  return lessonCourse?.language === (formData.language || 'japanese');
                }).length === 0 && (
                    <div style={{ marginTop: '0.5rem', padding: '0.75rem', background: 'var(--warning-light)', borderRadius: '8px', fontSize: '0.875rem', color: 'var(--warning-color)' }}>
                      ⚠️ Chưa có bài học nào cho ngôn ngữ này. Hãy tạo bài học trước!
                    </div>
                  )}
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
                <label className="admin-label">Nghĩa *</label>
                <input
                  type="text"
                  className="admin-input-base"
                  value={formData.meaning}
                  onChange={(e) => setFormData({ ...formData, meaning: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="admin-label">Ví dụ</label>
                <input
                  type="text"
                  className="admin-input-base"
                  value={formData.example || ''}
                  onChange={(e) => setFormData({ ...formData, example: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="admin-label">Dịch ví dụ</label>
                <input
                  type="text"
                  className="admin-input-base"
                  value={formData.example_translation || ''}
                  onChange={(e) => setFormData({ ...formData, example_translation: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="admin-label">Độ khó / Mức độ ưu tiên</label>
                <div className="difficulty-selector">
                  <button
                    type="button"
                    className={`diff-option easy ${formData.difficulty === 'easy' ? 'active' : ''}`}
                    onClick={() => setFormData({ ...formData, difficulty: 'easy' })}
                  >
                    <span className="diff-emoji">🌱</span>
                    <span>Dễ</span>
                  </button>
                  <button
                    type="button"
                    className={`diff-option medium ${formData.difficulty === 'medium' || !formData.difficulty ? 'active' : ''}`}
                    onClick={() => setFormData({ ...formData, difficulty: 'medium' })}
                  >
                    <span className="diff-emoji">🌿</span>
                    <span>Thường</span>
                  </button>
                  <button
                    type="button"
                    className={`diff-option hard ${formData.difficulty === 'hard' ? 'active' : ''}`}
                    onClick={() => setFormData({ ...formData, difficulty: 'hard' })}
                  >
                    <span className="diff-emoji">🌳</span>
                    <span>Khó</span>
                  </button>
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '2rem' }}>
                <label className={`modern-checkbox-card ${formData.is_difficult ? 'active' : ''}`}>
                  <div className="modern-checkbox-content">
                    <span className="modern-checkbox-title">🚨 Từ vựng quan trọng / khó</span>
                    <span className="modern-checkbox-desc">Đánh dấu để ưu tiên ôn tập thường xuyên hơn</span>
                  </div>
                  <div className="modern-switch">
                    <input
                      type="checkbox"
                      checked={formData.is_difficult || false}
                      onChange={(e) => setFormData({ ...formData, is_difficult: e.target.checked })}
                    />
                    <span className="modern-slider"></span>
                  </div>
                </label>
              </div>
            </>
          )}

          {type === 'vocabulary' && importMode === 'batch' && (
            <>
              <div className="form-group">
                <label className="admin-label">Ngôn ngữ *</label>
                <select
                  className="admin-input-base"
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
                  disabled={!!currentLanguage}
                >
                  <option value="japanese">Tiếng Nhật</option>
                  <option value="chinese">Tiếng Trung</option>
                </select>
              </div>
              <div className="form-group">
                <label className="admin-label">Bài học *</label>
                <select
                  className="admin-input-base"
                  value={formData.lesson_id}
                  onChange={(e) => setFormData({ ...formData, lesson_id: e.target.value })}
                  required
                  disabled={!!currentLesson}
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
                <label className="admin-label">
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
                  className="batch-input admin-input-base"
                  value={batchText}
                  onChange={(e) => {
                    setBatchText(e.target.value);
                    const { vocabularies, errors } = parseVocabularyBatch(e.target.value, formData.language || 'japanese');
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
                            (vocab.traditional ? `${vocab.traditional} / ${vocab.simplified || vocab.word}` : (vocab.simplified || vocab.word)) :
                            (vocab.kanji || '-')}
                        </span>
                        <span className="preview-hiragana">
                          {formData.language === 'chinese' ? (vocab.pinyin || '-') : (vocab.hiragana || '-')}
                        </span>
                        <span className="preview-meaning">{vocab.meaning}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="form-group">
                <label className="admin-label">Độ khó mặc định</label>
                <div className="difficulty-selector">
                  <button
                    type="button"
                    className={`diff-option easy ${formData.difficulty === 'easy' ? 'active' : ''}`}
                    onClick={() => setFormData({ ...formData, difficulty: 'easy' })}
                  >
                    <span className="diff-emoji">🌱</span>
                    <span>Dễ</span>
                  </button>
                  <button
                    type="button"
                    className={`diff-option medium ${formData.difficulty === 'medium' || !formData.difficulty ? 'active' : ''}`}
                    onClick={() => setFormData({ ...formData, difficulty: 'medium' })}
                  >
                    <span className="diff-emoji">🌿</span>
                    <span>Thường</span>
                  </button>
                  <button
                    type="button"
                    className={`diff-option hard ${formData.difficulty === 'hard' ? 'active' : ''}`}
                    onClick={() => setFormData({ ...formData, difficulty: 'hard' })}
                  >
                    <span className="diff-emoji">🌳</span>
                    <span>Khó</span>
                  </button>
                </div>
              </div>
            </>
          )}

          {type === 'vocabulary' && item && (
            <>
              <div className="form-group">
                <label className="admin-label">Bài học *</label>
                <select
                  className="admin-input-base"
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
                <label className="admin-label">Từ (Hiragana/Hanzi) *</label>
                <input
                  type="text"
                  className="admin-input-base"
                  value={formData.word}
                  onChange={(e) => setFormData({ ...formData, word: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="admin-label">Kanji</label>
                <input
                  type="text"
                  className="admin-input-base"
                  value={formData.kanji || ''}
                  onChange={(e) => setFormData({ ...formData, kanji: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="admin-label">Hiragana/Pinyin *</label>
                <input
                  type="text"
                  className="admin-input-base"
                  value={formData.hiragana}
                  onChange={(e) => setFormData({ ...formData, hiragana: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="admin-label">Nghĩa *</label>
                <input
                  type="text"
                  className="admin-input-base"
                  value={formData.meaning}
                  onChange={(e) => setFormData({ ...formData, meaning: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="admin-label">Ví dụ</label>
                <input
                  type="text"
                  className="admin-input-base"
                  value={formData.example || ''}
                  onChange={(e) => setFormData({ ...formData, example: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="admin-label">Dịch ví dụ</label>
                <input
                  type="text"
                  className="admin-input-base"
                  value={formData.example_translation || ''}
                  onChange={(e) => setFormData({ ...formData, example_translation: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="admin-label">Độ khó / Mức độ ưu tiên</label>
                <div className="difficulty-selector">
                  <button
                    type="button"
                    className={`diff-option easy ${formData.difficulty === 'easy' ? 'active' : ''}`}
                    onClick={() => setFormData({ ...formData, difficulty: 'easy' })}
                  >
                    <span className="diff-emoji">🌱</span>
                    <span>Dễ</span>
                  </button>
                  <button
                    type="button"
                    className={`diff-option medium ${formData.difficulty === 'medium' || !formData.difficulty ? 'active' : ''}`}
                    onClick={() => setFormData({ ...formData, difficulty: 'medium' })}
                  >
                    <span className="diff-emoji">🌿</span>
                    <span>Thường</span>
                  </button>
                  <button
                    type="button"
                    className={`diff-option hard ${formData.difficulty === 'hard' ? 'active' : ''}`}
                    onClick={() => setFormData({ ...formData, difficulty: 'hard' })}
                  >
                    <span className="diff-emoji">🌳</span>
                    <span>Khó</span>
                  </button>
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '2rem' }}>
                <label className={`modern-checkbox-card ${formData.is_difficult ? 'active' : ''}`}>
                  <div className="modern-checkbox-content">
                    <span className="modern-checkbox-title">🚨 Từ vựng quan trọng / khó</span>
                    <span className="modern-checkbox-desc">Đánh dấu để ưu tiên ôn tập thường xuyên hơn</span>
                  </div>
                  <div className="modern-switch">
                    <input
                      type="checkbox"
                      checked={formData.is_difficult || false}
                      onChange={(e) => setFormData({ ...formData, is_difficult: e.target.checked })}
                    />
                    <span className="modern-slider"></span>
                  </div>
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
                <label className="admin-label">Kanji *</label>
                <input
                  type="text"
                  className="admin-input-base"
                  value={formData.character}
                  onChange={(e) => setFormData({ ...formData, character: e.target.value })}
                  required
                  maxLength={1}
                />
              </div>
              <div className="form-group">
                <label className="admin-label">Nghĩa *</label>
                <input
                  type="text"
                  className="admin-input-base"
                  value={formData.meaning}
                  onChange={(e) => setFormData({ ...formData, meaning: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="admin-label">Âm On (音読み) - cách nhau bằng dấu phẩy</label>
                <input
                  type="text"
                  className="admin-input-base"
                  value={Array.isArray(formData.onyomi) ? formData.onyomi.join(', ') : formData.onyomi || ''}
                  onChange={(e) => setFormData({ ...formData, onyomi: e.target.value })}
                  placeholder="シ, ジ"
                />
              </div>
              <div className="form-group">
                <label className="admin-label">Âm Kun (訓読み) - cách nhau bằng dấu phẩy</label>
                <input
                  type="text"
                  className="admin-input-base"
                  value={Array.isArray(formData.kunyomi) ? formData.kunyomi.join(', ') : formData.kunyomi || ''}
                  onChange={(e) => setFormData({ ...formData, kunyomi: e.target.value })}
                  placeholder="わたし, わたくし"
                />
              </div>
              <div className="form-group">
                <label className="admin-label">Số nét</label>
                <input
                  type="number"
                  className="admin-input-base"
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
                <label className="admin-label">Mẫu câu *</label>
                <input
                  type="text"
                  className="admin-input-base"
                  value={formData.pattern}
                  onChange={(e) => setFormData({ ...formData, pattern: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="admin-label">Nghĩa *</label>
                <input
                  type="text"
                  className="admin-input-base"
                  value={formData.meaning}
                  onChange={(e) => setFormData({ ...formData, meaning: e.target.value })}
                  required
                  style={{ fontSize: '1rem', fontWeight: '600', padding: '0.75rem' }}
                />
              </div>
              <div className="form-group">
                <label className="admin-label">Giải thích</label>
                <textarea
                  className="admin-input-base"
                  value={formData.explanation || ''}
                  onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                  rows={3}
                  placeholder="Giải thích chi tiết cách dùng mẫu ngữ pháp này..."
                />
              </div>
              <div className="form-group">
                <label>
                  Ví dụ
                  <button
                    type="button"
                    onClick={() => {
                      const language = formData.language || 'japanese';
                      const exampleFormat = language === 'chinese'
                        ? `[\n  {\n    "chinese": "我正在学习中文。",\n    "pinyin": "Wǒ zhèngzài xuéxí Zhōngwén.",\n    "translation": "Tôi đang học tiếng Trung."\n  }\n]`
                        : `[\n  {\n    "japanese": "コーヒーを飲みたいです。",\n    "romaji": "Kōhī o nomitai desu.",\n    "translation": "Tôi muốn uống cà phê."\n  }\n]`;
                      const jsonText = prompt(`Dán JSON examples (array) cho ${language === 'chinese' ? 'tiếng Trung' : 'tiếng Nhật'}:\n\n${exampleFormat}`);
                      if (jsonText) {
                        try {
                          const parsed = JSON.parse(jsonText);
                          const examplesArray = Array.isArray(parsed) ? parsed : [parsed];
                          const mappedExamples = examplesArray.map((ex: any) => {
                            if (language === 'chinese') {
                              return {
                                japanese: ex.chinese || ex.japanese || '',
                                romaji: ex.pinyin || ex.romaji || '',
                                translation: ex.translation || ''
                              };
                            } else {
                              return {
                                japanese: ex.japanese || '',
                                romaji: ex.romaji || '',
                                translation: ex.translation || ''
                              };
                            }
                          }).filter((ex: any) => ex.japanese && ex.translation);
                          setFormData({ ...formData, examples: [...(formData.examples || []), ...mappedExamples] });
                          showToast(`Đã thêm ${mappedExamples.length} ví dụ!`, 'success');
                        } catch (err) {
                          showToast('Lỗi parse JSON. Vui lòng kiểm tra lại format.', 'error');
                        }
                      }
                    }}
                    style={{
                      marginLeft: '0.5rem',
                      padding: '0.25rem 0.75rem',
                      fontSize: '0.75rem',
                      background: 'var(--primary-color)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    📥 Import JSON
                  </button>
                </label>
                <div style={{ marginTop: '0.5rem' }}>
                  {(formData.examples || []).map((ex: any, idx: number) => (
                    <div key={idx} style={{ marginBottom: '1rem', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <strong style={{ color: 'var(--text-primary)' }}>Ví dụ {idx + 1}</strong>
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
                        <label>{formData.language === 'chinese' ? 'Câu tiếng Trung' : 'Câu tiếng Nhật'}</label>
                        <input
                          type="text"
                          value={ex.japanese || ''}
                          onChange={(e) => {
                            const newExamples = [...(formData.examples || [])];
                            newExamples[idx] = { ...newExamples[idx], japanese: e.target.value };
                            setFormData({ ...formData, examples: newExamples });
                          }}
                          placeholder={formData.language === 'chinese' ? '我正在学习中文。' : '今日は暑いです'}
                          style={{ fontFamily: formData.language === 'chinese' ? '"Noto Sans SC", sans-serif' : '"Noto Sans JP", sans-serif' }}
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                        <label>{formData.language === 'chinese' ? 'Pinyin' : 'Romaji'} (tùy chọn)</label>
                        <input
                          type="text"
                          value={ex.romaji || ''}
                          onChange={(e) => {
                            const newExamples = [...(formData.examples || [])];
                            newExamples[idx] = { ...newExamples[idx], romaji: e.target.value };
                            setFormData({ ...formData, examples: newExamples });
                          }}
                          placeholder={formData.language === 'chinese' ? 'Wǒ zhèngzài xuéxí Zhōngwén.' : 'Kyou wa atsui desu'}
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
                  Nhập ngữ pháp *
                  <span className="format-hint" style={{ display: 'block', marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    <strong>Format 1 (JSON - khuyến nghị):</strong> Dán JSON array với đầy đủ pattern, meaning, explanation và examples. Xem hướng dẫn JSON ở trên.
                    <br />
                    <strong>Format 2 (Text đơn giản):</strong> Mỗi dòng một mẫu: <code>pattern=nghĩa</code> hoặc <code>pattern=nghĩa=giải_thích</code>
                  </span>
                </label>
                <textarea
                  className="batch-input"
                  value={batchText}
                  onChange={(e) => {
                    const text = e.target.value;
                    setBatchText(text);

                    // Try to parse as JSON first
                    const trimmedText = text.trim();
                    if (trimmedText.startsWith('[') || trimmedText.startsWith('{')) {
                      try {
                        const json = JSON.parse(trimmedText);
                        const jsonArray = Array.isArray(json) ? json : [json];
                        const language = formData.language || 'japanese';
                        const grammars = jsonArray.map((item: any) => {
                          // Map examples based on language
                          let examples = [];
                          if (item.examples && Array.isArray(item.examples)) {
                            examples = item.examples.map((ex: any) => {
                              if (language === 'chinese') {
                                // Chinese format: chinese -> japanese, pinyin -> romaji
                                return {
                                  japanese: ex.chinese || ex.japanese || '',
                                  romaji: ex.pinyin || ex.romaji || '',
                                  translation: ex.translation || ''
                                };
                              } else {
                                // Japanese format: keep as is
                                return {
                                  japanese: ex.japanese || '',
                                  romaji: ex.romaji || '',
                                  translation: ex.translation || ''
                                };
                              }
                            });
                          }
                          return {
                            pattern: item.pattern || '',
                            meaning: item.meaning || '',
                            explanation: item.explanation || '',
                            examples: examples
                          };
                        });
                        setBatchPreview(grammars);
                        setBatchError(null);
                        return;
                      } catch (err) {
                        // If JSON parse fails, fall back to text format
                      }
                    }

                    // Parse as text format
                    const { grammars, errors } = parseGrammarBatch(text);
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
                  <strong>Ví dụ Format 2 (Text):</strong>
                  <pre>{`です=Là (cách nói lịch sự)
ます=Động từ thể lịch sự
ません=Phủ định thể lịch sự`}</pre>
                  <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#f0f9ff', borderRadius: '6px', fontSize: '0.875rem' }}>
                    <strong>💡 Lưu ý:</strong> Để import đầy đủ cả examples, hãy dùng Format 1 (JSON). Format 2 chỉ import pattern, meaning và explanation.
                  </div>
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
                    {batchPreview.map((grammar: any, idx: number) => (
                      <div key={idx} className="preview-item grammar-preview-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', gap: '1rem', width: '100%', alignItems: 'center' }}>
                          <span className="preview-pattern" style={{ fontWeight: 'bold', fontSize: '1rem', color: 'var(--primary-color)' }}>{grammar.pattern}</span>
                          <span className="preview-meaning" style={{ fontWeight: '600', fontSize: '0.95rem', color: 'var(--text-primary)' }}>{grammar.meaning}</span>
                        </div>
                        {grammar.explanation && (
                          <span className="preview-explanation" style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>{grammar.explanation}</span>
                        )}
                        <div style={{ marginTop: '0.5rem', width: '100%' }}>
                          {grammar.examples && Array.isArray(grammar.examples) && grammar.examples.length > 0 ? (
                            <div style={{ padding: '0.75rem', background: 'var(--bg-color)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <strong style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>Ví dụ ({grammar.examples.length}):</strong>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const jsonText = prompt(`Dán JSON examples cho "${grammar.pattern}":\n\n${formData.language === 'chinese'
                                      ? `[\n  {\n    "chinese": "我正在学习中文。",\n    "pinyin": "Wǒ zhèngzài xuéxí Zhōngwén.",\n    "translation": "Tôi đang học tiếng Trung."\n  }\n]`
                                      : `[\n  {\n    "japanese": "コーヒーを飲みたいです。",\n    "romaji": "Kōhī o nomitai desu.",\n    "translation": "Tôi muốn uống cà phê."\n  }\n]`}`);
                                    if (jsonText) {
                                      try {
                                        const parsed = JSON.parse(jsonText);
                                        const examplesArray = Array.isArray(parsed) ? parsed : [parsed];
                                        const language = formData.language || 'japanese';
                                        const mappedExamples = examplesArray.map((ex: any) => {
                                          if (language === 'chinese') {
                                            return {
                                              japanese: ex.chinese || ex.japanese || '',
                                              romaji: ex.pinyin || ex.romaji || '',
                                              translation: ex.translation || ''
                                            };
                                          } else {
                                            return {
                                              japanese: ex.japanese || '',
                                              romaji: ex.romaji || '',
                                              translation: ex.translation || ''
                                            };
                                          }
                                        }).filter((ex: any) => ex.japanese && ex.translation);

                                        const newPreview = [...batchPreview];
                                        newPreview[idx] = { ...newPreview[idx], examples: [...(grammar.examples || []), ...mappedExamples] };
                                        setBatchPreview(newPreview);
                                        showToast(`Đã thêm ${mappedExamples.length} ví dụ cho "${grammar.pattern}"!`, 'success');
                                      } catch (err) {
                                        showToast('Lỗi parse JSON. Vui lòng kiểm tra lại format.', 'error');
                                      }
                                    }
                                  }}
                                  style={{
                                    padding: '0.25rem 0.5rem',
                                    fontSize: '0.7rem',
                                    background: 'var(--primary-color)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontWeight: '600'
                                  }}
                                >
                                  ➕ Thêm
                                </button>
                              </div>
                              {grammar.examples.slice(0, 2).map((ex: any, exIdx: number) => (
                                <div key={exIdx} style={{ marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                                  <div style={{ fontFamily: formData.language === 'chinese' ? '"Noto Sans SC", sans-serif' : '"Noto Sans JP", sans-serif', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                                    {ex.japanese || ex.chinese || ''}
                                  </div>
                                  {ex.romaji || ex.pinyin ? (
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                                      {ex.romaji || ex.pinyin}
                                    </div>
                                  ) : null}
                                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                    {ex.translation || ''}
                                  </div>
                                </div>
                              ))}
                              {grammar.examples.length > 2 && (
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                  ... và {grammar.examples.length - 2} ví dụ khác
                                </div>
                              )}
                            </div>
                          ) : (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', background: 'var(--bg-color)', borderRadius: '6px', border: '1px dashed var(--border-color)' }}>
                              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Chưa có ví dụ</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const jsonText = prompt(`Dán JSON examples cho "${grammar.pattern}":\n\n${formData.language === 'chinese'
                                    ? `[\n  {\n    "chinese": "我正在学习中文。",\n    "pinyin": "Wǒ zhèngzài xuéxí Zhōngwén.",\n    "translation": "Tôi đang học tiếng Trung."\n  }\n]`
                                    : `[\n  {\n    "japanese": "コーヒーを飲みたいです。",\n    "romaji": "Kōhī o nomitai desu.",\n    "translation": "Tôi muốn uống cà phê."\n  }\n]`}`);
                                  if (jsonText) {
                                    try {
                                      const parsed = JSON.parse(jsonText);
                                      const examplesArray = Array.isArray(parsed) ? parsed : [parsed];
                                      const language = formData.language || 'japanese';
                                      const mappedExamples = examplesArray.map((ex: any) => {
                                        if (language === 'chinese') {
                                          return {
                                            japanese: ex.chinese || ex.japanese || '',
                                            romaji: ex.pinyin || ex.romaji || '',
                                            translation: ex.translation || ''
                                          };
                                        } else {
                                          return {
                                            japanese: ex.japanese || '',
                                            romaji: ex.romaji || '',
                                            translation: ex.translation || ''
                                          };
                                        }
                                      }).filter((ex: any) => ex.japanese && ex.translation);

                                      const newPreview = [...batchPreview];
                                      newPreview[idx] = { ...newPreview[idx], examples: mappedExamples };
                                      setBatchPreview(newPreview);
                                      showToast(`Đã thêm ${mappedExamples.length} ví dụ cho "${grammar.pattern}"!`, 'success');
                                    } catch (err) {
                                      showToast('Lỗi parse JSON. Vui lòng kiểm tra lại format.', 'error');
                                    }
                                  }
                                }}
                                style={{
                                  padding: '0.25rem 0.75rem',
                                  fontSize: '0.75rem',
                                  background: 'var(--primary-color)',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontWeight: '600'
                                }}
                              >
                                📥 Import JSON
                              </button>
                            </div>
                          )}
                        </div>
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
                <label className="admin-label">Câu tiếng Nhật *</label>
                <input
                  type="text"
                  className="admin-input-base"
                  value={formData.sentence}
                  onChange={(e) => setFormData({ ...formData, sentence: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="admin-label">Dịch *</label>
                <input
                  type="text"
                  className="admin-input-base"
                  value={formData.translation}
                  onChange={(e) => setFormData({ ...formData, translation: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="admin-label">Các từ (cách nhau bằng dấu phẩy) *</label>
                <input
                  type="text"
                  className="admin-input-base"
                  value={Array.isArray(formData.words) ? formData.words.join(', ') : formData.words || ''}
                  onChange={(e) => setFormData({ ...formData, words: e.target.value })}
                  placeholder="私, は, 学生, です"
                  required
                />
              </div>
              <div className="form-group">
                <label className="admin-label">Thứ tự đúng (số, cách nhau bằng dấu phẩy) *</label>
                <input
                  type="text"
                  className="admin-input-base"
                  value={Array.isArray(formData.correct_order) ? formData.correct_order.join(', ') : formData.correct_order || ''}
                  onChange={(e) => setFormData({ ...formData, correct_order: e.target.value })}
                  placeholder="0, 1, 2, 3"
                  required
                />
              </div>
              <div className="form-group">
                <label className="admin-label">Gợi ý</label>
                <input
                  type="text"
                  className="admin-input-base"
                  value={formData.hint || ''}
                  onChange={(e) => setFormData({ ...formData, hint: e.target.value })}
                />
              </div>
              {!item && (
                <div className="form-group">
                  <label className="admin-label">Dán JSON từ AI (1 câu game)</label>
                  <textarea
                    className="admin-input-base"
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
                  <label className="admin-label">Dán JSON từ AI (Roleplay)</label>
                  <textarea
                    className="admin-input-base"
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
                <label className="admin-label">Tiêu đề *</label>
                <input
                  type="text"
                  className="admin-input-base"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="admin-label">Mô tả</label>
                <textarea
                  className="admin-input-base"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="form-group">
                <label className="admin-label">Tình huống *</label>
                <textarea
                  className="admin-input-base"
                  value={formData.scenario}
                  onChange={(e) => setFormData({ ...formData, scenario: e.target.value })}
                  required
                  rows={3}
                  placeholder="Mô tả tình huống roleplay..."
                />
              </div>
              <div className="form-group">
                <label className="admin-label">Nhân vật A *</label>
                <input
                  type="text"
                  className="admin-input-base"
                  value={formData.character_a}
                  onChange={(e) => setFormData({ ...formData, character_a: e.target.value })}
                  required
                  placeholder="Ví dụ: Khách hàng, Bạn, Học sinh..."
                />
              </div>
              <div className="form-group">
                <label className="admin-label">Nhân vật B *</label>
                <input
                  type="text"
                  className="admin-input-base"
                  value={formData.character_b}
                  onChange={(e) => setFormData({ ...formData, character_b: e.target.value })}
                  required
                  placeholder="Ví dụ: Nhân viên, Giáo viên, Bạn bè..."
                />
              </div>
              <div className="form-group">
                <label className="admin-label">Script nhân vật A (mỗi dòng một câu) *</label>
                <textarea
                  className="admin-input-base"
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
                <label className="admin-label">Script nhân vật B (mỗi dòng một câu) *</label>
                <textarea
                  className="admin-input-base"
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
                <label className="admin-label">Gợi ý từ vựng (cách nhau bằng dấu phẩy)</label>
                <input
                  type="text"
                  className="admin-input-base"
                  value={Array.isArray(formData.vocabulary_hints) ? formData.vocabulary_hints.join(', ') : formData.vocabulary_hints || ''}
                  onChange={(e) => setFormData({ ...formData, vocabulary_hints: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                  placeholder="Xin chào, đặt bàn, cảm ơn"
                />
              </div>
              <div className="form-group">
                <label className="admin-label">Điểm ngữ pháp (cách nhau bằng dấu phẩy)</label>
                <input
                  type="text"
                  className="admin-input-base"
                  value={Array.isArray(formData.grammar_points) ? formData.grammar_points.join(', ') : formData.grammar_points || ''}
                  onChange={(e) => setFormData({ ...formData, grammar_points: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                  placeholder="です, ます, ません"
                />
              </div>
              <div className="form-group">
                <label className="admin-label">Độ khó mặc định</label>
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
            <button type="submit" className="btn btn-primary" title="Lưu (Ctrl/Cmd + S)">
              {item ? 'Cập nhật' : 'Tạo mới'}
              <span className="keyboard-shortcut">⌘S</span>
            </button>
            <button type="button" className="btn btn-outline" onClick={onCancel} title="Hủy (Esc)">
              Hủy
              <span className="keyboard-shortcut">Esc</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export function getTypeLabel(type: TabType): string {
  const labels: Record<TabType, string> = {
    courses: 'Khóa học',
    lessons: 'Bài học',
    vocabulary: 'Từ vựng',
    kanji: 'Kanji',
    grammar: 'Ngữ pháp',
    listening: 'Bài tập nghe',
    games: 'Game sắp xếp câu',
    roleplay: 'Roleplay',
    users: 'Người dùng',
  };
  return labels[type];
}

export default AdminForm;
