-- ============================================
-- QUICK DATA INSERT - Import nhanh không cần thêm từng từ
-- Chạy trong Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. COURSES - Khóa học (KHÔNG có is_premium)
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
-- 2. LESSONS - Bài học
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
-- 3. VOCABULARY - Từ vựng
-- ============================================

DO $$
DECLARE
    jp_lesson1 UUID;
    jp_lesson2 UUID;
    jp_lesson3 UUID;
    cn_lesson1 UUID;
    cn_lesson2 UUID;
    cn_lesson3 UUID;
BEGIN
    -- Japanese Lessons
    SELECT id INTO jp_lesson1 FROM public.lessons WHERE level = 'N5' AND language = 'japanese' AND lesson_number = 1 LIMIT 1;
    SELECT id INTO jp_lesson2 FROM public.lessons WHERE level = 'N5' AND language = 'japanese' AND lesson_number = 2 LIMIT 1;
    SELECT id INTO jp_lesson3 FROM public.lessons WHERE level = 'N5' AND language = 'japanese' AND lesson_number = 3 LIMIT 1;

    -- Chinese Lessons
    SELECT id INTO cn_lesson1 FROM public.lessons WHERE level = 'HSK1' AND language = 'chinese' AND lesson_number = 1 LIMIT 1;
    SELECT id INTO cn_lesson2 FROM public.lessons WHERE level = 'HSK1' AND language = 'chinese' AND lesson_number = 2 LIMIT 1;
    SELECT id INTO cn_lesson3 FROM public.lessons WHERE level = 'HSK1' AND language = 'chinese' AND lesson_number = 3 LIMIT 1;

    -- ========== JAPANESE VOCABULARY ==========
    
    -- N5 Lesson 1: Greetings
    IF jp_lesson1 IS NOT NULL THEN
        INSERT INTO public.vocabulary (lesson_id, word, kanji, hiragana, meaning, difficulty) VALUES
            (jp_lesson1, 'おはよう', 'おはよう', 'おはよう', 'Chào buổi sáng (thân mật)', 'easy'),
            (jp_lesson1, 'おはようございます', 'おはようございます', 'おはようございます', 'Chào buổi sáng (lịch sự)', 'easy'),
            (jp_lesson1, 'こんにちは', 'こんにちは', 'こんにちは', 'Xin chào (buổi trưa/chiều)', 'easy'),
            (jp_lesson1, 'こんばんは', 'こんばんは', 'こんばんは', 'Xin chào (buổi tối)', 'easy'),
            (jp_lesson1, 'さようなら', 'さようなら', 'さようなら', 'Tạm biệt', 'easy'),
            (jp_lesson1, 'ありがとう', 'ありがとう', 'ありがとう', 'Cảm ơn', 'easy'),
            (jp_lesson1, 'ありがとうございます', 'ありがとうございます', 'ありがとうございます', 'Cảm ơn (lịch sự)', 'easy'),
            (jp_lesson1, 'すみません', 'すみません', 'すみません', 'Xin lỗi / Xin phép', 'easy'),
            (jp_lesson1, 'はい', 'はい', 'はい', 'Vâng / Đúng', 'easy'),
            (jp_lesson1, 'いいえ', 'いいえ', 'いいえ', 'Không', 'easy'),
            (jp_lesson1, 'お願いします', 'お願いします', 'おねがいします', 'Xin nhờ / Làm ơn', 'easy'),
            (jp_lesson1, 'はじめまして', 'はじめまして', 'はじめまして', 'Rất vui được gặp bạn', 'easy'),
            (jp_lesson1, 'こちらこそ', 'こちらこそ', 'こちらこそ', 'Tôi mới là người may mắn', 'easy'),
            (jp_lesson1, 'おやすみ', 'おやすみ', 'おやすみ', 'Ngủ ngon', 'easy'),
            (jp_lesson1, 'いただきます', 'いただきます', 'いただきます', 'Xin phép (trước khi ăn)', 'easy'),
            (jp_lesson1, 'ごちそうさま', 'ごちそうさま', 'ごちそうさま', 'Cảm ơn về bữa ăn', 'easy')
        ON CONFLICT DO NOTHING;
    END IF;

    -- N5 Lesson 2: Self Introduction
    IF jp_lesson2 IS NOT NULL THEN
        INSERT INTO public.vocabulary (lesson_id, word, kanji, hiragana, meaning, difficulty) VALUES
            (jp_lesson2, 'わたし', '私', 'わたし', 'Tôi', 'easy'),
            (jp_lesson2, 'あなた', 'あなた', 'あなた', 'Bạn', 'easy'),
            (jp_lesson2, 'かれ', '彼', 'かれ', 'Anh ấy', 'easy'),
            (jp_lesson2, 'かのじょ', '彼女', 'かのじょ', 'Cô ấy', 'easy'),
            (jp_lesson2, 'あのひと', 'あの人', 'あのひと', 'Người kia', 'easy'),
            (jp_lesson2, 'なまえ', '名前', 'なまえ', 'Tên', 'easy'),
            (jp_lesson2, 'くに', '国', 'くに', 'Quốc gia', 'easy'),
            (jp_lesson2, 'しゅっしん', '出身', 'しゅっしん', 'Xuất thân', 'easy'),
            (jp_lesson2, 'だいがくせい', '大学生', 'だいがくせい', 'Sinh viên đại học', 'medium'),
            (jp_lesson2, 'いしゃ', '医者', 'いしゃ', 'Bác sĩ', 'medium'),
            (jp_lesson2, 'かんごし', '看護師', 'かんごし', 'Y tá', 'medium'),
            (jp_lesson2, 'がくせい', '学生', 'がくせい', 'Học sinh/Sinh viên', 'easy'),
            (jp_lesson2, 'せんせい', '先生', 'せんせい', 'Thầy/Cô giáo', 'easy'),
            (jp_lesson2, 'しごと', '仕事', 'しごと', 'Công việc', 'medium'),
            (jp_lesson2, 'しゅみ', '趣味', 'しゅみ', 'Sở thích', 'easy'),
            (jp_lesson2, '家族的', '家族', 'かぞく', 'Gia đình', 'easy')
        ON CONFLICT DO NOTHING;
    END IF;

    -- N5 Lesson 3: Family
    IF jp_lesson3 IS NOT NULL THEN
        INSERT INTO public.vocabulary (lesson_id, word, kanji, hiragana, meaning, difficulty) VALUES
            (jp_lesson3, 'かぞく', '家族', 'かぞく', 'Gia đình', 'easy'),
            (jp_lesson3, 'ちち', '父', 'ちち', 'Cha', 'easy'),
            (jp_lesson3, 'はは', '母', 'はは', 'Mẹ', 'easy'),
            (jp_lesson3, 'あに', '兄', 'あに', 'Anh trai', 'easy'),
            (jp_lesson3, 'あね', '姉', 'あね', 'Chị gái', 'easy'),
            (jp_lesson3, 'おとうと', '弟', 'おとうと', 'Em trai', 'easy'),
            (jp_lesson3, 'いもうと', '妹', 'いもうと', 'Em gái', 'easy'),
            (jp_lesson3, 'はいとこ', '従兄弟', 'はいとこ', 'Anh em họ', 'medium'),
            (jp_lesson3, 'しまい', '姉妹', 'しまい', 'Chị em', 'medium'),
            (jp_lesson3, 'おじ', '叔父', 'おじ', 'Chú/Bác trai', 'easy'),
            (jp_lesson3, 'おば', '叔母', 'おば', 'Cô/Bác gái', 'easy'),
            (jp_lesson3, 'こ', '子', 'こ', 'Con', 'easy'),
            (jp_lesson3, 'ふうふ', '夫婦', 'ふうふ', 'Vợ chồng', 'medium'),
            (jp_lesson3, 'おくさん', '奥さん', 'おくさん', 'Vợ (kính ngữ)', 'easy'),
            (jp_lesson3, 'だんな', 'だんな', 'だんな', 'Chồng (kính ngữ)', 'easy')
        ON CONFLICT DO NOTHING;
    END IF;

    -- ========== CHINESE VOCABULARY ==========
    -- Với tiếng Trung: dùng chính từ làm kanji và hiragana (vì không có hiragana thực)

    -- HSK1 Lesson 1: Greetings
    IF cn_lesson1 IS NOT NULL THEN
        INSERT INTO public.vocabulary (lesson_id, word, kanji, hiragana, meaning, difficulty) VALUES
            (cn_lesson1, '你好', '你好', '你好', 'Xin chào', 'easy'),
            (cn_lesson1, '早上好', '早上好', '早上好', 'Chào buổi sáng', 'easy'),
            (cn_lesson1, '中午好', '中午好', '中午好', 'Chào buổi trưa', 'easy'),
            (cn_lesson1, '晚上好', '晚上好', '晚上好', 'Chào buổi tối', 'easy'),
            (cn_lesson1, '再见', '再见', '再见', 'Tạm biệt', 'easy'),
            (cn_lesson1, '谢谢', '谢谢', '谢谢', 'Cảm ơn', 'easy'),
            (cn_lesson1, '不客气', '不客气', '不客气', 'Không có gì', 'easy'),
            (cn_lesson1, '对不起', '对不起', '对不起', 'Xin lỗi', 'easy'),
            (cn_lesson1, '没关系', '没关系', '没关系', 'Không sao', 'easy'),
            (cn_lesson1, '是', '是', '是', 'Là / Vâng', 'easy'),
            (cn_lesson1, '不是', '不是', '不是', 'Không phải', 'easy'),
            (cn_lesson1, '我', '我', '我', 'Tôi', 'easy'),
            (cn_lesson1, '你', '你', '你', 'Bạn', 'easy'),
            (cn_lesson1, '他', '他', '他', 'Anh ấy', 'easy'),
            (cn_lesson1, '她', '她', '她', 'Cô ấy', 'easy')
        ON CONFLICT DO NOTHING;
    END IF;

    -- HSK1 Lesson 2: Introduction
    IF cn_lesson2 IS NOT NULL THEN
        INSERT INTO public.vocabulary (lesson_id, word, kanji, hiragana, meaning, difficulty) VALUES
            (cn_lesson2, '名字', '名字', '名字', 'Tên', 'easy'),
            (cn_lesson2, '姓', '姓', '姓', 'Họ (family name)', 'easy'),
            (cn_lesson2, '国家', '国家', '国家', 'Quốc gia', 'easy'),
            (cn_lesson2, '人', '人', '人', 'Người', 'easy'),
            (cn_lesson2, '老师', '老师', '老师', 'Thầy/Cô giáo', 'easy'),
            (cn_lesson2, '学生', '学生', '学生', 'Học sinh', 'easy'),
            (cn_lesson2, '朋友', '朋友', '朋友', 'Bạn bè', 'easy'),
            (cn_lesson2, '工作', '工作', '工作', 'Công việc', 'easy'),
            (cn_lesson2, '学习', '学习', '学习', 'Học tập', 'easy'),
            (cn_lesson2, '语言', '语言', '语言', 'Ngôn ngữ', 'easy'),
            (cn_lesson2, '中文', '中文', '中文', 'Tiếng Trung', 'easy'),
            (cn_lesson2, '英文', '英文', '英文', 'Tiếng Anh', 'easy'),
            (cn_lesson2, '日文', '日文', '日文', 'Tiếng Nhật', 'easy'),
            (cn_lesson2, '公司', '公司', '公司', 'Công ty', 'medium'),
            (cn_lesson2, '医院', '医院', '医院', 'Bệnh viện', 'medium')
        ON CONFLICT DO NOTHING;
    END IF;

    -- HSK1 Lesson 3: Family
    IF cn_lesson3 IS NOT NULL THEN
        INSERT INTO public.vocabulary (lesson_id, word, kanji, hiragana, meaning, difficulty) VALUES
            (cn_lesson3, '家人', '家人', '家人', 'Gia đình', 'easy'),
            (cn_lesson3, '父亲', '父亲', '父亲', 'Cha', 'easy'),
            (cn_lesson3, '母亲', '母亲', '母亲', 'Mẹ', 'easy'),
            (cn_lesson3, '爸爸', '爸爸', '爸爸', 'Bố', 'easy'),
            (cn_lesson3, '妈妈', '妈妈', '妈妈', 'Mẹ', 'easy'),
            (cn_lesson3, '哥哥', '哥哥', '哥哥', 'Anh trai', 'easy'),
            (cn_lesson3, '姐姐', '姐姐', '姐姐', 'Chị gái', 'easy'),
            (cn_lesson3, '弟弟', '弟弟', '弟弟', 'Em trai', 'easy'),
            (cn_lesson3, '妹妹', '妹妹', '妹妹', 'Em gái', 'easy'),
            (cn_lesson3, '儿子', '儿子', '儿子', 'Con trai', 'easy'),
            (cn_lesson3, '女儿', '女儿', '女儿', 'Con gái', 'easy'),
            (cn_lesson3, '丈夫', '丈夫', '丈夫', 'Chồng', 'easy'),
            (cn_lesson3, '妻子', '妻子', '妻子', 'Vợ', 'easy'),
            (cn_lesson3, '孩子', '孩子', '孩子', 'Con cái', 'easy'),
            (cn_lesson3, '结婚', '结婚', '结婚', 'Kết hôn', 'medium')
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- ============================================
-- 4. KANJI - Chữ Hán Nhật
-- ============================================

DO $$
DECLARE
    jp_lesson1 UUID;
    jp_lesson3 UUID;
BEGIN
    SELECT id INTO jp_lesson1 FROM public.lessons WHERE level = 'N5' AND language = 'japanese' AND lesson_number = 1 LIMIT 1;
    SELECT id INTO jp_lesson3 FROM public.lessons WHERE level = 'N5' AND language = 'japanese' AND lesson_number = 3 LIMIT 1;

    -- N5 Kanji - Lesson 1 (Basic elements)
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
            (jp_lesson1, '小', 'Nhỏ', ARRAY['ショウ'], ARRAY['ちいさい','こ'], 3),
            (jp_lesson1, '山', 'Núi', ARRAY['サン','セン'], ARRAY['やま'], 3),
            (jp_lesson1, '川', 'Sông', ARRAY['セン'], ARRAY['かわ'], 3),
            (jp_lesson1, '上', 'Trên', ARRAY['ジョウ','ショウ'], ARRAY['うえ','あ'], 3),
            (jp_lesson1, '下', 'Dưới', ARRAY['カ','ゲ'], ARRAY['した','さ'], 3),
            (jp_lesson1, '中', 'Trong', ARRAY['チュウ'], ARRAY['なか'], 4)
        ON CONFLICT DO NOTHING;
    END IF;

    -- N5 Kanji - Lesson 3 (Family)
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
            (jp_lesson3, '家', 'Nhà / Gia đình', ARRAY['カ','ケ'], ARRAY['いえ','や'], 10),
            (jp_lesson3, '親', 'Cha mẹ', ARRAY['シン'], ARRAY['おや'], 16),
            (jp_lesson3, '夫', 'Chồng', ARRAY['フ','ブ'], ARRAY['おっと'], 4),
            (jp_lesson3, '妻', 'Vợ', ARRAY['サイ'], ARRAY['つま'], 8),
            (jp_lesson3, '先生', 'Thầy/Cô', ARRAY['セン','セイ'], ARRAY['せんせい'], 6),
            (jp_lesson3, '学生', 'Học sinh', ARRAY['ガク','ショウ'], ARRAY['がくせい'], 8)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- ============================================
-- 5. GRAMMAR - Ngữ pháp
-- ============================================

DO $$
DECLARE
    jp_lesson1 UUID;
    jp_lesson2 UUID;
    jp_lesson3 UUID;
BEGIN
    SELECT id INTO jp_lesson1 FROM public.lessons WHERE level = 'N5' AND language = 'japanese' AND lesson_number = 1 LIMIT 1;
    SELECT id INTO jp_lesson2 FROM public.lessons WHERE level = 'N5' AND language = 'japanese' AND lesson_number = 2 LIMIT 1;
    SELECT id INTO jp_lesson3 FROM public.lessons WHERE level = 'N5' AND language = 'japanese' AND lesson_number = 3 LIMIT 1;

    -- N5 Grammar - Lesson 1
    IF jp_lesson1 IS NOT NULL THEN
        INSERT INTO public.grammar (lesson_id, pattern, meaning, explanation) VALUES
            (jp_lesson1, 'A は B です', 'A là B', 'Cấu trúc khẳng định cơ bản với động từ to be'),
            (jp_lesson1, 'A は B ではありません', 'A không phải là B', 'Cấu trúc phủ định'),
            (jp_lesson1, 'A は B ですか？', 'A có phải là B không?', 'Câu hỏi yes/no'),
            (jp_lesson1, 'はい、そうです', 'Vâng, đúng vậy', 'Trả lời khẳng định'),
            (jp_lesson1, 'いいえ、違います', 'Không, không đúng', 'Trả lời phủ định'),
            (jp_lesson1, 'A も B です', 'A cũng là B', 'Nghĩa "cũng"'),
            (jp_lesson1, 'A ですか？B ですか？', 'A hay B?', 'Câu hỏi lựa chọn'),
            (jp_lesson1, '√', 'Dạng khẳng định/phủ định', 'Đuôi √ thay cho các biến thể')
        ON CONFLICT DO NOTHING;
    END IF;

    -- N5 Grammar - Lesson 2
    IF jp_lesson2 IS NOT NULL THEN
        INSERT INTO public.grammar (lesson_id, pattern, meaning, explanation) VALUES
            (jp_lesson2, '私は [N] です', 'Tôi là [N]', 'Giới thiệu bản thân'),
            (jp_lesson2, 'これは [N] です', 'Đây là [N]', 'Chỉ định đồ vật gần'),
            (jp_lesson2, 'あれは [N] です', 'Kia là [N]', 'Chỉ định đồ vật xa'),
            (jp_lesson2, 'そこから [N] ですか？', 'Từ đó là [N] không?', 'Hỏi nguồn gốc'),
            (jp_lesson2, '姓 / 名字', 'Họ', 'Họ (family name)'),
            (jp_lesson2, '名 / 名前', 'Tên', 'Tên (given name)'),
            (jp_lesson2, 'おなまえは？', 'Tên bạn là gì?', 'Hỏi tên (lịch sự)'),
            (jp_lesson2, 'はじめまして。どうぞよろしく。', 'Rất vui được gặp. Xin hãy chiếu cố.', 'Cách chào hỏi lịch sự khi gặp lần đầu')
        ON CONFLICT DO NOTHING;
    END IF;

    -- N5 Grammar - Lesson 3
    IF jp_lesson3 IS NOT NULL THEN
        INSERT INTO public.grammar (lesson_id, pattern, meaning, explanation) VALUES
            (jp_lesson3, 'これは [N] です', 'Đây là [N]', 'Giới thiệu đồ vật'),
            (jp_lesson3, 'それ/これ/あれ', 'Cái đó/cái này/cái kia', 'Đại từ chỉ định'),
            (jp_lesson3, 'この/その/あの [N]', 'Cái [N] này/đó/kia', 'Tính từ chỉ định'),
            (jp_lesson3, '誰の [N] ですか？', 'Cái [N] của ai?', 'Hỏi sở hữu'),
            (jp_lesson3, '私の [N]', 'Cái [N] của tôi', 'Sở hữu cá nhân'),
            (jp_lesson3, '[N] は いくらですか？', '[N] bao nhiêu tiền?', 'Hỏi giá tiền'),
            (jp_lesson3, '～円', '～Yên', 'Đơn vị tiền tệ Nhật Bản'),
            (jp_lesson3, '上げます/ください', 'Cho/Tôi xin', 'Yêu cầu/cho nhận')
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- ============================================
-- 6. SPEAKING EXERCISES - Bài luyện nói
-- ============================================

DO $$
DECLARE
    jp_lesson1 UUID;
    cn_lesson1 UUID;
BEGIN
    SELECT id INTO jp_lesson1 FROM public.lessons WHERE level = 'N5' AND language = 'japanese' AND lesson_number = 1 LIMIT 1;
    SELECT id INTO cn_lesson1 FROM public.lessons WHERE level = 'HSK1' AND language = 'chinese' AND lesson_number = 1 LIMIT 1;

    -- Japanese Speaking Exercises
    IF jp_lesson1 IS NOT NULL THEN
        INSERT INTO public.speaking_exercises (lesson_id, title, text, pronunciation, translation, difficulty) VALUES
            (jp_lesson1, 'Chào buổi sáng (thân mật)', 'おはよう', 'おはよう', 'Chào buổi sáng', 'easy'),
            (jp_lesson1, 'Chào buổi sáng (lịch sự)', 'おはようございます', 'おはようございます', 'Chào buổi sáng', 'easy'),
            (jp_lesson1, 'Xin chào (ban ngày)', 'こんにちは', 'こんにちは', 'Xin chào', 'easy'),
            (jp_lesson1, 'Xin chào (buổi tối)', 'こんばんは', 'こんばんは', 'Xin chào buổi tối', 'easy'),
            (jp_lesson1, 'Cảm ơn', 'ありがとうございます', 'ありがとうございます', 'Cảm ơn', 'easy'),
            (jp_lesson1, 'Xin lỗi', 'すみません', 'すみません', 'Xin lỗi', 'easy'),
            (jp_lesson1, 'Tạm biệt', 'さようなら', 'さようなら', 'Tạm biệt', 'easy'),
            (jp_lesson1, 'Rất vui được gặp', 'はじめまして', 'はじめまして', 'Rất vui được gặp bạn', 'easy'),
            (jp_lesson1, 'Xin hãy chiếu cố', 'どうぞよろしく', 'どうぞよろしく', 'Rất vui được gặp', 'easy'),
            (jp_lesson1, 'Ngủ ngon', 'おやすみ', 'おやすみ', 'Ngủ ngon', 'easy')
        ON CONFLICT DO NOTHING;
    END IF;

    -- Chinese Speaking Exercises
    IF cn_lesson1 IS NOT NULL THEN
        INSERT INTO public.speaking_exercises (lesson_id, title, text, pronunciation, translation, difficulty) VALUES
            (cn_lesson1, 'Xin chào', '你好', 'Nǐ hǎo', 'Xin chào', 'easy'),
            (cn_lesson1, 'Chào buổi sáng', '早上好', 'Zǎoshang hǎo', 'Chào buổi sáng', 'easy'),
            (cn_lesson1, 'Chào buổi tối', '晚上好', 'Wǎnshang hǎo', 'Chào buổi tối', 'easy'),
            (cn_lesson1, 'Cảm ơn', '谢谢', 'Xièxie', 'Cảm ơn', 'easy'),
            (cn_lesson1, 'Tạm biệt', '再见', 'Zàijiàn', 'Tạm biệt', 'easy'),
            (cn_lesson1, 'Xin lỗi', '对不起', 'Duìbuqǐ', 'Xin lỗi', 'easy'),
            (cn_lesson1, 'Không sao', '没关系', 'Méi guānxi', 'Không sao', 'easy'),
            (cn_lesson1, 'Không có gì', '不客气', 'Bú kèqi', 'Không có gì', 'easy'),
            (cn_lesson1, 'Vâng', '是', 'Shì', 'Vâng/Đúng', 'easy'),
            (cn_lesson1, 'Không', '不是', 'Búshì', 'Không phải', 'easy')
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- ============================================
-- 7. LISTENING EXERCISES - Bài nghe
-- ============================================

DO $$
DECLARE
    jp_lesson1 UUID;
BEGIN
    SELECT id INTO jp_lesson1 FROM public.lessons WHERE level = 'N5' AND language = 'japanese' AND lesson_number = 1 LIMIT 1;

    IF jp_lesson1 IS NOT NULL THEN
        INSERT INTO public.listening_exercises (lesson_id, title, audio_url, transcript, difficulty) VALUES
            (jp_lesson1, 'Chào hỏi cơ bản', '', 'おはようございます。こんにちは。こんばんは。', 'easy'),
            (jp_lesson1, 'Cảm ơn và xin lỗi', '', 'ありがとうございます。すみません。', 'easy'),
            (jp_lesson1, 'Chào tạm biệt', '', 'さようなら。また明日。', 'easy'),
            (jp_lesson1, 'Giới thiệu bản thân', '', 'はじめまして。私は田中です。', 'easy')
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- ============================================
-- 8. ROLEPLAY SCENARIOS - Tình huống
-- ============================================

INSERT INTO public.roleplay_scenarios (title, description, scenario_type, language) VALUES
    ('Tại cửa hàng tiện lợi', 'Mua sắm và thanh toán tại cửa hàng tiện lợi', 'shopping', 'japanese'),
    ('Tại nhà hàng', 'Gọi món, đặt món và thanh toán', 'restaurant', 'japanese'),
    ('Tại khách sạn', 'Nhận phòng, hỏi dịch vụ', 'hotel', 'japanese'),
    ('Phỏng vấn xin việc', 'Giao tiếp trong phỏng vấn công việc', 'interview', 'japanese'),
    ('Tại bệnh viện', 'Khám bệnh, mô tả triệu chứng', 'doctor', 'japanese'),
    ('Hỏi đường', 'Hỏi đường và chỉ đường', 'directions', 'japanese'),
    ('Mua quần áo', 'Thử và mua quần áo', 'shopping', 'japanese'),
    ('Tại ngân hàng', 'Giao dịch tiền tệ', 'bank', 'japanese'),
    ('Cửa hàng Trung Quốc', 'Mua sắm tại cửa hàng', 'shopping', 'chinese'),
    ('Nhà hàng Trung Quốc', 'Gọi món Trung Quốc', 'restaurant', 'chinese'),
    ('Khách sạn Trung Quốc', 'Đặt phòng khách sạn', 'hotel', 'chinese'),
    ('Hỏi đường Trung', 'Hỏi đường ở Trung Quốc', 'directions', 'chinese')
ON CONFLICT DO NOTHING;

-- ============================================
-- 9. SENTENCE GAMES - Game sắp xếp câu
-- ============================================

DO $$
DECLARE
    jp_lesson1 UUID;
BEGIN
    SELECT id INTO jp_lesson1 FROM public.lessons WHERE level = 'N5' AND language = 'japanese' AND lesson_number = 1 LIMIT 1;

    IF jp_lesson1 IS NOT NULL THEN
        INSERT INTO public.sentence_games (lesson_id, title, sentences, difficulty) VALUES
            (jp_lesson1, 'Sắp xếp câu chào hỏi', 
             '[["おはよう","ございます"], ["こんにちは","です"], ["ありがとう","ございます"], ["すみません","です"]]', 
             'easy'),
            (jp_lesson1, 'Sắp xếp câu giới thiệu',
             '[["私は","田中です"], ["はじめまして","お願いします"], ["これは","本です"]]',
             'easy')
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- ============================================
-- DONE! Kiểm tra dữ liệu đã insert
-- ============================================

SELECT 'Courses: ' || COUNT(*) as total FROM public.courses
UNION ALL
SELECT 'Lessons: ' || COUNT(*) FROM public.lessons
UNION ALL
SELECT 'Vocabulary: ' || COUNT(*) FROM public.vocabulary
UNION ALL
SELECT 'Kanji: ' || COUNT(*) FROM public.kanji
UNION ALL
SELECT 'Grammar: ' || COUNT(*) FROM public.grammar
UNION ALL
SELECT 'Speaking: ' || COUNT(*) FROM public.speaking_exercises
UNION ALL
SELECT 'Listening: ' || COUNT(*) FROM public.listening_exercises
UNION ALL
SELECT 'Roleplay: ' || COUNT(*) FROM public.roleplay_scenarios;
