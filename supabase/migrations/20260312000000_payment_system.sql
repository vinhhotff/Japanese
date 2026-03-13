-- Migration to add Payment System and missing columns
-- This fixes the missing tables/columns found in Edge Functions and Frontend

-- 1. Add missing columns to courses and lessons
DO $$ 
BEGIN
    -- Add price to courses if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='courses' AND column_name='price') THEN
        ALTER TABLE courses ADD COLUMN price INTEGER DEFAULT 0;
    END IF;

    -- Add is_free to lessons if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='lessons' AND column_name='is_free') THEN
        ALTER TABLE lessons ADD COLUMN is_free BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- 2. Create payments table to track PayOS transactions
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    order_code BIGINT UNIQUE NOT NULL,
    amount INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled', 'failed')),
    checkout_url TEXT,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create user_courses table for access control
CREATE TABLE IF NOT EXISTS user_courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    payment_id UUID REFERENCES payments(id),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, course_id)
);

-- 4. Enable RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_courses ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
-- Users can see their own payments
CREATE POLICY "Users can view own payments" ON payments
    FOR SELECT USING (auth.uid() = user_id);

-- Users can see their own course access
CREATE POLICY "Users can view own course access" ON user_courses
    FOR SELECT USING (auth.uid() = user_id);

-- 6. Triggers for updated_at
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_courses_updated_at BEFORE UPDATE ON user_courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
