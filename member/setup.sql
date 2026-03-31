-- ============================================================
-- REBORN METHOD — Member Area Database Setup
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. PROFILES TABLE (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id              UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name       TEXT NOT NULL,
  phase           INTEGER DEFAULT 1 CHECK (phase IN (1, 2, 3)),
  clean_days_start DATE,
  is_admin        BOOLEAN DEFAULT FALSE,
  notes_visible   BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 2. SESSION NOTES TABLE (Patrick writes for each client)
CREATE TABLE IF NOT EXISTS public.session_notes (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id   UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  content     TEXT NOT NULL,
  session_date DATE DEFAULT CURRENT_DATE,
  is_pinned   BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 3. RESOURCES TABLE (PDFs / workbooks Patrick assigns)
CREATE TABLE IF NOT EXISTS public.resources (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT,
  file_name   TEXT NOT NULL,  -- filename in /member/resources/
  resource_type TEXT DEFAULT 'workbook', -- 'workbook', 'journal', 'guide'
  phase       INTEGER CHECK (phase IN (1, 2, 3)),  -- NULL = all phases
  is_global   BOOLEAN DEFAULT TRUE,  -- available to all clients
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CLIENT RESOURCES (assign specific resources to specific clients)
CREATE TABLE IF NOT EXISTS public.client_resources (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id   UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  resource_id UUID REFERENCES public.resources(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, resource_id)
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_resources ENABLE ROW LEVEL SECURITY;

-- Profiles: user sees own, admin sees all
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE
  ));

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admin can insert profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE
  ));

CREATE POLICY "Admin can update all profiles"
  ON public.profiles FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE
  ));

-- Session notes: clients see own, admin full access
CREATE POLICY "Clients view own notes"
  ON public.session_notes FOR SELECT
  USING (client_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE
  ));

CREATE POLICY "Admin manages all notes"
  ON public.session_notes FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE
  ));

-- Resources: all authenticated users see global, admin full access
CREATE POLICY "Users see global resources"
  ON public.resources FOR SELECT
  USING (is_global = TRUE OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE
  ));

CREATE POLICY "Admin manages resources"
  ON public.resources FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE
  ));

-- Client resources: see own assignments
CREATE POLICY "Users see own assignments"
  ON public.client_resources FOR SELECT
  USING (client_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE
  ));

CREATE POLICY "Admin manages assignments"
  ON public.client_resources FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE
  ));

-- ============================================================
-- AUTO-UPDATE updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- DEFAULT RESOURCES (pre-populate the 3 built-in PDFs)
-- ============================================================
INSERT INTO public.resources (title, description, file_name, resource_type, phase, is_global) VALUES
  ('30-Day Recovery Journal', 'Täglich strukturierte Reflexion für die ersten 30 Tage. Morgen- & Abend-Routine.', '30-day-journal.html', 'journal', 1, TRUE),
  ('Trigger Map Workbook', 'Identifiziere deine persönlichen Trigger — bevor sie dich triggern.', 'trigger-map.html', 'workbook', 1, TRUE),
  ('Identity Reset Worksheet', 'The Split — wer du bist vs. wer du sein könntest. Das Kern-Werkzeug der REBORN Methode.', 'identity-worksheet.html', 'workbook', 2, TRUE);

-- ============================================================
-- FIRST STEP AFTER RUNNING:
-- 1. Go to Supabase Auth → Users
-- 2. Create user with your email (rebornmethod.patrick@gmail.com)
-- 3. Run: UPDATE profiles SET is_admin = TRUE WHERE id = 'YOUR_USER_ID';
-- ============================================================
