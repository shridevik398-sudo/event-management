CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

/* 1. Create Tables */

CREATE TABLE IF NOT EXISTS public.events (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    category TEXT DEFAULT 'Technology',
    date TIMESTAMPTZ NOT NULL,
    time TEXT DEFAULT '09:00',
    venue TEXT DEFAULT '',
    capacity INTEGER DEFAULT 0,
    deadline TEXT DEFAULT '',
    status TEXT DEFAULT 'draft' CHECK (status IN ('open', 'closed', 'draft')),
    banner_color TEXT DEFAULT 'from-blue-600 to-cyan-500',
    emoji TEXT DEFAULT '📅',
    custom_fields JSONB DEFAULT '[]'::JSONB,
    registrations INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.participants (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    event_id TEXT NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    registration_id TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT DEFAULT '',
    college TEXT DEFAULT '',
    department TEXT DEFAULT '',
    year TEXT DEFAULT '',
    attended BOOLEAN DEFAULT false,
    checked_in_at TIMESTAMPTZ,
    custom_field_values JSONB DEFAULT '{}'::JSONB,
    registered_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.feedback (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    event_id TEXT NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    participant_id TEXT,
    participant_name TEXT DEFAULT 'Anonymous',
    is_anonymous BOOLEAN DEFAULT false,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    liked TEXT DEFAULT '',
    suggestions TEXT DEFAULT '',
    submitted_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now()
);

/* 2. Indexes & Constraints */

CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(date);
CREATE INDEX IF NOT EXISTS idx_participants_event_id ON public.participants(event_id);
CREATE INDEX IF NOT EXISTS idx_participants_registration_id ON public.participants(registration_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_participants_event_email ON public.participants(event_id, lower(email));
CREATE INDEX IF NOT EXISTS idx_feedback_event_id ON public.feedback(event_id);
CREATE INDEX IF NOT EXISTS idx_feedback_rating ON public.feedback(rating);

/* 3. Automatic Timestamps & Registration Counter Triggers */

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_events_updated_at ON public.events;
CREATE TRIGGER trg_events_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_participants_updated_at ON public.participants;
CREATE TRIGGER trg_participants_updated_at
BEFORE UPDATE ON public.participants
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE FUNCTION public.sync_event_registrations_count()
RETURNS TRIGGER AS $$
DECLARE
    target_id TEXT;
BEGIN
    IF TG_OP = 'DELETE' THEN
        target_id := OLD.event_id;
    ELSE
        target_id := NEW.event_id;
    END IF;

    UPDATE public.events
    SET registrations = (
        SELECT COUNT(*)::INTEGER
        FROM public.participants
        WHERE event_id = target_id
    )
    WHERE id = target_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_registrations_count ON public.participants;
CREATE TRIGGER trg_sync_registrations_count
AFTER INSERT OR DELETE ON public.participants
FOR EACH ROW EXECUTE FUNCTION public.sync_event_registrations_count();

/* 4. Row Level Security Helper & Policies */

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        auth.role() = 'authenticated'
        OR auth.role() = 'service_role'
        OR coalesce(nullif(current_setting('request.headers', true), '')::json->>'x-admin-token', '') = 'eventflow_admin_demo_secret_2025'
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

/* Events Policies */
DROP POLICY IF EXISTS "Public can view active events" ON public.events;
CREATE POLICY "Public can view active events"
ON public.events FOR SELECT
USING (status IN ('open', 'closed') OR public.is_admin());

DROP POLICY IF EXISTS "Admin can insert events" ON public.events;
CREATE POLICY "Admin can insert events"
ON public.events FOR INSERT
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin can update events" ON public.events;
CREATE POLICY "Admin can update events"
ON public.events FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin can delete events" ON public.events;
CREATE POLICY "Admin can delete events"
ON public.events FOR DELETE
USING (public.is_admin());

/* Participants Policies */
DROP POLICY IF EXISTS "Public can register for open events" ON public.participants;
CREATE POLICY "Public can register for open events"
ON public.participants FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.events
        WHERE events.id = participants.event_id
        AND (events.status = 'open' OR public.is_admin())
    )
);

DROP POLICY IF EXISTS "Admin can view participants" ON public.participants;
CREATE POLICY "Admin can view participants"
ON public.participants FOR SELECT
USING (public.is_admin());

DROP POLICY IF EXISTS "Admin can update participants" ON public.participants;
CREATE POLICY "Admin can update participants"
ON public.participants FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin can delete participants" ON public.participants;
CREATE POLICY "Admin can delete participants"
ON public.participants FOR DELETE
USING (public.is_admin());

/* Feedback Policies */
DROP POLICY IF EXISTS "Public can submit feedback" ON public.feedback;
CREATE POLICY "Public can submit feedback"
ON public.feedback FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can view feedback" ON public.feedback;
CREATE POLICY "Anyone can view feedback"
ON public.feedback FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Admin can update feedback" ON public.feedback;
CREATE POLICY "Admin can update feedback"
ON public.feedback FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin can delete feedback" ON public.feedback;
CREATE POLICY "Admin can delete feedback"
ON public.feedback FOR DELETE
USING (public.is_admin());

/* Settings Policies */
DROP POLICY IF EXISTS "Public can view settings" ON public.settings;
CREATE POLICY "Public can view settings"
ON public.settings FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Admin can manage settings" ON public.settings;
CREATE POLICY "Admin can manage settings"
ON public.settings FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

/* 5. Safe Demo Data Seed */
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.events LIMIT 1) THEN
        INSERT INTO public.events (id, title, description, category, date, time, venue, capacity, deadline, status, banner_color, emoji, custom_fields)
        VALUES
        (
            'e0000001-0000-0000-0000-000000000001',
            'TechSummit 2025',
            'A premier technology conference featuring keynotes from industry leaders in AI, blockchain, and cloud computing. Network with 500+ professionals.',
            'Technology',
            now() + interval '15 days',
            '09:00',
            'Mumbai Convention Centre, Bandra Kurla Complex, Mumbai',
            500,
            (now() + interval '10 days')::date::text,
            'open',
            'from-blue-600 to-cyan-500',
            '💻',
            '[{"id":"f1","type":"text","label":"LinkedIn Profile","required":false,"placeholder":"https://linkedin.com/in/..."},{"id":"f2","type":"dropdown","label":"Session Preference","required":true,"options":["AI & ML","Web3 & Blockchain","Cloud Architecture","DevOps"]}]'::jsonb
        ),
        (
            'e0000002-0000-0000-0000-000000000002',
            'Cultural Fest — Zeitgeist',
            'The annual inter-college cultural extravaganza featuring music, dance, drama, and art competitions. Over 30 colleges compete for glory.',
            'Cultural',
            now() + interval '28 days',
            '10:00',
            'IIT Bombay Campus, Powai, Mumbai',
            2000,
            (now() + interval '20 days')::date::text,
            'open',
            'from-purple-600 to-pink-500',
            '🎭',
            '[]'::jsonb
        ),
        (
            'e0000003-0000-0000-0000-000000000003',
            'Hackathon — Code for Good',
            '36-hour intensive hackathon solving real social problems. Mentors from top tech companies, ₹5L prize pool. Solo or team of 2-4.',
            'Hackathon',
            now() + interval '7 days',
            '08:00',
            'Online (Discord + HackerEarth)',
            300,
            (now() + interval '4 days')::date::text,
            'open',
            'from-emerald-600 to-teal-500',
            '🏆',
            '[{"id":"f3","type":"text","label":"Team Name","required":true,"placeholder":"e.g. The Debuggers"},{"id":"f4","type":"number","label":"Team Size","required":true,"placeholder":"1-4"},{"id":"f5","type":"dropdown","label":"Problem Domain","required":true,"options":["Healthcare","Education","Environment","Finance","Other"]}]'::jsonb
        ),
        (
            'e0000004-0000-0000-0000-000000000004',
            'AI Workshop Series',
            'Hands-on 3-day deep learning workshop covering computer vision, NLP, and generative AI. Bring your laptop — we supply the GPUs.',
            'Workshop',
            now() - interval '5 days',
            '11:00',
            'NMIMS Auditorium, Vile Parle, Mumbai',
            150,
            (now() - interval '10 days')::date::text,
            'closed',
            'from-amber-500 to-orange-500',
            '🤖',
            '[]'::jsonb
        ),
        (
            'e0000005-0000-0000-0000-000000000005',
            'Startup Pitch Day',
            'Present your startup idea to a panel of VCs and angel investors. Top 3 pitches get seed funding up to ₹50L. Open to all college students.',
            'Business',
            now() + interval '45 days',
            '14:00',
            'Nasscom HQ, Koramangala, Bangalore',
            100,
            (now() + interval '35 days')::date::text,
            'draft',
            'from-rose-500 to-pink-600',
            '🚀',
            '[]'::jsonb
        );
    END IF;
END $$;
