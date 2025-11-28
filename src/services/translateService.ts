// Simple translation service using Google Translate API (free tier)

export async function translateToVietnamese(japaneseText: string): Promise<string> {
  try {
    // Remove brackets and clean text
    const cleanText = japaneseText.replace(/[\[\]]/g, '').trim();
    
    // Use Google Translate API (free, no key needed)
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=ja&tl=vi&dt=t&q=${encodeURIComponent(cleanText)}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    // Extract translation from response
    if (data && data[0] && data[0][0] && data[0][0][0]) {
      return data[0][0][0];
    }
    
    return 'Không dịch được';
  } catch (error) {
    console.error('Translation error:', error);
    return 'Không dịch được';
  }
}
