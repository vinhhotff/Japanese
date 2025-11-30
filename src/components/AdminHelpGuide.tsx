import { useState } from 'react';
import '../App.css';

interface AdminHelpGuideProps {
  type: string;
  onClose: () => void;
}

const AdminHelpGuide = ({ type, onClose }: AdminHelpGuideProps) => {
  const [currentStep, setCurrentStep] = useState(0);

  const guides: Record<string, Array<{ title: string; content: string; example?: string }>> = {
    courses: [
      {
        title: 'Bước 1: Chọn ngôn ngữ',
        content: 'Chọn ngôn ngữ bạn muốn tạo khóa học: Tiếng Nhật (N5-N1) hoặc Tiếng Trung (HSK1-HSK6)'
      },
      {
        title: 'Bước 2: Chọn cấp độ',
        content: 'Chọn cấp độ phù hợp:\n- Tiếng Nhật: N5 (dễ nhất) đến N1 (khó nhất)\n- Tiếng Trung: HSK1 (dễ nhất) đến HSK6 (khó nhất)',
        example: 'Ví dụ: N5 cho người mới bắt đầu học tiếng Nhật'
      },
      {
        title: 'Bước 3: Nhập tiêu đề',
        content: 'Nhập tên khóa học, ví dụ: "Khóa học N5 cơ bản" hoặc "HSK1 - Giao tiếp hàng ngày"',
        example: 'Ví dụ: "Tiếng Nhật N5 - Cơ bản"'
      },
      {
        title: 'Bước 4: Mô tả (tùy chọn)',
        content: 'Mô tả ngắn về khóa học, nội dung sẽ học, đối tượng phù hợp...'
      }
    ],
    lessons: [
      {
        title: 'Bước 1: Chọn ngôn ngữ',
        content: 'Chọn ngôn ngữ cho bài học. Phải khớp với ngôn ngữ của khóa học bạn chọn.'
      },
      {
        title: 'Bước 2: Chọn khóa học',
        content: 'Chọn khóa học mà bài học này thuộc về. Danh sách chỉ hiển thị khóa học cùng ngôn ngữ.',
        example: 'Ví dụ: Nếu chọn "Tiếng Nhật", chỉ thấy khóa học tiếng Nhật'
      },
      {
        title: 'Bước 3: Nhập tiêu đề bài học',
        content: 'Tên bài học, ví dụ: "Bài 1: Chào hỏi cơ bản"',
        example: 'Ví dụ: "Bài 1: Giới thiệu bản thân"'
      },
      {
        title: 'Bước 4: Số bài học',
        content: 'Số thứ tự của bài học trong khóa học. Bắt đầu từ 1.',
        example: 'Ví dụ: Bài đầu tiên = 1, bài thứ hai = 2...'
      },
      {
        title: 'Bước 5: Chọn cấp độ',
        content: 'Cấp độ của bài học, thường giống với cấp độ của khóa học.'
      }
    ],
    vocabulary: [
      {
        title: 'Cách 1: Thêm từng từ (Dễ cho người mới)',
        content: '1. Chọn "➕ Thêm từng từ"\n2. Chọn ngôn ngữ (Tiếng Nhật hoặc Tiếng Trung)\n3. Chọn bài học\n4. Điền thông tin:\n   - Tiếng Nhật: Từ (Hiragana), Kanji (nếu có), Nghĩa\n   - Tiếng Trung: Hán tự, Pinyin, Nghĩa\n5. Nhấn "Lưu"',
        example: 'Tiếng Nhật:\n- Từ: こんにちは\n- Kanji: 今日は\n- Nghĩa: Xin chào\n\nTiếng Trung:\n- Hán tự: 你好\n- Pinyin: nǐ hǎo\n- Nghĩa: Xin chào'
      },
      {
        title: 'Cách 2: Import hàng loạt (Nhanh hơn)',
        content: '1. Chọn "📋 Import hàng loạt"\n2. Chọn ngôn ngữ và bài học\n3. Nhập theo format:\n   - Tiếng Nhật: kanji=hiragana=nghĩa (mỗi dòng một từ)\n   - Tiếng Trung: hanzi=pinyin=nghĩa (mỗi dòng một từ)\n4. Xem preview để kiểm tra\n5. Nhấn "Lưu"',
        example: 'Tiếng Nhật:\n私=わたし=Tôi\n学生=がくせい=Học sinh\n\nTiếng Trung:\n你好=nǐ hǎo=Xin chào\n谢谢=xiè xie=Cảm ơn'
      },
      {
        title: '💡 Mẹo: Dùng AI để tạo từ vựng',
        content: 'Bạn có thể nhờ AI tạo danh sách từ vựng:\n1. Copy hướng dẫn trong phần "Hướng dẫn JSON/format cho AI"\n2. Gửi cho AI (ChatGPT, Claude, etc.)\n3. Copy kết quả và dán vào ô "Import hàng loạt"\n4. Kiểm tra preview và lưu'
      }
    ],
    kanji: [
      {
        title: 'Cách 1: Thêm từng Kanji/Hán tự',
        content: '1. Chọn ngôn ngữ\n2. Chọn bài học\n3. Điền:\n   - Tiếng Nhật: Kanji, Nghĩa, Âm On, Âm Kun, Số nét\n   - Tiếng Trung: Hán tự, Nghĩa, Pinyin, Bộ thủ, Số nét\n4. Thêm ví dụ (tùy chọn)\n5. Nhấn "Lưu"',
        example: 'Tiếng Nhật:\n- Kanji: 学\n- Nghĩa: Học\n- Âm On: ガク\n- Âm Kun: まなぶ\n- Số nét: 8'
      },
      {
        title: 'Cách 2: Import hàng loạt',
        content: '1. Chọn "Import hàng loạt"\n2. Nhập theo format:\n   - Tiếng Nhật: kanji=nghĩa hoặc kanji=nghĩa=onyomi1|onyomi2=kunyomi1|kunyomi2=số_nét\n   - Tiếng Trung: hanzi=nghĩa hoặc hanzi=nghĩa=pinyin=bộ_thủ=số_nét\n3. Xem preview và lưu',
        example: 'Tiếng Nhật:\n学=Học\n校=Trường học=コウ|=がっこう=10\n\nTiếng Trung:\n学=Học=xué=子=8\n习=Ôn tập=xí=乙=3'
      }
    ],
    grammar: [
      {
        title: 'Cách thêm ngữ pháp',
        content: '1. Chọn ngôn ngữ và bài học\n2. Nhập:\n   - Pattern: Mẫu ngữ pháp (ví dụ: 〜たいです)\n   - Nghĩa: Ý nghĩa tiếng Việt\n   - Giải thích: Cách dùng (tùy chọn)\n3. Thêm ví dụ (tùy chọn):\n   - Câu tiếng Nhật/Trung\n   - Romaji/Pinyin (tùy chọn)\n   - Dịch tiếng Việt\n4. Nhấn "Lưu"',
        example: 'Pattern: 〜たいです\nNghĩa: Muốn làm gì đó\nVí dụ:\n- 食べたいです (Tôi muốn ăn)\n- 行きたいです (Tôi muốn đi)'
      },
      {
        title: 'Import hàng loạt',
        content: 'Format: pattern=nghĩa hoặc pattern=nghĩa=giải_thích\nMỗi dòng một mẫu ngữ pháp',
        example: '〜たいです=Muốn làm gì đó\n〜てください=Hãy làm gì đó\n〜てもいいです=Có thể làm gì đó'
      }
    ],
    listening: [
      {
        title: 'Tạo bài nghe',
        content: '1. Chọn ngôn ngữ và bài học\n2. Nhập tiêu đề bài nghe\n3. Upload file audio (MP3, WAV) - tùy chọn\n4. Upload hình ảnh - tùy chọn\n5. Nhập transcript (nội dung bài nghe bằng tiếng Nhật/Trung)\n6. Thêm câu hỏi:\n   - Câu hỏi\n   - 4 đáp án (A, B, C, D)\n   - Chọn đáp án đúng\n7. Nhấn "Lưu"',
        example: 'Tiêu đề: "Chào hỏi tại nhà hàng"\nTranscript: "いらっしゃいませ。何名様ですか？"\nCâu hỏi: "Nhân viên hỏi gì?"\nĐáp án: A. Số người, B. Tên, C. Tuổi, D. Địa chỉ'
      },
      {
        title: '💡 Dùng AI tạo bài nghe',
        content: '1. Copy hướng dẫn JSON trong form\n2. Gửi cho AI để tạo bài nghe + câu hỏi\n3. Copy JSON kết quả và dán vào ô "Dán JSON"\n4. Nhấn "Parse JSON" để tự động điền form\n5. Kiểm tra và chỉnh sửa nếu cần\n6. Upload audio và hình ảnh\n7. Lưu'
      }
    ],
    games: [
      {
        title: 'Tạo game sắp xếp câu',
        content: '1. Chọn ngôn ngữ và bài học\n2. Nhập câu tiếng Nhật/Trung (đã tách từ bằng khoảng trắng)\n3. Nhập nghĩa tiếng Việt\n4. Nhập các từ (cách nhau bằng dấu phẩy)\n5. Nhập thứ tự đúng (số, cách nhau bằng dấu phẩy)\n6. Nhấn "Lưu"',
        example: 'Câu: "私 は 学生 です"\nNghĩa: "Tôi là học sinh"\nTừ: "私, は, 学生, です"\nThứ tự: "0, 1, 2, 3"'
      },
      {
        title: 'Import hàng loạt',
        content: 'Format: câu_đã_tách_từ=nghĩa\nMỗi dòng một câu',
        example: '私 は 学生 です=Tôi là học sinh\nこれは 本 です=Đây là quyển sách'
      }
    ],
    roleplay: [
      {
        title: 'Tạo kịch bản roleplay',
        content: '1. Chọn ngôn ngữ và bài học\n2. Nhập tiêu đề và mô tả\n3. Mô tả tình huống\n4. Đặt tên 2 nhân vật\n5. Viết lời thoại cho từng nhân vật (mỗi câu một dòng)\n6. Thêm từ vựng gợi ý (tùy chọn)\n7. Thêm điểm ngữ pháp (tùy chọn)\n8. Chọn độ khó\n9. Upload hình ảnh (tùy chọn)\n10. Nhấn "Lưu"',
        example: 'Tình huống: Đặt bàn tại nhà hàng\nNhân vật A: Khách hàng\nNhân vật B: Nhân viên\nLời thoại A:\n- Xin chào\n- Tôi muốn đặt bàn cho 2 người\nLời thoại B:\n- Xin chào, chào mừng\n- Vâng, để tôi kiểm tra'
      },
      {
        title: '💡 Dùng AI tạo roleplay',
        content: '1. Copy hướng dẫn JSON trong form\n2. Gửi cho AI để tạo kịch bản\n3. Copy JSON kết quả và dán vào ô "Dán JSON"\n4. Nhấn "Parse JSON" để tự động điền\n5. Kiểm tra và chỉnh sửa\n6. Lưu'
      }
    ]
  };

  const currentGuide = guides[type] || [];

  return (
    <div className="help-guide-overlay" onClick={onClose}>
      <div className="help-guide-modal" onClick={(e) => e.stopPropagation()}>
        <div className="help-guide-header">
          <h2>📚 Hướng dẫn sử dụng: {getTypeLabel(type)}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="help-guide-content">
          {currentGuide.length > 0 ? (
            <>
              <div className="help-steps">
                {currentGuide.map((step, index) => (
                  <div key={index} className={`help-step ${currentStep === index ? 'active' : ''}`}>
                    <div className="step-number">{index + 1}</div>
                    <div className="step-content">
                      <h3>{step.title}</h3>
                      <p style={{ whiteSpace: 'pre-line' }}>{step.content}</p>
                      {step.example && (
                        <div className="step-example">
                          <strong>Ví dụ:</strong>
                          <pre>{step.example}</pre>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="help-navigation">
                <button
                  onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                  disabled={currentStep === 0}
                  className="btn btn-outline"
                >
                  ← Trước
                </button>
                <span className="step-indicator">
                  Bước {currentStep + 1} / {currentGuide.length}
                </span>
                <button
                  onClick={() => setCurrentStep(Math.min(currentGuide.length - 1, currentStep + 1))}
                  disabled={currentStep === currentGuide.length - 1}
                  className="btn btn-outline"
                >
                  Sau →
                </button>
              </div>
            </>
          ) : (
            <p>Chưa có hướng dẫn cho phần này.</p>
          )}

          <div className="help-tips">
            <h3>💡 Mẹo chung:</h3>
            <ul>
              <li>Luôn chọn đúng ngôn ngữ (Tiếng Nhật hoặc Tiếng Trung)</li>
              <li>Chọn bài học trước khi thêm từ vựng, kanji, ngữ pháp</li>
              <li>Dùng "Import hàng loạt" để thêm nhiều mục cùng lúc</li>
              <li>Xem preview trước khi lưu để kiểm tra</li>
              <li>Dùng AI để tạo nội dung nhanh hơn (xem hướng dẫn trong form)</li>
              <li>Nếu có lỗi, đọc thông báo lỗi và sửa theo hướng dẫn</li>
            </ul>
          </div>
        </div>

        <div className="help-guide-footer">
          <button className="btn btn-primary" onClick={onClose}>
            Đã hiểu, đóng hướng dẫn
          </button>
        </div>
      </div>
    </div>
  );
};

function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    courses: 'Khóa học',
    lessons: 'Bài học',
    vocabulary: 'Từ vựng',
    kanji: 'Kanji/Hán tự',
    grammar: 'Ngữ pháp',
    listening: 'Bài nghe',
    games: 'Game',
    roleplay: 'Roleplay'
  };
  return labels[type] || type;
}

export default AdminHelpGuide;


