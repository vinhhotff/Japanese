const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pthcahjwttyaecejtplr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0aGNhaGp3dHR5YWVjZWp0cGxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyODI4MzgsImV4cCI6MjA3Mzg1ODgzOH0.l44fmYpZVJuHKfYWI4hBvKp4wmP21Fs96Jyoaa4u9vA';
const supabase = createClient(supabaseUrl, supabaseKey);

async function populate() {
    const { data: profiles, error: pError } = await supabase.from('profiles').select('id');
    if (pError) {
        console.error("Profiles error:", pError);
        return;
    }

    console.log(`Found ${profiles.length} profiles. Adding stats...`);

    for (let i = 0; i < profiles.length; i++) {
        const p = profiles[i];

        const points = Math.floor(Math.random() * 5000) + 1000;
        const level = Math.floor(points / 1000) + 1;
        const streak = Math.floor(Math.random() * 30);

        const { error } = await supabase.from('user_stats').upsert({
            user_id: p.id,
            total_points: points,
            experience_points: points,
            level: level,
            current_streak: streak,
            longest_streak: streak + Math.floor(Math.random() * 10),
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

        if (error) {
            console.error(`Error for ${p.id}:`, error);
        } else {
            console.log(`Initialized stats for ${p.id} with ${points} pts`);
        }
    }
}

populate();
