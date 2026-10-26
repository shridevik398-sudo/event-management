import { createClient } from '@supabase/supabase-js';

export const ADMIN_DEMO_TOKEN = 'eventflow_admin_demo_secret_2025';

// Vite environment variables with fallback for testing environments
const env =
  typeof import.meta !== 'undefined' && import.meta.env
    ? import.meta.env
    : typeof process !== 'undefined' && process.env
    ? process.env
    : {};

const getRawEnv = (key) => {
  try {
    return import.meta.env[key] || '';
  } catch {
    return '';
  }
};

// Direct references ensure Vite's define plugin statically replaces these values during build!
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  getRawEnv('NEXT_PUBLIC_eventmanagement_SUPABASE_URL') ||
  '';

const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  getRawEnv('NEXT_PUBLIC_eventmanagement_PUBLISHABLE_KEY') ||
  getRawEnv('NEXT_PUBLIC_eventmanagement_SUPABASE_ANON_KEY') ||
  '';

export const isSupabaseConfigured = () => {
  return Boolean(
    supabaseUrl &&
    supabaseKey &&
    !supabaseUrl.includes('placeholder') &&
    !supabaseKey.includes('placeholder')
  );
};

export const getSupabaseConfig = () => ({
  url: supabaseUrl,
  hasKey: Boolean(supabaseKey),
  configured: isSupabaseConfigured(),
});

// Custom fetch interceptor to dynamically inject admin token if logged in
const customFetch = (url, options = {}) => {
  const headers = new Headers(options.headers || {});

  try {
    if (typeof localStorage !== 'undefined') {
      const rawAuth = localStorage.getItem('ef_auth');
      if (rawAuth) {
        const auth = JSON.parse(rawAuth);
        if (auth && (auth.role === 'admin' || auth.username === 'admin')) {
          headers.set('x-admin-token', ADMIN_DEMO_TOKEN);
        }
      }
    }
  } catch (err) {
    // Ignore storage parse errors
  }

  return fetch(url, { ...options, headers });
};

// Create the Supabase client
export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseKey, {
      global: {
        fetch: customFetch,
      },
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

// ─── Data Mappers: Database (snake_case) <-> Frontend (camelCase) ─────────────

export function mapEventFromDb(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title ?? '',
    description: row.description ?? '',
    category: row.category ?? 'Technology',
    date: row.date ?? new Date().toISOString(),
    time: row.time ?? '09:00',
    venue: row.venue ?? '',
    capacity: Number(row.capacity ?? 0),
    deadline: row.deadline ?? '',
    status: row.status ?? 'draft',
    bannerColor: row.banner_color ?? row.bannerColor ?? 'from-blue-600 to-cyan-500',
    emoji: row.emoji ?? '📅',
    customFields: Array.isArray(row.custom_fields)
      ? row.custom_fields
      : Array.isArray(row.customFields)
      ? row.customFields
      : [],
    registrations: Number(row.registrations ?? 0),
    createdAt: row.created_at ?? row.createdAt ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? row.updatedAt ?? new Date().toISOString(),
  };
}

export function mapEventToDb(event) {
  const row = {
    title: event.title,
    description: event.description ?? '',
    category: event.category ?? 'Technology',
    date: event.date ?? new Date().toISOString(),
    time: event.time ?? '09:00',
    venue: event.venue ?? '',
    capacity: Number(event.capacity ?? 0),
    deadline: event.deadline ?? '',
    status: event.status ?? 'draft',
    banner_color: event.bannerColor ?? event.banner_color ?? 'from-blue-600 to-cyan-500',
    emoji: event.emoji ?? '📅',
    custom_fields: event.customFields ?? event.custom_fields ?? [],
    registrations: Number(event.registrations ?? 0),
    updated_at: new Date().toISOString(),
  };

  if (event.id) row.id = event.id;
  if (event.createdAt || event.created_at) {
    row.created_at = event.createdAt || event.created_at;
  }
  return row;
}

export function mapParticipantFromDb(row) {
  if (!row) return null;
  return {
    id: row.id,
    eventId: row.event_id ?? row.eventId,
    registrationId: row.registration_id ?? row.registrationId ?? '',
    name: row.name ?? '',
    email: row.email ?? '',
    phone: row.phone ?? '',
    college: row.college ?? '',
    department: row.department ?? '',
    year: row.year ?? '',
    attended: Boolean(row.attended),
    checkedInAt: row.checked_in_at ?? row.checkedInAt ?? null,
    customFieldValues:
      row.custom_field_values ?? row.customFieldValues ?? {},
    registeredAt:
      row.registered_at ?? row.registeredAt ?? row.created_at ?? new Date().toISOString(),
    createdAt: row.created_at ?? row.createdAt,
    updatedAt: row.updated_at ?? row.updatedAt,
  };
}

export function mapParticipantToDb(p) {
  const row = {
    event_id: p.eventId ?? p.event_id,
    registration_id: p.registrationId ?? p.registration_id,
    name: p.name,
    email: p.email,
    phone: p.phone ?? '',
    college: p.college ?? '',
    department: p.department ?? '',
    year: p.year ?? '',
    attended: Boolean(p.attended),
    checked_in_at: p.checkedInAt ?? p.checked_in_at ?? null,
    custom_field_values: p.customFieldValues ?? p.custom_field_values ?? {},
    registered_at: p.registeredAt ?? p.registered_at ?? new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (p.id) row.id = p.id;
  return row;
}

export function mapFeedbackFromDb(row) {
  if (!row) return null;
  return {
    id: row.id,
    eventId: row.event_id ?? row.eventId,
    participantId: row.participant_id ?? row.participantId ?? null,
    participantName: row.participant_name ?? row.participantName ?? 'Anonymous',
    isAnonymous: Boolean(row.is_anonymous ?? row.isAnonymous),
    rating: Number(row.rating ?? 0),
    liked: row.liked ?? '',
    suggestions: row.suggestions ?? '',
    submittedAt: row.submitted_at ?? row.submittedAt ?? row.created_at ?? new Date().toISOString(),
    createdAt: row.created_at ?? row.createdAt,
  };
}

export function mapFeedbackToDb(f) {
  const row = {
    event_id: f.eventId ?? f.event_id,
    participant_id: f.participantId ?? f.participant_id ?? null,
    participant_name: f.participantName ?? f.participant_name ?? 'Anonymous',
    is_anonymous: Boolean(f.isAnonymous ?? f.is_anonymous),
    rating: Number(f.rating ?? 0),
    liked: f.liked ?? '',
    suggestions: f.suggestions ?? '',
    submitted_at: f.submittedAt ?? f.submitted_at ?? new Date().toISOString(),
  };

  if (f.id) row.id = f.id;
  return row;
}
