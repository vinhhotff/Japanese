// CORS Proxy utilities for Jisho API
// Note: Using public CORS proxies is not recommended for production
// For production, set up your own backend proxy

const CORS_PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://cors-anywhere.herokuapp.com/',
  // Add more proxies if needed
];

let currentProxyIndex = 0;

export const getProxiedUrl = (url: string): string => {
  // Try to use proxy if direct access fails
  // For now, return original URL and let the service handle errors
  return url;
};

export const fetchWithProxy = async (url: string, options?: RequestInit): Promise<Response> => {
  try {
    // First try direct fetch
    const response = await fetch(url, options);
    return response;
  } catch (error: any) {
    // If CORS error, try with proxy
    if (error.message?.includes('CORS') || error.message?.includes('Failed to fetch')) {
      console.warn('Direct fetch failed, trying with proxy...');
      
      // Try each proxy
      for (let i = 0; i < CORS_PROXIES.length; i++) {
        try {
          const proxyUrl = CORS_PROXIES[currentProxyIndex] + encodeURIComponent(url);
          const response = await fetch(proxyUrl, options);
          currentProxyIndex = (currentProxyIndex + 1) % CORS_PROXIES.length;
          return response;
        } catch (proxyError) {
          console.warn(`Proxy ${i} failed, trying next...`);
          currentProxyIndex = (currentProxyIndex + 1) % CORS_PROXIES.length;
        }
      }
      
      throw new Error('Tất cả các proxy đều thất bại. Vui lòng thử lại sau.');
    }
    
    throw error;
  }
};

