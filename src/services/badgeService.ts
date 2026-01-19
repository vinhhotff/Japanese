import { supabase } from '../config/supabase';
import { getUserStats } from './statsService';

export interface Badge {
    id: string;
    name: string;
    description: string;
    icon_url: string;
    criteria_type: string;
    criteria_value: number;
}

// Get all available badges
export const getAllBadges = async (): Promise<Badge[]> => {
    const { data, error } = await supabase
        .from('badges')
        .select('*');

    if (error) {
        console.error('Error fetching badges:', error);
        return [];
    }
    return data || [];
};

// Get user earned badges
export const getUserBadges = async (userId: string) => {
    const { data, error } = await supabase
        .from('user_badges')
        .select(`
            *,
            badges (*)
        `)
        .eq('user_id', userId);

    if (error) {
        console.error('Error fetching user badges:', error);
        return [];
    }
    return data || [];
};

// Check and award badges based on stats
export const checkAndAwardBadges = async (userId: string) => {
    try {
        const stats = await getUserStats(userId);
        if (!stats) return [];

        const allBadges = await getAllBadges();
        const earnedBadges = await getUserBadges(userId);
        const earnedBadgeIds = new Set(earnedBadges.map(eb => eb.badge_id));

        const newlyEarned = [];

        for (const badge of allBadges) {
            if (earnedBadgeIds.has(badge.id)) continue;

            let isEligible = false;

            switch (badge.criteria_type) {
                case 'streak':
                    if (stats.longestStreak >= badge.criteria_value) isEligible = true;
                    break;
                case 'points':
                    if (stats.totalPoints >= badge.criteria_value) isEligible = true;
                    break;
                case 'lessons':
                    // Need to count completed lessons from progress table
                    const { count } = await supabase
                        .from('user_learning_progress')
                        .select('*', { count: 'exact', head: true })
                        .eq('user_id', userId)
                        .eq('is_completed', true);
                    if (count && count >= badge.criteria_value) isEligible = true;
                    break;
                case 'badges':
                    // e.g. "Earn 5 badges" badge
                    if (earnedBadges.length >= badge.criteria_value) isEligible = true;
                    break;
            }

            if (isEligible) {
                const { data, error } = await supabase
                    .from('user_badges')
                    .insert({
                        user_id: userId,
                        badge_id: badge.id
                    })
                    .select()
                    .single();

                if (!error) {
                    newlyEarned.push(badge);
                }
            }
        }

        return newlyEarned;
    } catch (e) {
        console.error('Error checking badges:', e);
        return [];
    }
};
