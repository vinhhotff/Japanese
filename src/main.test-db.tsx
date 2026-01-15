import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { supabase } from './config/supabase';
import './index.css';

async function testDatabaseConnection() {
    console.log('🔍 Testing database connection...');

    try {
        // Test 1: Check if credentials are loaded
        const url = (import.meta.env.VITE_SUPABASE_URL || '').toString();
        const key = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').toString();

        console.log('✓ Environment variables:', {
            url: url ? `${url.substring(0, 30)}...` : 'MISSING',
            key: key ? `${key.substring(0, 20)}...` : 'MISSING'
        });

        // Test 2: Simple query to lessons table
        console.log('📡 Querying lessons table (with timeout)...');
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const { data: lessons, error } = await supabase
            .from('lessons')
            .select('id, title, level, language')
            .eq('language', 'japanese')
            .eq('level', 'N5')
            .limit(5)
            .abortSignal(controller.signal);

        clearTimeout(timeoutId);

        if (error) {
            console.error('❌ Database error:', error);
            console.error('Error details:', {
                code: error.code,
                message: error.message,
                details: error.details,
                hint: error.hint
            });
            return;
        }

        console.log('✅ Lessons query successful!');
        console.log('📊 Found lessons:', lessons);
        console.log('📊 Total count:', lessons?.length);

        // Test 3: Query kanji table
        if (lessons && lessons.length > 0) {
            const lessonIds = lessons.map(l => l.id);
            console.log('📡 Querying kanji for lesson IDs:', lessonIds);

            const { data: kanji, error: kanjiError } = await supabase
                .from('kanji')
                .select('id, character, meaning')
                .in('lesson_id', lessonIds)
                .limit(10);

            if (kanjiError) {
                console.error('❌ Kanji query error:', kanjiError);
            } else {
                console.log('✅ Kanji query successful! Found:', kanji?.length, 'kanji');
                console.log('Sample kanji:', kanji?.slice(0, 3));
            }
        }

    } catch (err: any) {
        console.error('❌ Connection test failed:', err);
        console.error('Error name:', err.name);
        console.error('Error message:', err.message);

        if (err.name === 'AbortError') {
            console.error('⏱️ Request was aborted due to timeout (10 seconds)');
        }
    }
}

// Run test immediately
testDatabaseConnection();

console.log('🚀 Starting application...');

import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <App />
    </StrictMode>,
);
