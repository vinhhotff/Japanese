-- ============================================
-- SAMPLE DATA INSERT - Chạy trong Supabase SQL Editor
-- Chỉ INSERT dữ liệu mẫu, không tạo bảng
-- ============================================

-- ============================================
-- 1. COURSES - Khóa học
-- ============================================

INSERT INTO public.courses (level, title, description, language) VALUES
    ('N5', 'JLPT N5 - Tiếng Nhật Cơ bản', 'Khóa học tiếng Nhật cơ bản dành cho người mới bắt đầu', 'japanese'),
    ('N4', 'JLPT N4 - Tiếng Nhật Sơ cấp', 'Khóa học tiếng Nhật sơ cấp, nâng cao từ vựng và ngữ pháp', 'japanese'),
    ('N3', 'JLPT N3 - Tiếng Nhật Trung cấp', 'Khóa học tiếng Nhật trung cấp', 'japanese'),
    ('N2', 'JLPT N2 - Tiếng Nhật Cao cấp', 'Khóa học tiếng Nhật cao cấp', 'japanese'),
    ('HSK1', 'HSK 1 - Tiếng Trung Cơ bản', 'Khóa học tiếng Trung cơ bản (100 từ)', 'chinese'),
    ('HSK2', 'HSK 2 - Tiếng Trung Sơ cấp', 'Khóa học tiếng Trung sơ cấp (300 từ)', 'chinese'),
    ('HSK3', 'HSK 3 - Tiếng Trung Trung cấp', 'Khóa học tiếng Trung trung cấp (600 từ)', 'chinese')
ON CONFLICT DO NOTHING;

-- ============================================
-- 2. LESSONS - Bài học (Lấy course_id từ bảng courses)
-- ============================================

DO $$
DECLARE
    n5_uuid UUID;
    n4_uuid UUID;
    hsk1_uuid UUID;
    hsk2_uuid UUID;
BEGIN
    SELECT id INTO n5_uuid FROM public.courses WHERE level = 'N5' AND language = 'japanese' LIMIT 1;
    SELECT id INTO n4_uuid FROM public.courses WHERE level = 'N4' AND language = 'japanese' LIMIT 1;
    SELECT id INTO hsk1_uuid FROM public.courses WHERE level = 'HSK1' AND language = 'chinese' LIMIT 1;
    SELECT id INTO hsk2_uuid FROM public.courses WHERE level = 'HSK2' AND language = 'chinese' LIMIT 1;

    -- N5 Lessons
    IF n5_uuid IS NOT NULL THEN
        INSERT INTO public.lessons (course_id, title, lesson_number, level, language) VALUES
            (n5_uuid, 'Bài 1: Chào hỏi và xin chào', 1, 'N5', 'japanese'),
            (n5_uuid, 'Bài 2: Giới thiệu bản thân', 2, 'N5', 'japanese'),
            (n5_uuid, 'Bài 3: Gia đình', 3, 'N5', 'japanese'),
            (n5_uuid, 'Bài 4: Thời gian và ngày tháng', 4, 'N5', 'japanese'),
            (n5_uuid, 'Bài 5: Mua sắm và thanh toán', 5, 'N5', 'japanese'),
            (n5_uuid, 'Bài 6: Địa điểm và phương hướng', 6, 'N5', 'japanese'),
            (n5_uuid, 'Bài 7: Ăn uống tại nhà hàng', 7, 'N5', 'japanese'),
            (n5_uuid, 'Bài 8: Giao thông và di chuyển', 8, 'N5', 'japanese'),
            (n5_uuid, 'Bài 9: Điện thoại và liên lạc', 9, 'N5', 'japanese'),
            (n5_uuid, 'Bài 10: Ôn tập tổng hợp', 10, 'N5', 'japanese')
        ON CONFLICT DO NOTHING;
    END IF;

    -- N4 Lessons
    IF n4_uuid IS NOT NULL THEN
        INSERT INTO public.lessons (course_id, title, lesson_number, level, language) VALUES
            (n4_uuid, 'Bài 1: Mô tả người và vật', 1, 'N4', 'japanese'),
            (n4_uuid, 'Bài 2: Mô tả tình huống', 2, 'N4', 'japanese'),
            (n4_uuid, 'Bài 3: So sánh và đối chiếu', 3, 'N4', 'japanese'),
            (n4_uuid, 'Bài 4: Nguyện vọng và mong muốn', 4, 'N4', 'japanese'),
            (n4_uuid, 'Bài 5: Kế hoạch và dự định', 5, 'N4', 'japanese')
        ON CONFLICT DO NOTHING;
    END IF;

    -- HSK1 Lessons
    IF hsk1_uuid IS NOT NULL THEN
        INSERT INTO public.lessons (course_id, title, lesson_number, level, language) VALUES
            (hsk1_uuid, 'Bài 1: Chào hỏi', 1, 'HSK1', 'chinese'),
            (hsk1_uuid, 'Bài 2: Giới thiệu', 2, 'HSK1', 'chinese'),
            (hsk1_uuid, 'Bài 3: Gia đình', 3, 'HSK1', 'chinese'),
            (hsk1_uuid, 'Bài 4: Số đếm', 4, 'HSK1', 'chinese'),
            (hsk1_uuid, 'Bài 5: Mua sắm', 5, 'HSK1', 'chinese'),
            (hsk1_uuid, 'Bài 6: Ăn uống', 6, 'HSK1', 'chinese'),
            (hsk1_uuid, 'Bài 7: Đi lại', 7, 'HSK1', 'chinese'),
            (hsk1_uuid, 'Bài 8: Thời gian', 8, 'HSK1', 'chinese'),
            (hsk1_uuid, 'Bài 9: Địa điểm', 9, 'HSK1', 'chinese'),
            (hsk1_uuid, 'Bài 10: Ôn tập', 10, 'HSK1', 'chinese')
        ON CONFLICT DO NOTHING;
    END IF;

    -- HSK2 Lessons
    IF hsk2_uuid IS NOT NULL THEN
        INSERT INTO public.lessons (course_id, title, lesson_number, level, language) VALUES
            (hsk2_uuid, 'Bài 1: Cuộc sống hàng ngày', 1, 'HSK2', 'chinese'),
            (hsk2_uuid, 'Bài 2: Công việc', 2, 'HSK2', 'chinese'),
            (hsk2_uuid, 'Bài 3: Du lịch', 3, 'HSK2', 'chinese'),
            (hsk2_uuid, 'Bài 4: Sức khỏe', 4, 'HSK2', 'chinese'),
            (hsk2_uuid, 'Bài 5: Giải trí', 5, 'HSK2', 'chinese')
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- ============================================
-- 3. VOCABULARY - Từ vựng (Lấy lesson_id từ bảng lessons)
-- ============================================

DO $$
DECLARE
    jp_lesson1 UUID;
    jp_lesson2 UUID;
    cn_lesson1 UUID;
BEGIN
    -- Japanese Lesson 1: Chào hỏi
    SELECT id INTO jp_lesson1 FROM public.lessons WHERE level = 'N5' AND language = 'japanese' AND lesson_number = 1 LIMIT 1;
    -- Japanese Lesson 2: Giới thiệu
    SELECT id INTO jp_lesson2 FROM public.lessons WHERE level = 'N5' AND language = 'japanese' AND lesson_number = 2 LIMIT 1;
    -- Chinese Lesson 1: Chào hỏi
    SELECT id INTO cn_lesson1 FROM public.lessons WHERE level = 'HSK1' AND language = 'chinese' AND lesson_number = 1 LIMIT 1;

    -- N5 Vocabulary - Bài 1
    IF jp_lesson1 IS NOT NULL THEN
        INSERT INTO public.vocabulary (lesson_id, word, kanji, hiragana, meaning, difficulty) VALUES
            (jp_lesson1, 'おはよう', 'おはよう', 'おはよう', 'Chào buổi sáng (thân mật)', 'easy'),
            (jp_lesson1, 'おはようございます', 'おはようございます', 'おはようございます', 'Chào buổi sáng (lịch sự)', 'easy'),
            (jp_lesson1, 'こんにちは', 'こんにちは', 'こんにちは', 'Xin chào (buổi trưa/chiều)', 'easy'),
            (jp_lesson1, 'こんばんは', 'こんばんは', 'こんばんは', 'Xin chào (buổi tối)', 'easy'),
            (jp_lesson1, 'さようなら', 'さようなら', 'さようなら', 'Tạm biệt', 'easy'),
            (jp_lesson1, 'ありがとうございます', 'ありがとうございます', 'ありがとうございます', 'Cảm ơn (lịch sự)', 'easy'),
            (jp_lesson1, 'すみません', 'すみません', 'すみません', 'Xin lỗi / Xin phép', 'easy'),
            (jp_lesson1, 'はい', 'はい', 'はい', 'Vâng / Đúng', 'easy'),
            (jp_lesson1, 'いいえ', 'いいえ', 'いいえ', 'Không', 'easy'),
            (jp_lesson1, 'お願いします', 'お願いします', 'おねがいします', 'Xin nhờ / Làm ơn', 'easy')
        ON CONFLICT DO NOTHING;
    END IF;

    -- N5 Vocabulary - Bài 2: Giới thiệu
    IF jp_lesson2 IS NOT NULL THEN
        INSERT INTO public.vocabulary (lesson_id, word, kanji, hiragana, meaning, difficulty) VALUES
            (jp_lesson2, 'はじめまして', 'はじめまして', 'はじめまして', 'Rất vui được gặp bạn', 'easy'),
            (jp_lesson2, '私は', '私は', 'わたし', 'Tôi là...', 'easy'),
            (jp_lesson2, 'です', 'です', 'です', 'Là (động từ to be)', 'easy'),
            (jp_lesson2, '名前', '名前', 'なまえ', 'Tên', 'easy'),
            (jp_lesson2, '国', '国', 'くに', 'Quốc gia', 'easy'),
            (jp_lesson2, '出身', '出身', 'しゅっしん', 'Xuất thân', 'easy'),
            (jp_lesson2, '大学生', '大学生', 'だいがくせい', 'Sinh viên đại học', 'medium'),
            (jp_lesson2, '仕事', '仕事', 'しごと', 'Công việc', 'medium'),
            (jp_lesson2, '趣味', '趣味', 'しゅみ', 'Sở thích', 'easy'),
            (jp_lesson2, ' 사람', '人', 'ひと', 'Người', 'easy')
        ON CONFLICT DO NOTHING;
    END IF;

    -- HSK1 Vocabulary - Bài 1
    IF cn_lesson1 IS NOT NULL THEN
        INSERT INTO public.vocabulary (lesson_id, word, kanji, hiragana, meaning, difficulty) VALUES
            (cn_lesson1, '你好', '你好', '你好', 'Xin chào', 'easy'),
            (cn_lesson1, '早上好', '早上好', '早上好', 'Chào buổi sáng', 'easy'),
            (cn_lesson1, '再见', '再见', '再见', 'Tạm biệt', 'easy'),
            (cn_lesson1, '谢谢', '谢谢', '谢谢', 'Cảm ơn', 'easy'),
            (cn_lesson1, '不客气', '不客气', '不客气', 'Không có gì', 'easy'),
            (cn_lesson1, '对不起', '对不起', '对不起', 'Xin lỗi', 'easy'),
            (cn_lesson1, '没关系', '没关系', '没关系', 'Không sao', 'easy'),
            (cn_lesson1, '是', '是', '是', 'Là / Vâng', 'easy'),
            (cn_lesson1, '不是', '不是', '不是', 'Không phải', 'easy'),
            (cn_lesson1, '我', '我', '我', 'Tôi', 'easy')
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- ============================================
-- 4. KANJI - Chữ Hán (Lấy lesson_id)
-- ============================================

DO $$
DECLARE
    jp_lesson1 UUID;
    jp_lesson3 UUID;
BEGIN
    SELECT id INTO jp_lesson1 FROM public.lessons WHERE level = 'N5' AND language = 'japanese' AND lesson_number = 1 LIMIT 1;
    SELECT id INTO jp_lesson3 FROM public.lessons WHERE level = 'N5' AND language = 'japanese' AND lesson_number = 3 LIMIT 1;

    -- N5 Kanji - Bài 1
    IF jp_lesson1 IS NOT NULL THEN
        INSERT INTO public.kanji (lesson_id, character, meaning, onyomi, kunyomi, stroke_count) VALUES
            (jp_lesson1, '日', 'Mặt trời / Ngày', ARRAY['ニチ','ジツ'], ARRAY['ひ','か'], 4),
            (jp_lesson1, '月', 'Mặt trăng / Tháng', ARRAY['ゲツ','ガツ'], ARRAY['つき'], 4),
            (jp_lesson1, '火', 'Lửa', ARRAY['カ'], ARRAY['ひ'], 4),
            (jp_lesson1, '水', 'Nước', ARRAY['スイ'], ARRAY['みず'], 4),
            (jp_lesson1, '木', 'Cây', ARRAY['モク','ボク'], ARRAY['き'], 4),
            (jp_lesson1, '金', 'Vàng / Tiền', ARRAY['キン','コン'], ARRAY['かね'], 8),
            (jp_lesson1, '土', 'Đất', ARRAY['ド','ト'], ARRAY['つち'], 3),
            (jp_lesson1, '人', 'Người', ARRAY['ジン','ニン'], ARRAY['ひと'], 2),
            (jp_lesson1, '大', 'Lớn', ARRAY['ダイ','タイ'], ARRAY['おお'], 3),
            (jp_lesson1, '小', 'Nhỏ', ARRAY['ショウ'], ARRAY['ちいさい','こ'], 3)
        ON CONFLICT DO NOTHING;
    END IF;

    -- N5 Kanji - Bài 3: Gia đình
    IF jp_lesson3 IS NOT NULL THEN
        INSERT INTO public.kanji (lesson_id, character, meaning, onyomi, kunyomi, stroke_count) VALUES
            (jp_lesson3, '父', 'Cha', ARRAY['フ'], ARRAY['ちち'], 4),
            (jp_lesson3, '母', 'Mẹ', ARRAY['ボ'], ARRAY['はは'], 5),
            (jp_lesson3, '兄', 'Anh trai', ARRAY['ケイ'], ARRAY['あに'], 5),
            (jp_lesson3, '姉', 'Chị gái', ARRAY['シ'], ARRAY['あね'], 5),
            (jp_lesson3, '弟', 'Em trai', ARRAY['テイ','ダイ'], ARRAY['おとうと'], 7),
            (jp_lesson3, '妹', 'Em gái', ARRAY['マイ'], ARRAY['いもうと'], 8),
            (jp_lesson3, '子', 'Con / Trẻ em', ARRAY['シ','ス'], ARRAY['こ'], 3),
            (jp_lesson3, '男', 'Nam', ARRAY['ダン','ナン'], ARRAY['おとこ'], 7),
            (jp_lesson3, '女', 'Nữ', ARRAY['ジョ','ニョ'], ARRAY['おんな'], 3),
            (jp_lesson3, '家', 'Nhà / Gia đình', ARRAY['カ','ケ'], ARRAY['いえ','や'], 10)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- ============================================
-- 5. GRAMMAR - Ngữ pháp (Lấy lesson_id)
-- ============================================

DO $$
DECLARE
    jp_lesson1 UUID;
    jp_lesson2 UUID;
BEGIN
    SELECT id INTO jp_lesson1 FROM public.lessons WHERE level = 'N5' AND language = 'japanese' AND lesson_number = 1 LIMIT 1;
    SELECT id INTO jp_lesson2 FROM public.lessons WHERE level = 'N5' AND language = 'japanese' AND lesson_number = 2 LIMIT 1;

    -- N5 Grammar - Bài 1
    IF jp_lesson1 IS NOT NULL THEN
        INSERT INTO public.grammar (lesson_id, pattern, meaning, explanation) VALUES
            (jp_lesson1, 'A は B です', 'A là B', 'Cấu trúc khẳng định cơ bản'),
            (jp_lesson1, 'A は B ではありません', 'A không phải là B', 'Cấu trúc phủ định'),
            (jp_lesson1, 'A は B ですか？', 'A có phải là B không?', 'Câu hỏi yes/no'),
            (jp_lesson1, 'はい、そうです', 'Vâng, đúng vậy', 'Trả lời khẳng định'),
            (jp_lesson1, 'いいえ、違います', 'Không, không đúng', 'Trả lời phủ định'),
            (jp_lesson1, 'A も B です', 'A cũng là B', 'Nghĩa "cũng"'),
            (jp_lesson1, 'A ですか？B ですか？', 'A hay B?', 'Câu hỏi lựa chọn')
        ON CONFLICT DO NOTHING;
    END IF;

    -- N5 Grammar - Bài 2
    IF jp_lesson2 IS NOT NULL THEN
        INSERT INTO public.grammar (lesson_id, pattern, meaning, explanation) VALUES
            (jp_lesson2, '私は [N] です', 'Tôi là [N]', 'Giới thiệu bản thân'),
            (jp_lesson2, 'これは [N] です', 'Đây là [N]', 'Chỉ định đồ vật gần'),
            (jp_lesson2, 'そこから [N] ですか？', 'Từ đó là [N] không?', 'Hỏi nguồn gốc'),
            (jp_lesson2, '姓 / 名字', 'Họ', 'Họ (family name)'),
            (jp_lesson2, '名 / 名前', 'Tên', 'Tên (given name)'),
            (jp_lesson2, 'おなまえは？', 'Tên bạn là gì?', 'Hỏi tên (lịch sự)')
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- ============================================
-- 6. LISTENING EXERCISES - Bài nghe
-- ============================================

DO $$
DECLARE
    jp_lesson1 UUID;
BEGIN
    SELECT id INTO jp_lesson1 FROM public.lessons WHERE level = 'N5' AND language = 'japanese' AND lesson_number = 1 LIMIT 1;

    IF jp_lesson1 IS NOT NULL THEN
        INSERT INTO public.listening_exercises (lesson_id, title, audio_url, transcript, difficulty) VALUES
            (jp_lesson1, 'Chào hỏi cơ bản', '', 'おはようございます。こんにちは。こんばんは。', 'easy'),
            (jp_lesson1, 'Cảm ơn và xin lỗi', '', 'ありがとうございます。すみません。', 'easy')
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- ============================================
-- 7. SPEAKING EXERCISES - Bài nói
-- ============================================

DO $$
DECLARE
    jp_lesson1 UUID;
    cn_lesson1 UUID;
BEGIN
    SELECT id INTO jp_lesson1 FROM public.lessons WHERE level = 'N5' AND language = 'japanese' AND lesson_number = 1 LIMIT 1;
    SELECT id INTO cn_lesson1 FROM public.lessons WHERE level = 'HSK1' AND language = 'chinese' AND lesson_number = 1 LIMIT 1;

    -- Japanese Speaking - Bài 1
    IF jp_lesson1 IS NOT NULL THEN
        INSERT INTO public.speaking_exercises (lesson_id, title, text, pronunciation, translation, difficulty) VALUES
            (jp_lesson1, 'Chào buổi sáng', 'おはようございます', 'おはようございます', 'Chào buổi sáng (lịch sự)', 'easy'),
            (jp_lesson1, 'Cảm ơn', 'ありがとうございます', 'ありがとうございます', 'Cảm ơn', 'easy'),
            (jp_lesson1, 'Xin lỗi', 'すみません', 'すみません', 'Xin lỗi', 'easy'),
            (jp_lesson1, 'Tạm biệt', 'さようなら', 'さようなら', 'Tạm biệt', 'easy'),
            (jp_lesson1, 'Rất vui được gặp', 'はじめまして', 'はじめまして', 'Rất vui được gặp bạn', 'easy')
        ON CONFLICT DO NOTHING;
    END IF;

    -- Chinese Speaking - Bài 1
    IF cn_lesson1 IS NOT NULL THEN
        INSERT INTO public.speaking_exercises (lesson_id, title, text, pronunciation, translation, difficulty) VALUES
            (cn_lesson1, 'Xin chào', '你好', 'Nǐ hǎo', 'Xin chào', 'easy'),
            (cn_lesson1, 'Cảm ơn', '谢谢', 'Xièxie', 'Cảm ơn', 'easy'),
            (cn_lesson1, 'Tạm biệt', '再见', 'Zàijiàn', 'Tạm biệt', 'easy'),
            (cn_lesson1, 'Xin lỗi', '对不起', 'Duìbuqǐ', 'Xin lỗi', 'easy'),
            (cn_lesson1, 'Không sao', '没关系', 'Méi guānxi', 'Không sao', 'easy')
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- ============================================
-- 8. SENTENCE GAMES - Game sắp xếp câu
-- ============================================

DO $$
DECLARE
    jp_lesson1 UUID;
BEGIN
    SELECT id INTO jp_lesson1 FROM public.lessons WHERE level = 'N5' AND language = 'japanese' AND lesson_number = 1 LIMIT 1;

    IF jp_lesson1 IS NOT NULL THEN
        INSERT INTO public.sentence_games (lesson_id, title, sentences, difficulty) VALUES
            (jp_lesson1, 'Sắp xếp câu cơ bản', 
             '["[\"おはよう\",\"ございます\"]", \"[\"こんにちは\",\"です\"]\", \"[\"ありがとう\",\"ございます\"]\"]', 
             'easy')
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- ============================================
-- 9. ROLEPLAY SCENARIOS - Tình huống đối thoại
-- ============================================

INSERT INTO public.roleplay_scenarios (title, description, scenario_type, language) VALUES
    ('Tại cửa hàng', 'Mua sắm tại cửa hàng tiện lợi', 'shopping', 'japanese'),
    ('Tại nhà hàng', 'Gọi món và thanh toán', 'restaurant', 'japanese'),
    ('Tại khách sạn', 'Nhận phòng và hỏi dịch vụ', 'hotel', 'japanese'),
    ('Giao tiếp công việc', 'Phỏng vấn xin việc', 'interview', 'japanese'),
    ('Tại bệnh viện', 'Khám bệnh và mua thuốc', 'doctor', 'japanese'),
    ('Tại cửa hàng (Trung)', 'Mua sắm tại cửa hàng', 'shopping', 'chinese'),
    ('Tại nhà hàng (Trung)', 'Gọi món và thanh toán', 'restaurant', 'chinese'),
    ('Khách sạn (Trung)', 'Nhận phòng khách sạn', 'hotel', 'chinese')
ON CONFLICT DO NOTHING;

-- ============================================
-- DONE! Kiểm tra dữ liệu
-- ============================================

-- SELECT 'Courses:' as info, COUNT(*) as total FROM public.courses;
-- SELECT 'Lessons:' as info, COUNT(*) as total FROM public.lessons;
-- SELECT 'Vocabulary:' as info, COUNT(*) as total FROM public.vocabulary;
-- SELECT 'Kanji:' as info, COUNT(*) as total FROM public.kanji;
-- SELECT 'Grammar:' as info, COUNT(*) as total FROM public.grammar;
-- SELECT 'Speaking:' as info, COUNT(*) as total FROM public.speaking_exercises;
