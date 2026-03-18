
-- Enum for thesis phases
CREATE TYPE public.thesis_phase AS ENUM ('explore', 'define', 'research', 'write', 'submit');

-- Enum for feedback status
CREATE TYPE public.feedback_status AS ENUM ('pending', 'submitted', 'reviewed', 'revised');

-- Enum for milestone status
CREATE TYPE public.milestone_status AS ENUM ('upcoming', 'in_progress', 'completed', 'overdue');

-- Students table
CREATE TABLE public.students (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  university TEXT,
  department TEXT,
  thesis_title TEXT,
  thesis_topic TEXT,
  current_phase thesis_phase NOT NULL DEFAULT 'explore',
  started_at TIMESTAMP WITH TIME ZONE,
  target_completion TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Mentors table
CREATE TABLE public.mentors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  institution TEXT,
  expertise TEXT[],
  bio TEXT,
  max_students INT DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Student-Mentor relationship
CREATE TABLE public.mentor_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  mentor_id UUID NOT NULL REFERENCES public.mentors(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id, mentor_id)
);

-- Feedback loops
CREATE TABLE public.feedback_loops (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.mentor_sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  mentor_id UUID NOT NULL REFERENCES public.mentors(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  submission_text TEXT,
  submission_file_url TEXT,
  mentor_feedback TEXT,
  ai_summary TEXT,
  status feedback_status NOT NULL DEFAULT 'pending',
  submitted_at TIMESTAMP WITH TIME ZONE,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Progress milestones
CREATE TABLE public.progress_milestones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  phase thesis_phase NOT NULL,
  status milestone_status NOT NULL DEFAULT 'upcoming',
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  nudge_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Peer connections
CREATE TABLE public.peer_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_a_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  student_b_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  match_reason TEXT,
  shared_topics TEXT[],
  status TEXT NOT NULL DEFAULT 'suggested' CHECK (status IN ('suggested', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CHECK (student_a_id < student_b_id)
);

-- Enable RLS on all tables
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_loops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.peer_connections ENABLE ROW LEVEL SECURITY;

-- Students policies
CREATE POLICY "Students can view their own profile" ON public.students FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Students can insert their own profile" ON public.students FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Students can update their own profile" ON public.students FOR UPDATE USING (auth.uid() = user_id);

-- Mentors policies
CREATE POLICY "Mentors can view their own profile" ON public.mentors FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Mentors can insert their own profile" ON public.mentors FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Mentors can update their own profile" ON public.mentors FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Students can view their mentors" ON public.mentors FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.mentor_sessions ms WHERE ms.mentor_id = id AND ms.student_id IN (SELECT s.id FROM public.students s WHERE s.user_id = auth.uid()))
);

-- Mentor sessions policies
CREATE POLICY "Students can view their sessions" ON public.mentor_sessions FOR SELECT USING (
  student_id IN (SELECT s.id FROM public.students s WHERE s.user_id = auth.uid())
);
CREATE POLICY "Mentors can view their sessions" ON public.mentor_sessions FOR SELECT USING (
  mentor_id IN (SELECT m.id FROM public.mentors m WHERE m.user_id = auth.uid())
);

-- Feedback loops policies
CREATE POLICY "Students can view their feedback" ON public.feedback_loops FOR SELECT USING (
  student_id IN (SELECT s.id FROM public.students s WHERE s.user_id = auth.uid())
);
CREATE POLICY "Mentors can view feedback they gave" ON public.feedback_loops FOR SELECT USING (
  mentor_id IN (SELECT m.id FROM public.mentors m WHERE m.user_id = auth.uid())
);
CREATE POLICY "Students can submit feedback requests" ON public.feedback_loops FOR INSERT WITH CHECK (
  student_id IN (SELECT s.id FROM public.students s WHERE s.user_id = auth.uid())
);
CREATE POLICY "Students can update their submissions" ON public.feedback_loops FOR UPDATE USING (
  student_id IN (SELECT s.id FROM public.students s WHERE s.user_id = auth.uid())
);
CREATE POLICY "Mentors can update feedback" ON public.feedback_loops FOR UPDATE USING (
  mentor_id IN (SELECT m.id FROM public.mentors m WHERE m.user_id = auth.uid())
);

-- Progress milestones policies
CREATE POLICY "Students can view their milestones" ON public.progress_milestones FOR SELECT USING (
  student_id IN (SELECT s.id FROM public.students s WHERE s.user_id = auth.uid())
);
CREATE POLICY "Students can manage their milestones" ON public.progress_milestones FOR INSERT WITH CHECK (
  student_id IN (SELECT s.id FROM public.students s WHERE s.user_id = auth.uid())
);
CREATE POLICY "Students can update their milestones" ON public.progress_milestones FOR UPDATE USING (
  student_id IN (SELECT s.id FROM public.students s WHERE s.user_id = auth.uid())
);
CREATE POLICY "Mentors can view student milestones" ON public.progress_milestones FOR SELECT USING (
  student_id IN (
    SELECT ms.student_id FROM public.mentor_sessions ms 
    WHERE ms.mentor_id IN (SELECT m.id FROM public.mentors m WHERE m.user_id = auth.uid())
  )
);

-- Peer connections policies
CREATE POLICY "Students can view their peer connections" ON public.peer_connections FOR SELECT USING (
  student_a_id IN (SELECT s.id FROM public.students s WHERE s.user_id = auth.uid())
  OR student_b_id IN (SELECT s.id FROM public.students s WHERE s.user_id = auth.uid())
);
CREATE POLICY "Students can update their peer connections" ON public.peer_connections FOR UPDATE USING (
  student_a_id IN (SELECT s.id FROM public.students s WHERE s.user_id = auth.uid())
  OR student_b_id IN (SELECT s.id FROM public.students s WHERE s.user_id = auth.uid())
);

-- Timestamp trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply triggers
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_mentors_updated_at BEFORE UPDATE ON public.mentors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_feedback_loops_updated_at BEFORE UPDATE ON public.feedback_loops FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_progress_milestones_updated_at BEFORE UPDATE ON public.progress_milestones FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX idx_students_user_id ON public.students(user_id);
CREATE INDEX idx_mentors_user_id ON public.mentors(user_id);
CREATE INDEX idx_mentor_sessions_student ON public.mentor_sessions(student_id);
CREATE INDEX idx_mentor_sessions_mentor ON public.mentor_sessions(mentor_id);
CREATE INDEX idx_feedback_loops_session ON public.feedback_loops(session_id);
CREATE INDEX idx_feedback_loops_student ON public.feedback_loops(student_id);
CREATE INDEX idx_progress_milestones_student ON public.progress_milestones(student_id);
CREATE INDEX idx_peer_connections_a ON public.peer_connections(student_a_id);
CREATE INDEX idx_peer_connections_b ON public.peer_connections(student_b_id);
