import { supabase } from '../config/supabase';

// XP points configuration
const XP_PER_STEP = 10;
const XP_PER_DAILY_CHALLENGE = 50;

export interface UserStats {
    userId: string;
    totalPoints: number;
    currentStreak: number;
    longestStreak: number;
    level: number;
    experiencePoints: number;
    lastChallengeAt: string | null;
}

// Get user stats from Supabase
export const getUserStats = async (userId: string): Promise<UserStats | null> => {
    const { data, error } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

    if (error) {
        console.error('Error fetching user stats:', error);
        return null;
    }

    if (!data) return null;

    return {
        userId: data.user_id,
        totalPoints: data.total_points,
        currentStreak: data.current_streak,
        longestStreak: data.longest_streak,
        level: data.level,
        experiencePoints: data.experience_points,
        lastChallengeAt: data.last_challenge_at
    };
};

// Add XP points to user
export const addExperiencePoints = async (userId: string, points: number) => {
    try {
        // First get current stats
        let stats = await getUserStats(userId);

        if (!stats) {
            // Initialize if not exists
            const { error: initError } = await supabase.from('user_stats').insert({
                user_id: userId,
                total_points: points,
                experience_points: points,
                level: 1,
                current_streak: 0,
                longest_streak: 0
            });
            if (initError) throw initError;
            return;
        }

        const newXP = stats.experiencePoints + points;
        const newLevel = Math.floor(newXP / 1000) + 1; // 1000 XP per level
        const newTotalPoints = stats.totalPoints + points;

        const { error } = await supabase
            .from('user_stats')
            .update({
                experience_points: newXP,
                level: newLevel,
                total_points: newTotalPoints,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', userId);

        if (error) throw error;

        // Return updated stats if needed
        return { newXP, newLevel };
    } catch (e) {
        console.error('Error adding XP:', e);
    }
};

// Update streak when user does an activity
export const updateStreak = async (userId: string) => {
    try {
        const stats = await getUserStats(userId);
        if (!stats) return;

        const now = new Date();
        const lastActivity = stats.lastChallengeAt ? new Date(stats.lastChallengeAt) : null;

        let newStreak = stats.currentStreak;
        let updateNeeded = false;

        if (!lastActivity) {
            newStreak = 1;
            updateNeeded = true;
        } else {
            const diffDays = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                // Consecutive day
                newStreak += 1;
                updateNeeded = true;
            } else if (diffDays > 1) {
                // Streak broken
                newStreak = 1;
                updateNeeded = true;
            }
            // If diffDays === 0, already updated today
        }

        if (updateNeeded) {
            const { error } = await supabase
                .from('user_stats')
                .update({
                    current_streak: newStreak,
                    longest_streak: Math.max(newStreak, stats.longestStreak),
                    last_challenge_at: now.toISOString(),
                    updated_at: now.toISOString()
                })
                .eq('user_id', userId);

            if (error) throw error;
        }

        return newStreak;
    } catch (e) {
        console.error('Error updating streak:', e);
    }
};
