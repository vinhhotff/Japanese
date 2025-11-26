// import { useState } from 'react';

interface RoleplayAdminFormProps {
  formData: any;
  setFormData: (data: any) => void;
  lessons: any[];
  uploadingImage?: boolean;
  setUploadingImage?: (uploading: boolean) => void;
}

const RoleplayAdminForm = ({ 
  formData, 
  setFormData, 
  lessons
}: RoleplayAdminFormProps) => {
  
  const addScriptLine = (character: 'A' | 'B') => {
    if (character === 'A') {
      setFormData({
        ...formData,
        character_a_script: [...(formData.character_a_script || []), ''],
        character_a_correct_answers: [...(formData.character_a_correct_answers || []), ['']]
      });
    } else {
      setFormData({
        ...formData,
        character_b_script: [...(formData.character_b_script || []), ''],
        character_b_correct_answers: [...(formData.character_b_correct_answers || []), ['']]
      });
    }
  };

  const removeScriptLine = (character: 'A' | 'B', index: number) => {
    if (character === 'A') {
      const newScript = [...(formData.character_a_script || [])];
      const newAnswers = [...(formData.character_a_correct_answers || [])];
      newScript.splice(index, 1);
      newAnswers.splice(index, 1);
      setFormData({
        ...formData,
        character_a_script: newScript,
        character_a_correct_answers: newAnswers
      });
    } else {
      const newScript = [...(formData.character_b_script || [])];
      const newAnswers = [...(formData.character_b_correct_answers || [])];
      newScript.splice(index, 1);
      newAnswers.splice(index, 1);
      setFormData({
        ...formData,
        character_b_script: newScript,
        character_b_correct_answers: newAnswers
      });
    }
  };

  const updateScriptLine = (character: 'A' | 'B', index: number, value: string) => {
    if (character === 'A') {
      const newScript = [...(formData.character_a_script || [])];
      newScript[index] = value;
      setFormData({ ...formData, character_a_script: newScript });
    } else {
      const newScript = [...(formData.character_b_script || [])];
      newScript[index] = value;
      setFormData({ ...formData, character_b_script: newScript });
    }
  };

  const addCorrectAnswer = (character: 'A' | 'B', lineIndex: number) => {
    if (character === 'A') {
      const newAnswers = [...(formData.character_a_correct_answers || [])];
      if (!newAnswers[lineIndex]) newAnswers[lineIndex] = [];
      newAnswers[lineIndex] = [...newAnswers[lineIndex], ''];
      setFormData({ ...formData, character_a_correct_answers: newAnswers });
    } else {
      const newAnswers = [...(formData.character_b_correct_answers || [])];
      if (!newAnswers[lineIndex]) newAnswers[lineIndex] = [];
      newAnswers[lineIndex] = [...newAnswers[lineIndex], ''];
      setFormData({ ...formData, character_b_correct_answers: newAnswers });
    }
  };

  const removeCorrectAnswer = (character: 'A' | 'B', lineIndex: number, answerIndex: number) => {
    if (character === 'A') {
      const newAnswers = [...(formData.character_a_correct_answers || [])];
      newAnswers[lineIndex].splice(answerIndex, 1);
      setFormData({ ...formData, character_a_correct_answers: newAnswers });
    } else {
      const newAnswers = [...(formData.character_b_correct_answers || [])];
      newAnswers[lineIndex].splice(answerIndex, 1);
      setFormData({ ...formData, character_b_correct_answers: newAnswers });
    }
  };

  const updateCorrectAnswer = (character: 'A' | 'B', lineIndex: number, answerIndex: number, value: string) => {
    if (character === 'A') {
      const newAnswers = [...(formData.character_a_correct_answers || [])];
      if (!newAnswers[lineIndex]) newAnswers[lineIndex] = [];
      newAnswers[lineIndex][answerIndex] = value;
      setFormData({ ...formData, character_a_correct_answers: newAnswers });
    } else {
      const newAnswers = [...(formData.character_b_correct_answers || [])];
      if (!newAnswers[lineIndex]) newAnswers[lineIndex] = [];
      newAnswers[lineIndex][answerIndex] = value;
      setFormData({ ...formData, character_b_correct_answers: newAnswers });
    }
  };

  return (
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
          placeholder="Mô tả tình huống hội thoại..."
        />
      </div>

      <div className="form-group">
        <label>Độ khó</label>
        <select
          value={formData.difficulty || 'easy'}
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
            checked={formData.enable_scoring || false}
            onChange={(e) => setFormData({ ...formData, enable_scoring: e.target.checked })}
          />
          <strong> Bật chế độ đánh giá đúng/sai</strong>
          <span style={{ display: 'block', fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
            Khi bật, học viên sẽ được đánh giá câu trả lời dựa trên câu trả lời mẫu
          </span>
        </label>
      </div>

      <div className="form-group">
        <label>Tên nhân vật A *</label>
        <input
          type="text"
          value={formData.character_a}
          onChange={(e) => setFormData({ ...formData, character_a: e.target.value })}
          required
          placeholder="Ví dụ: Tanaka"
        />
      </div>

      <div className="form-group">
        <label>Kịch bản nhân vật A *</label>
        <div style={{ marginTop: '0.5rem' }}>
          {(formData.character_a_script || []).map((line: string, idx: number) => (
            <div key={idx} style={{ marginBottom: '1.5rem', padding: '1.5rem', background: '#eff6ff', borderRadius: '12px', border: '2px solid #3b82f6' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <strong style={{ color: '#1e40af' }}>👤 Câu {idx + 1} - Nhân vật A</strong>
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => removeScriptLine('A', idx)}
                >
                  🗑️ Xóa
                </button>
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>Câu thoại *</label>
                <textarea
                  value={line}
                  onChange={(e) => updateScriptLine('A', idx, e.target.value)}
                  rows={2}
                  placeholder="Nhập câu thoại tiếng Nhật..."
                  required
                />
              </div>

              {formData.enable_scoring && (
                <div className="form-group">
                  <label style={{ color: '#7c3aed', fontWeight: 600 }}>
                    ✓ Câu trả lời đúng (có thể có nhiều đáp án)
                  </label>
                  {(formData.character_a_correct_answers?.[idx] || ['']).map((answer: string, ansIdx: number) => (
                    <div key={ansIdx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <input
                        type="text"
                        value={answer}
                        onChange={(e) => updateCorrectAnswer('A', idx, ansIdx, e.target.value)}
                        placeholder={`Đáp án ${ansIdx + 1}...`}
                        style={{ flex: 1 }}
                      />
                      {ansIdx > 0 && (
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={() => removeCorrectAnswer('A', idx, ansIdx)}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => addCorrectAnswer('A', idx)}
                    style={{ marginTop: '0.5rem' }}
                  >
                    ➕ Thêm đáp án khác
                  </button>
                </div>
              )}
            </div>
          ))}
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => addScriptLine('A')}
          >
            ➕ Thêm câu thoại cho nhân vật A
          </button>
        </div>
      </div>

      <div className="form-group">
        <label>Tên nhân vật B *</label>
        <input
          type="text"
          value={formData.character_b}
          onChange={(e) => setFormData({ ...formData, character_b: e.target.value })}
          required
          placeholder="Ví dụ: Yamada"
        />
      </div>

      <div className="form-group">
        <label>Kịch bản nhân vật B *</label>
        <div style={{ marginTop: '0.5rem' }}>
          {(formData.character_b_script || []).map((line: string, idx: number) => (
            <div key={idx} style={{ marginBottom: '1.5rem', padding: '1.5rem', background: '#fef3c7', borderRadius: '12px', border: '2px solid #f59e0b' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <strong style={{ color: '#92400e' }}>👤 Câu {idx + 1} - Nhân vật B</strong>
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => removeScriptLine('B', idx)}
                >
                  🗑️ Xóa
                </button>
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>Câu thoại *</label>
                <textarea
                  value={line}
                  onChange={(e) => updateScriptLine('B', idx, e.target.value)}
                  rows={2}
                  placeholder="Nhập câu thoại tiếng Nhật..."
                  required
                />
              </div>

              {formData.enable_scoring && (
                <div className="form-group">
                  <label style={{ color: '#7c3aed', fontWeight: 600 }}>
                    ✓ Câu trả lời đúng (có thể có nhiều đáp án)
                  </label>
                  {(formData.character_b_correct_answers?.[idx] || ['']).map((answer: string, ansIdx: number) => (
                    <div key={ansIdx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <input
                        type="text"
                        value={answer}
                        onChange={(e) => updateCorrectAnswer('B', idx, ansIdx, e.target.value)}
                        placeholder={`Đáp án ${ansIdx + 1}...`}
                        style={{ flex: 1 }}
                      />
                      {ansIdx > 0 && (
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={() => removeCorrectAnswer('B', idx, ansIdx)}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => addCorrectAnswer('B', idx)}
                    style={{ marginTop: '0.5rem' }}
                  >
                    ➕ Thêm đáp án khác
                  </button>
                </div>
              )}
            </div>
          ))}
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => addScriptLine('B')}
          >
            ➕ Thêm câu thoại cho nhân vật B
          </button>
        </div>
      </div>

      <div className="form-group">
        <label>Từ vựng gợi ý (cách nhau bằng dấu phẩy)</label>
        <input
          type="text"
          value={Array.isArray(formData.vocabulary_hints) ? formData.vocabulary_hints.join(', ') : formData.vocabulary_hints || ''}
          onChange={(e) => setFormData({ ...formData, vocabulary_hints: e.target.value })}
          placeholder="こんにちは, ありがとう, すみません"
        />
      </div>

      <div className="form-group">
        <label>Ngữ pháp gợi ý (cách nhau bằng dấu phẩy)</label>
        <input
          type="text"
          value={Array.isArray(formData.grammar_points) ? formData.grammar_points.join(', ') : formData.grammar_points || ''}
          onChange={(e) => setFormData({ ...formData, grammar_points: e.target.value })}
          placeholder="です, ます, ～たいです"
        />
      </div>

      <div className="form-group">
        <label>URL hình ảnh</label>
        <input
          type="text"
          value={formData.image_url || ''}
          onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
          placeholder="https://..."
        />
      </div>
    </>
  );
};

export default RoleplayAdminForm;
