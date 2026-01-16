// Cookie Storage Adapter for Supabase Auth
// Implements SupportedStorage interface using cookies

const COOKIE_OPTIONS = {
    path: '/',
    sameSite: 'lax' as const,
    secure: typeof window !== 'undefined' && window.location.protocol === 'https:',
    maxAge: 60 * 60 * 24 * 7 // 7 days in seconds
};

// Parse cookies from document.cookie string
function parseCookies(): Record<string, string> {
    if (typeof document === 'undefined') return {};

    return document.cookie.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        if (key && value) {
            acc[key] = decodeURIComponent(value);
        }
        return acc;
    }, {} as Record<string, string>);
}

// Set a cookie
function setCookie(name: string, value: string): void {
    if (typeof document === 'undefined') return;

    const { path, sameSite, secure, maxAge } = COOKIE_OPTIONS;
    let cookieString = `${name}=${encodeURIComponent(value)}; path=${path}; max-age=${maxAge}; samesite=${sameSite}`;

    if (secure) {
        cookieString += '; secure';
    }

    document.cookie = cookieString;
}

// Delete a cookie
function deleteCookie(name: string): void {
    if (typeof document === 'undefined') return;
    document.cookie = `${name}=; path=/; max-age=0`;
}

// Supabase SupportedStorage interface implementation
export const cookieStorage = {
    getItem: (key: string): string | null => {
        const cookies = parseCookies();
        return cookies[key] ?? null;
    },

    setItem: (key: string, value: string): void => {
        setCookie(key, value);
    },

    removeItem: (key: string): void => {
        deleteCookie(key);
    }
};

export default cookieStorage;
