import { SentenceGame } from '../types';

export const generateSentenceGames = (lessonId: string): SentenceGame[] => {
  const games: Record<string, SentenceGame[]> = {
    'n5-lesson-1': [
      {
        id: 'game-1',
        sentence: '私は学生です。',
        translation: 'Tôi là học sinh.',
        words: ['私', 'は', '学生', 'です', '。'],
        correctOrder: [0, 1, 2, 3, 4],
        hint: 'Bắt đầu với "私" (tôi), sau đó là trợ từ "は"'
      },
      {
        id: 'game-2',
        sentence: 'こんにちは、元気ですか？',
        translation: 'Xin chào, bạn khỏe không?',
        words: ['こんにちは', '、', '元気', 'です', 'か', '？'],
        correctOrder: [0, 1, 2, 3, 4, 5],
        hint: 'Bắt đầu với lời chào "こんにちは"'
      },
      {
        id: 'game-3',
        sentence: 'はじめまして、田中です。',
        translation: 'Lần đầu gặp mặt, tôi là Tanaka.',
        words: ['はじめまして', '、', '田中', 'です', '。'],
        correctOrder: [0, 1, 2, 3, 4],
        hint: 'Bắt đầu với "はじめまして" (lần đầu gặp mặt)'
      }
    ],
    'n5-lesson-2': [
      {
        id: 'game-4',
        sentence: '今は三時です。',
        translation: 'Bây giờ là 3 giờ.',
        words: ['今', 'は', '三時', 'です', '。'],
        correctOrder: [0, 1, 2, 3, 4],
        hint: 'Bắt đầu với "今" (bây giờ)'
      }
    ]
  };

  return games[lessonId] || [];
};

