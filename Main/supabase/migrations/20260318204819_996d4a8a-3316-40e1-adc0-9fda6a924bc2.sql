
-- Drop existing tables (in dependency order)
DROP TABLE IF EXISTS public.peer_connections CASCADE;
DROP TABLE IF EXISTS public.progress_milestones CASCADE;
DROP TABLE IF EXISTS public.feedback_loops CASCADE;
DROP TABLE IF EXISTS public.mentor_sessions CASCADE;
DROP TABLE IF EXISTS public.mentors CASCADE;
DROP TABLE IF EXISTS public.students CASCADE;

-- Drop old enums
DROP TYPE IF EXISTS public.thesis_phase CASCADE;
DROP TYPE IF EXISTS public.feedback_status CASCADE;
DROP TYPE IF EXISTS public.milestone_status CASCADE;

-- =====================
-- STUDYOND-ALIGNED SCHEMA
-- =====================

-- Enums aligned with Studyond
CREATE TYPE public.degree AS ENUM ('bsc', 'msc', 'phd');
CREATE TYPE public.topic_employment AS ENUM ('yes', 'no', 'open');
CREATE TYPE public.topic_employment_type AS ENUM ('internship', 'working_student', 'graduate_program', 'direct_entry');
CREATE TYPE public.topic_workplace_type AS ENUM ('on_site', 'hybrid', 'remote');
CREATE TYPE public.topic_type AS ENUM ('topic', 'job');
CREATE TYPE public.project_state AS ENUM ('proposed', 'applied', 'withdrawn', 'rejected', 'agreed', 'in_progress', 'canceled', 'completed');
CREATE TYPE public.student_objective AS ENUM ('topic', 'supervision', 'career_start', 'industry_access', 'project_guidance');
CREATE TYPE public.expert_objective AS ENUM ('recruiting', 'fresh_insights', 'research_collaboration', 'education_collaboration', 'brand_visibility');
CREATE TYPE public.supervisor_objective AS ENUM ('student_matching', 'research_collaboration', 'network_expansion', 'funding_access', 'project_management');

-- New enums for our additions
CREATE TYPE public.feedback_status AS ENUM ('pending', 'submitted', 'reviewed', 'revised');
CREATE TYPE public.milestone_status AS ENUM ('upcoming', 'in_progress', 'completed', 'overdue');

-- =====================
-- CORE STUDYOND ENTITIES
-- =====================

CREATE TABLE public.universities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'Switzerland',
  domains TEXT[] NOT NULL DEFAULT '{}',
  about TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.study_programs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  degree degree NOT NULL,
  university_id TEXT NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
  about TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.fields (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.companies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  about TEXT,
  size TEXT,
  domains TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.students (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  degree degree NOT NULL,
  study_program_id TEXT REFERENCES public.study_programs(id),
  university_id TEXT REFERENCES public.universities(id),
  skills TEXT[] NOT NULL DEFAULT '{}',
  about TEXT,
  objectives student_objective[] NOT NULL DEFAULT '{}',
  field_ids TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.supervisors (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  title TEXT,
  university_id TEXT REFERENCES public.universities(id),
  research_interests TEXT[] NOT NULL DEFAULT '{}',
  about TEXT,
  objectives supervisor_objective[] NOT NULL DEFAULT '{}',
  field_ids TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.experts (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  title TEXT,
  company_id TEXT REFERENCES public.companies(id),
  offer_interviews BOOLEAN NOT NULL DEFAULT false,
  about TEXT,
  objectives expert_objective[] NOT NULL DEFAULT '{}',
  field_ids TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.topics (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  type topic_type NOT NULL DEFAULT 'topic',
  employment topic_employment NOT NULL DEFAULT 'no',
  employment_type topic_employment_type,
  workplace_type topic_workplace_type,
  degrees degree[] NOT NULL DEFAULT '{}',
  field_ids TEXT[] NOT NULL DEFAULT '{}',
  company_id TEXT REFERENCES public.companies(id),
  university_id TEXT REFERENCES public.universities(id),
  supervisor_ids TEXT[] NOT NULL DEFAULT '{}',
  expert_ids TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.thesis_projects (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  motivation TEXT,
  state project_state NOT NULL DEFAULT 'proposed',
  student_id TEXT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  topic_id TEXT REFERENCES public.topics(id),
  company_id TEXT REFERENCES public.companies(id),
  university_id TEXT REFERENCES public.universities(id),
  supervisor_ids TEXT[] NOT NULL DEFAULT '{}',
  expert_ids TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================
-- OUR ADDITIONS: Structured Mentor Access
-- =====================

CREATE TABLE public.feedback_loops (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES public.thesis_projects(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  reviewer_id TEXT NOT NULL, -- can be supervisor or expert id
  reviewer_type TEXT NOT NULL CHECK (reviewer_type IN ('supervisor', 'expert')),
  title TEXT NOT NULL,
  submission_text TEXT,
  submission_file_url TEXT,
  reviewer_feedback TEXT,
  ai_summary TEXT,
  status feedback_status NOT NULL DEFAULT 'pending',
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.progress_milestones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES public.thesis_projects(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  phase TEXT NOT NULL CHECK (phase IN ('orientation', 'topic_search', 'planning', 'execution', 'writing')),
  status milestone_status NOT NULL DEFAULT 'upcoming',
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  nudge_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.peer_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_a_id TEXT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  student_b_id TEXT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  match_reason TEXT,
  shared_topics TEXT[],
  status TEXT NOT NULL DEFAULT 'suggested' CHECK (status IN ('suggested', 'accepted', 'declined')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (student_a_id < student_b_id)
);

-- =====================
-- RLS POLICIES
-- =====================

ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supervisors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thesis_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_loops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.peer_connections ENABLE ROW LEVEL SECURITY;

-- Reference tables: readable by all authenticated users
CREATE POLICY "Anyone can read universities" ON public.universities FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can read study_programs" ON public.study_programs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can read fields" ON public.fields FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can read companies" ON public.companies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can read topics" ON public.topics FOR SELECT TO authenticated USING (true);

-- Students
CREATE POLICY "Anyone can read students" ON public.students FOR SELECT TO authenticated USING (true);
CREATE POLICY "Students can update own profile" ON public.students FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Students can insert own profile" ON public.students FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Supervisors
CREATE POLICY "Anyone can read supervisors" ON public.supervisors FOR SELECT TO authenticated USING (true);
CREATE POLICY "Supervisors can update own profile" ON public.supervisors FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- Experts
CREATE POLICY "Anyone can read experts" ON public.experts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Experts can update own profile" ON public.experts FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- Thesis projects
CREATE POLICY "Anyone can read thesis projects" ON public.thesis_projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Students can create projects" ON public.thesis_projects FOR INSERT TO authenticated
  WITH CHECK (student_id IN (SELECT s.id FROM public.students s WHERE s.user_id = auth.uid()));
CREATE POLICY "Students can update own projects" ON public.thesis_projects FOR UPDATE TO authenticated
  USING (student_id IN (SELECT s.id FROM public.students s WHERE s.user_id = auth.uid()));

-- Feedback loops
CREATE POLICY "Students can view own feedback" ON public.feedback_loops FOR SELECT TO authenticated
  USING (student_id IN (SELECT s.id FROM public.students s WHERE s.user_id = auth.uid()));
CREATE POLICY "Reviewers can view feedback" ON public.feedback_loops FOR SELECT TO authenticated
  USING (
    (reviewer_type = 'supervisor' AND reviewer_id IN (SELECT sv.id FROM public.supervisors sv WHERE sv.user_id = auth.uid()))
    OR (reviewer_type = 'expert' AND reviewer_id IN (SELECT e.id FROM public.experts e WHERE e.user_id = auth.uid()))
  );
CREATE POLICY "Students can submit feedback" ON public.feedback_loops FOR INSERT TO authenticated
  WITH CHECK (student_id IN (SELECT s.id FROM public.students s WHERE s.user_id = auth.uid()));
CREATE POLICY "Students can update own feedback" ON public.feedback_loops FOR UPDATE TO authenticated
  USING (student_id IN (SELECT s.id FROM public.students s WHERE s.user_id = auth.uid()));
CREATE POLICY "Reviewers can update feedback" ON public.feedback_loops FOR UPDATE TO authenticated
  USING (
    (reviewer_type = 'supervisor' AND reviewer_id IN (SELECT sv.id FROM public.supervisors sv WHERE sv.user_id = auth.uid()))
    OR (reviewer_type = 'expert' AND reviewer_id IN (SELECT e.id FROM public.experts e WHERE e.user_id = auth.uid()))
  );

-- Progress milestones
CREATE POLICY "Students can view own milestones" ON public.progress_milestones FOR SELECT TO authenticated
  USING (student_id IN (SELECT s.id FROM public.students s WHERE s.user_id = auth.uid()));
CREATE POLICY "Students can create milestones" ON public.progress_milestones FOR INSERT TO authenticated
  WITH CHECK (student_id IN (SELECT s.id FROM public.students s WHERE s.user_id = auth.uid()));
CREATE POLICY "Students can update own milestones" ON public.progress_milestones FOR UPDATE TO authenticated
  USING (student_id IN (SELECT s.id FROM public.students s WHERE s.user_id = auth.uid()));
CREATE POLICY "Supervisors can view student milestones" ON public.progress_milestones FOR SELECT TO authenticated
  USING (
    project_id IN (
      SELECT tp.id FROM public.thesis_projects tp
      WHERE tp.supervisor_ids && ARRAY(SELECT sv.id FROM public.supervisors sv WHERE sv.user_id = auth.uid())
    )
  );

-- Peer connections
CREATE POLICY "Students can view own peer connections" ON public.peer_connections FOR SELECT TO authenticated
  USING (
    student_a_id IN (SELECT s.id FROM public.students s WHERE s.user_id = auth.uid())
    OR student_b_id IN (SELECT s.id FROM public.students s WHERE s.user_id = auth.uid())
  );
CREATE POLICY "Students can update own peer connections" ON public.peer_connections FOR UPDATE TO authenticated
  USING (
    student_a_id IN (SELECT s.id FROM public.students s WHERE s.user_id = auth.uid())
    OR student_b_id IN (SELECT s.id FROM public.students s WHERE s.user_id = auth.uid())
  );

-- Allow anon read for demo/prototype purposes
CREATE POLICY "Anon can read universities" ON public.universities FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can read study_programs" ON public.study_programs FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can read fields" ON public.fields FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can read companies" ON public.companies FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can read topics" ON public.topics FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can read students" ON public.students FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can read supervisors" ON public.supervisors FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can read experts" ON public.experts FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can read thesis_projects" ON public.thesis_projects FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can read feedback_loops" ON public.feedback_loops FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can read progress_milestones" ON public.progress_milestones FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can read peer_connections" ON public.peer_connections FOR SELECT TO anon USING (true);

-- =====================
-- INDEXES
-- =====================

CREATE INDEX idx_study_programs_uni ON public.study_programs(university_id);
CREATE INDEX idx_students_uni ON public.students(university_id);
CREATE INDEX idx_students_program ON public.students(study_program_id);
CREATE INDEX idx_students_user ON public.students(user_id);
CREATE INDEX idx_supervisors_uni ON public.supervisors(university_id);
CREATE INDEX idx_supervisors_user ON public.supervisors(user_id);
CREATE INDEX idx_experts_company ON public.experts(company_id);
CREATE INDEX idx_experts_user ON public.experts(user_id);
CREATE INDEX idx_topics_company ON public.topics(company_id);
CREATE INDEX idx_topics_uni ON public.topics(university_id);
CREATE INDEX idx_projects_student ON public.thesis_projects(student_id);
CREATE INDEX idx_projects_topic ON public.thesis_projects(topic_id);
CREATE INDEX idx_feedback_project ON public.feedback_loops(project_id);
CREATE INDEX idx_feedback_student ON public.feedback_loops(student_id);
CREATE INDEX idx_milestones_project ON public.progress_milestones(project_id);
CREATE INDEX idx_milestones_student ON public.progress_milestones(student_id);
CREATE INDEX idx_peers_a ON public.peer_connections(student_a_id);
CREATE INDEX idx_peers_b ON public.peer_connections(student_b_id);

-- Triggers for updated_at
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_supervisors_updated_at BEFORE UPDATE ON public.supervisors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_experts_updated_at BEFORE UPDATE ON public.experts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.thesis_projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_feedback_updated_at BEFORE UPDATE ON public.feedback_loops FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_milestones_updated_at BEFORE UPDATE ON public.progress_milestones FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
