-- ================================================================
-- LEADERBOARD SEED DATA — Bảng xếp hạng học viên
-- ================================================================
-- Chạy SAU seed_demo_users.sql (tạo 10 demo user)
-- ================================================================

DO $$
DECLARE
    existing_count INT;
    u1 UUID;
    u2 UUID;
    u3 UUID;
    u4 UUID;
    u5 UUID;
    u6 UUID;
    u7 UUID;
    u8 UUID;
    u9 UUID;
    u10 UUID;
    r RECORD;
BEGIN
    -- Đếm user hiện có
    SELECT COUNT(*) INTO existing_count FROM profiles;

    -- Gán 10 user đầu tiên vào biến leaderboard
    FOR r IN
        SELECT id FROM profiles ORDER BY id LIMIT 10
    LOOP
        IF u1 IS NULL THEN u1 := r.id;
        ELSIF u2 IS NULL THEN u2 := r.id;
        ELSIF u3 IS NULL THEN u3 := r.id;
        ELSIF u4 IS NULL THEN u4 := r.id;
        ELSIF u5 IS NULL THEN u5 := r.id;
        ELSIF u6 IS NULL THEN u6 := r.id;
        ELSIF u7 IS NULL THEN u7 := r.id;
        ELSIF u8 IS NULL THEN u8 := r.id;
        ELSIF u9 IS NULL THEN u9 := r.id;
        ELSIF u10 IS NULL THEN u10 := r.id;
        END IF;
    END LOOP;

    -- ============================================================
    -- INSERT / UPDATE user_stats cho top 10 leaderboard
    -- ============================================================

    IF u1 IS NOT NULL THEN
    INSERT INTO public.user_stats (user_id, total_points, level, current_streak, longest_streak, experience_points, last_challenge_at)
    VALUES (u1, 12450, 15, 45, 60, 8450, NOW() - INTERVAL '1 hour')
    ON CONFLICT (user_id) DO UPDATE SET
        total_points = EXCLUDED.total_points,
        level = EXCLUDED.level,
        current_streak = EXCLUDED.current_streak,
        longest_streak = EXCLUDED.longest_streak,
        experience_points = EXCLUDED.experience_points,
        updated_at = NOW();
    END IF;

    IF u2 IS NOT NULL THEN
    INSERT INTO public.user_stats (user_id, total_points, level, current_streak, longest_streak, experience_points, last_challenge_at)
    VALUES (u2, 10890, 13, 30, 45, 6890, NOW() - INTERVAL '3 hours')
    ON CONFLICT (user_id) DO UPDATE SET
        total_points = EXCLUDED.total_points,
        level = EXCLUDED.level,
        current_streak = EXCLUDED.current_streak,
        longest_streak = EXCLUDED.longest_streak,
        experience_points = EXCLUDED.experience_points,
        updated_at = NOW();
    END IF;

    IF u3 IS NOT NULL THEN
    INSERT INTO public.user_stats (user_id, total_points, level, current_streak, longest_streak, experience_points, last_challenge_at)
    VALUES (u3, 9520, 12, 22, 35, 5520, NOW() - INTERVAL '5 hours')
    ON CONFLICT (user_id) DO UPDATE SET
        total_points = EXCLUDED.total_points,
        level = EXCLUDED.level,
        current_streak = EXCLUDED.current_streak,
        longest_streak = EXCLUDED.longest_streak,
        experience_points = EXCLUDED.experience_points,
        updated_at = NOW();
    END IF;

    IF u4 IS NOT NULL THEN
    INSERT INTO public.user_stats (user_id, total_points, level, current_streak, longest_streak, experience_points, last_challenge_at)
    VALUES (u4, 8100, 11, 60, 60, 5100, NOW() - INTERVAL '30 minutes')
    ON CONFLICT (user_id) DO UPDATE SET
        total_points = EXCLUDED.total_points,
        level = EXCLUDED.level,
        current_streak = EXCLUDED.current_streak,
        longest_streak = EXCLUDED.longest_streak,
        experience_points = EXCLUDED.experience_points,
        updated_at = NOW();
    END IF;

    IF u5 IS NOT NULL THEN
    INSERT INTO public.user_stats (user_id, total_points, level, current_streak, longest_streak, experience_points, last_challenge_at)
    VALUES (u5, 7340, 10, 18, 25, 4340, NOW() - INTERVAL '8 hours')
    ON CONFLICT (user_id) DO UPDATE SET
        total_points = EXCLUDED.total_points,
        level = EXCLUDED.level,
        current_streak = EXCLUDED.current_streak,
        longest_streak = EXCLUDED.longest_streak,
        experience_points = EXCLUDED.experience_points,
        updated_at = NOW();
    END IF;

    IF u6 IS NOT NULL THEN
    INSERT INTO public.user_stats (user_id, total_points, level, current_streak, longest_streak, experience_points, last_challenge_at)
    VALUES (u6, 6050, 9, 5, 12, 3050, NOW() - INTERVAL '1 day')
    ON CONFLICT (user_id) DO UPDATE SET
        total_points = EXCLUDED.total_points,
        level = EXCLUDED.level,
        current_streak = EXCLUDED.current_streak,
        longest_streak = EXCLUDED.longest_streak,
        experience_points = EXCLUDED.experience_points,
        updated_at = NOW();
    END IF;

    IF u7 IS NOT NULL THEN
    INSERT INTO public.user_stats (user_id, total_points, level, current_streak, longest_streak, experience_points, last_challenge_at)
    VALUES (u7, 4890, 8, 10, 15, 1890, NOW() - INTERVAL '2 days')
    ON CONFLICT (user_id) DO UPDATE SET
        total_points = EXCLUDED.total_points,
        level = EXCLUDED.level,
        current_streak = EXCLUDED.current_streak,
        longest_streak = EXCLUDED.longest_streak,
        experience_points = EXCLUDED.experience_points,
        updated_at = NOW();
    END IF;

    IF u8 IS NOT NULL THEN
    INSERT INTO public.user_stats (user_id, total_points, level, current_streak, longest_streak, experience_points, last_challenge_at)
    VALUES (u8, 3200, 7, 3, 8, 1200, NOW() - INTERVAL '4 days')
    ON CONFLICT (user_id) DO UPDATE SET
        total_points = EXCLUDED.total_points,
        level = EXCLUDED.level,
        current_streak = EXCLUDED.current_streak,
        longest_streak = EXCLUDED.longest_streak,
        experience_points = EXCLUDED.experience_points,
        updated_at = NOW();
    END IF;

    IF u9 IS NOT NULL THEN
    INSERT INTO public.user_stats (user_id, total_points, level, current_streak, longest_streak, experience_points, last_challenge_at)
    VALUES (u9, 2150, 5, 7, 7, 1150, NOW() - INTERVAL '12 hours')
    ON CONFLICT (user_id) DO UPDATE SET
        total_points = EXCLUDED.total_points,
        level = EXCLUDED.level,
        current_streak = EXCLUDED.current_streak,
        longest_streak = EXCLUDED.longest_streak,
        experience_points = EXCLUDED.experience_points,
        updated_at = NOW();
    END IF;

    IF u10 IS NOT NULL THEN
    INSERT INTO public.user_stats (user_id, total_points, level, current_streak, longest_streak, experience_points, last_challenge_at)
    VALUES (u10, 1080, 3, 2, 4, 580, NOW() - INTERVAL '6 hours')
    ON CONFLICT (user_id) DO UPDATE SET
        total_points = EXCLUDED.total_points,
        level = EXCLUDED.level,
        current_streak = EXCLUDED.current_streak,
        longest_streak = EXCLUDED.longest_streak,
        experience_points = EXCLUDED.experience_points,
        updated_at = NOW();
    END IF;

    RAISE NOTICE 'Leaderboard seeded.';

END $$;

-- ================================================================
-- Kiểm tra kết quả
-- ================================================================
SELECT
    RANK() OVER (ORDER BY us.total_points DESC) as rank,
    p.full_name,
    p.email,
    us.total_points,
    us.level,
    us.current_streak,
    us.longest_streak
FROM public.user_stats us
LEFT JOIN public.profiles p ON p.id = us.user_id
ORDER BY us.total_points DESC
LIMIT 15;
