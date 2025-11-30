-- Migration: Add Assignments System
-- Admin can create assignments, students can submit

-- Assignments table
CREATE TABLE IF NOT EXISTS assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  instructions TEXT NOT NULL,
  language VARCHAR(20) NOT NULL CHECK (language IN ('japanese', 'chinese')),
  assignment_type VARCHAR(50) NOT NULL CHECK (assignment_type IN ('writing', 'translation', 'essay', 'vocabulary', 'grammar', 'speaking', 'mixed')),
  difficulty VARCHAR(20) CHECK (difficulty IN ('easy', 'medium', 'hard')),
  max_score INTEGER DEFAULT 100,
  due_date TIMESTAMP WITH TIME ZONE,
  is_published BOOLEAN DEFAULT TRUE,
  created_by UUID, -- Admin user ID
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assignment questions/prompts
CREATE TABLE IF NOT EXISTS assignment_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
  question_number INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  question_type VARCHAR(50) CHECK (question_type IN ('short_answer', 'essay', 'multiple_choice', 'fill_blank', 'translation', 'audio_response')),
  options TEXT[], -- For multiple choice
  correct_answer TEXT, -- For auto-grading
  points INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Student submissions
CREATE TABLE IF NOT EXISTS assignment_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL, -- Student user ID
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'graded', 'returned')),
  submitted_at TIMESTAMP WITH TIME ZONE,
  graded_at TIMESTAMP WITH TIME ZONE,
  graded_by UUID, -- Teacher/Admin user ID
  score INTEGER,
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(assignment_id, user_id)
);

-- Student answers
CREATE TABLE IF NOT EXISTS assignment_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id UUID REFERENCES assignment_submissions(id) ON DELETE CASCADE,
  question_id UUID REFERENCES assignment_questions(id) ON DELETE CASCADE,
  answer_text TEXT,
  audio_url TEXT, -- For speaking assignments
  is_correct BOOLEAN, -- For auto-graded questions
  points_earned INTEGER DEFAULT 0,
  feedback TEXT, -- Teacher feedback for this answer
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_assignments_lesson_id ON assignments(lesson_id);
CREATE INDEX IF NOT EXISTS idx_assignments_language ON assignments(language);
CREATE INDEX IF NOT EXISTS idx_assignments_due_date ON assignments(due_date);
CREATE INDEX IF NOT EXISTS idx_assignment_questions_assignment_id ON assignment_questions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_assignment_id ON assignment_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_user_id ON assignment_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_status ON assignment_submissions(status);
CREATE INDEX IF NOT EXISTS idx_assignment_answers_submission_id ON assignment_answers(submission_id);

-- Triggers
CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assignment_submissions_updated_at BEFORE UPDATE ON assignment_submissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assignment_answers_updated_at BEFORE UPDATE ON assignment_answers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE assignments IS 'Assignments created by teachers for students';
COMMENT ON TABLE assignment_questions IS 'Questions/prompts within an assignment';
COMMENT ON TABLE assignment_submissions IS 'Student submissions for assignments';
COMMENT ON TABLE assignment_answers IS 'Student answers to assignment questions';
COMMENT ON COLUMN assignments.assignment_type IS 'Type of assignment: writing, translation, essay, vocabulary, grammar, speaking, mixed';
COMMENT ON COLUMN assignment_submissions.status IS 'Status: draft (not submitted), submitted (waiting for grading), graded (scored), returned (with feedback)';
