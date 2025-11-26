import { Course, Lesson } from '../types';

export const courses: Course[] = [
  {
    level: 'N5',
    title: 'JLPT N5 - Cơ bản',
    description: 'Cấp độ cơ bản nhất, dành cho người mới bắt đầu học tiếng Nhật',
    lessons: [
      {
        id: 'n5-lesson-1',
        title: 'Bài 1: Chào hỏi và Giới thiệu',
        level: 'N5',
        lessonNumber: 1,
        description: 'Học cách chào hỏi và giới thiệu bản thân',
        difficultVocabulary: ['n5-vocab-1', 'n5-vocab-2', 'n5-vocab-3'],
        vocabulary: [
          {
            id: 'n5-vocab-1',
            word: 'こんにちは',
            hiragana: 'こんにちは',
            meaning: 'Xin chào (ban ngày)',
            example: 'こんにちは、元気ですか？',
            exampleTranslation: 'Xin chào, bạn khỏe không?',
            difficulty: 'easy'
          },
          {
            id: 'n5-vocab-2',
            word: 'はじめまして',
            hiragana: 'はじめまして',
            meaning: 'Lần đầu gặp mặt',
            example: 'はじめまして、田中です。',
            exampleTranslation: 'Lần đầu gặp mặt, tôi là Tanaka.',
            difficulty: 'hard'
          },
          {
            id: 'n5-vocab-3',
            word: 'よろしくお願いします',
            hiragana: 'よろしくおねがいします',
            meaning: 'Rất mong được giúp đỡ / Xin hãy đối xử tốt với tôi',
            example: 'よろしくお願いします。',
            exampleTranslation: 'Rất mong được giúp đỡ.',
            difficulty: 'hard'
          },
          {
            id: 'n5-vocab-4',
            word: '私',
            kanji: '私',
            hiragana: 'わたし',
            meaning: 'Tôi',
            example: '私は学生です。',
            exampleTranslation: 'Tôi là học sinh.',
            difficulty: 'easy'
          },
          {
            id: 'n5-vocab-5',
            word: '学生',
            kanji: '学生',
            hiragana: 'がくせい',
            meaning: 'Học sinh',
            example: '私は学生です。',
            exampleTranslation: 'Tôi là học sinh.',
            difficulty: 'medium'
          }
        ],
        kanji: [
          {
            id: 'n5-kanji-1',
            character: '私',
            meaning: 'Tôi, riêng tư',
            readings: {
              onyomi: ['シ'],
              kunyomi: ['わたし', 'わたくし']
            },
            strokeCount: 7,
            examples: [
              {
                word: '私',
                reading: 'わたし',
                meaning: 'Tôi'
              },
              {
                word: '私立',
                reading: 'しりつ',
                meaning: 'Tư thục'
              }
            ]
          },
          {
            id: 'n5-kanji-2',
            character: '学',
            meaning: 'Học',
            readings: {
              onyomi: ['ガク'],
              kunyomi: ['まなぶ']
            },
            strokeCount: 8,
            examples: [
              {
                word: '学生',
                reading: 'がくせい',
                meaning: 'Học sinh'
              },
              {
                word: '学校',
                reading: 'がっこう',
                meaning: 'Trường học'
              }
            ]
          }
        ],
        grammar: [
          {
            id: 'n5-grammar-1',
            pattern: 'です',
            meaning: 'Là (cách nói lịch sự)',
            explanation: 'です được dùng để kết thúc câu khẳng định một cách lịch sự',
            examples: [
              {
                japanese: '私は学生です。',
                romaji: 'Watashi wa gakusei desu.',
                translation: 'Tôi là học sinh.'
              },
              {
                japanese: 'これは本です。',
                romaji: 'Kore wa hon desu.',
                translation: 'Đây là quyển sách.'
              }
            ]
          }
        ],
        listening: [
          {
            id: 'n5-listening-1',
            title: 'Chào hỏi',
            transcript: 'こんにちは、私は田中です。はじめまして、よろしくお願いします。',
            questions: [
              {
                id: 'q1',
                question: 'Người nói tên gì?',
                options: ['田中', '山田', '佐藤', '鈴木'],
                correctAnswer: 0
              }
            ]
          }
        ],
        speaking: [
          {
            id: 'n5-speaking-1',
            title: 'Giới thiệu bản thân',
            prompt: 'Hãy giới thiệu bản thân bằng tiếng Nhật',
            exampleResponse: 'はじめまして、私は[名前]です。よろしくお願いします。'
          }
        ]
      },
      {
        id: 'n5-lesson-2',
        title: 'Bài 2: Số đếm và Thời gian',
        level: 'N5',
        lessonNumber: 2,
        description: 'Học cách đếm số và nói về thời gian',
        difficultVocabulary: ['n5-vocab-6', 'n5-vocab-7'],
        vocabulary: [
          {
            id: 'n5-vocab-6',
            word: '時',
            kanji: '時',
            hiragana: 'じ',
            meaning: 'Giờ',
            example: '今は三時です。',
            exampleTranslation: 'Bây giờ là 3 giờ.',
            difficulty: 'medium'
          },
          {
            id: 'n5-vocab-7',
            word: '分',
            kanji: '分',
            hiragana: 'ふん',
            meaning: 'Phút',
            example: '今は三時十五分です。',
            exampleTranslation: 'Bây giờ là 3 giờ 15 phút.',
            difficulty: 'hard'
          }
        ],
        kanji: [],
        grammar: [],
        listening: [],
        speaking: []
      }
    ]
  },
  {
    level: 'N4',
    title: 'JLPT N4 - Sơ cấp',
    description: 'Cấp độ sơ cấp, mở rộng kiến thức từ N5',
    lessons: [
      {
        id: 'n4-lesson-1',
        title: 'Bài 1: Thể quá khứ',
        level: 'N4',
        lessonNumber: 1,
        description: 'Học cách sử dụng thể quá khứ trong tiếng Nhật',
        difficultVocabulary: ['n4-vocab-1'],
        vocabulary: [
          {
            id: 'n4-vocab-1',
            word: '昨日',
            kanji: '昨日',
            hiragana: 'きのう',
            meaning: 'Hôm qua',
            example: '昨日、本を読みました。',
            exampleTranslation: 'Hôm qua, tôi đã đọc sách.',
            difficulty: 'hard'
          }
        ],
        kanji: [],
        grammar: [],
        listening: [],
        speaking: []
      }
    ]
  },
  {
    level: 'N3',
    title: 'JLPT N3 - Trung cấp',
    description: 'Cấp độ trung cấp, bước đầu sử dụng tiếng Nhật trong công việc',
    lessons: [
      {
        id: 'n3-lesson-1',
        title: 'Bài 1: Thể bị động',
        level: 'N3',
        lessonNumber: 1,
        description: 'Học cách sử dụng thể bị động',
        difficultVocabulary: [],
        vocabulary: [],
        kanji: [],
        grammar: [],
        listening: [],
        speaking: []
      }
    ]
  },
  {
    level: 'N2',
    title: 'JLPT N2 - Trung cao cấp',
    description: 'Cấp độ trung cao cấp, có thể đọc hiểu và giao tiếp tốt',
    lessons: [
      {
        id: 'n2-lesson-1',
        title: 'Bài 1: Ngữ pháp nâng cao',
        level: 'N2',
        lessonNumber: 1,
        description: 'Học các mẫu ngữ pháp nâng cao',
        difficultVocabulary: [],
        vocabulary: [],
        kanji: [],
        grammar: [],
        listening: [],
        speaking: []
      }
    ]
  },
  {
    level: 'N1',
    title: 'JLPT N1 - Cao cấp',
    description: 'Cấp độ cao cấp nhất, thành thạo tiếng Nhật',
    lessons: [
      {
        id: 'n1-lesson-1',
        title: 'Bài 1: Ngữ pháp cao cấp',
        level: 'N1',
        lessonNumber: 1,
        description: 'Học các mẫu ngữ pháp cao cấp nhất',
        difficultVocabulary: [],
        vocabulary: [],
        kanji: [],
        grammar: [],
        listening: [],
        speaking: []
      }
    ]
  }
];

