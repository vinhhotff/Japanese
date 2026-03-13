const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pthcahjwttyaecejtplr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0aGNhaGp3dHR5YWVjZWp0cGxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyODI4MzgsImV4cCI6MjA3Mzg1ODgzOH0.l44fmYpZVJuHKfYWI4hBvKp4wmP21Fs96Jyoaa4u9vA';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data, error } = await supabase
        .from('user_stats')
        .select(`
            user_id,
            total_points,
            level,
            current_streak,
            profiles (
                full_name,
                avatar_url,
                role
            )
        `)
        .order('total_points', { ascending: false })
        .limit(10);

    console.log(JSON.stringify(data, null, 2));
    if (error) console.error(error);
}

check();
