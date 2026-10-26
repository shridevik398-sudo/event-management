/**
 * dataService.js — Centralized Data Operations for EventFlow.
 *
 * Automatically connects to Supabase when VITE_SUPABASE_URL and
 * VITE_SUPABASE_PUBLISHABLE_KEY (or VITE_SUPABASE_ANON_KEY) are configured.
 * Safely falls back to localStorage if environment variables are not yet present.
 */

import { v4 as uuidv4 } from '../utils/uuid.js';
import { seedData } from '../utils/seedData.js';
import {
  supabase,
  isSupabaseConfigured,
  mapEventFromDb,
  mapEventToDb,
  mapParticipantFromDb,
  mapParticipantToDb,
  mapFeedbackFromDb,
  mapFeedbackToDb,
} from '../lib/supabase.js';

// ─── LocalStorage Helpers (Fallback & Migration) ──────────────────────────────

export const LOCAL_KEYS = {
  EVENTS: 'ef_events',
  PARTICIPANTS: 'ef_participants',
  FEEDBACK: 'ef_feedback',
  SEEDED: 'ef_seeded',
  AUTH: 'ef_auth',
};

function readLocal(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeLocal(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error('LocalStorage write failed:', err);
  }
}

// ─── App Initialization ───────────────────────────────────────────────────────

/**
 * Initializes data safely on app startup.
 * When Supabase is configured:
 *   - Verifies connection.
 *   - DOES NOT automatically overwrite or inject demo data into production!
 *   - Safe explicit seeding is available via seedDemoData() or Settings.
 * When running offline / localStorage only:
 *   - Seeds initial demo dataset only if not already seeded.
 */
export async function initializeData() {
  if (isSupabaseConfigured()) {
    try {
      // Test read to check connectivity and ensure table exists
      const { error } = await supabase.from('events').select('id').limit(1);
      if (error) {
        console.warn('Supabase connected with warning:', error.message);
      }
      return { source: 'supabase', connected: !error };
    } catch (err) {
      console.warn('Failed to contact Supabase during init:', err.message);
      return { source: 'supabase', error: err.message };
    }
  }

  // Fallback mode for local development without DB
  if (!readLocal(LOCAL_KEYS.SEEDED)) {
    const { events, participants, feedback } = seedData();
    writeLocal(LOCAL_KEYS.EVENTS, events);
    writeLocal(LOCAL_KEYS.PARTICIPANTS, participants);
    writeLocal(LOCAL_KEYS.FEEDBACK, feedback);
    writeLocal(LOCAL_KEYS.SEEDED, true);
  }
  return { source: 'localStorage', connected: true };
}

/**
 * Explicit demo seed function.
 * Safe for development or explicit user request in Settings.
 */
export async function seedDemoData(force = false) {
  const { events, participants, feedback } = seedData();

  if (isSupabaseConfigured()) {
    if (!force) {
      const { count } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true });
      if (count && count > 0) {
        throw new Error('Database already contains events. Use force to overwrite.');
      }
    }

    // Insert events
    const eventRows = events.map(mapEventToDb);
    const { error: evErr } = await supabase.from('events').upsert(eventRows);
    if (evErr) throw new Error(`Failed to seed events: ${evErr.message}`);

    // Insert participants in chunks of 100
    const participantRows = participants.map(mapParticipantToDb);
    for (let i = 0; i < participantRows.length; i += 100) {
      const chunk = participantRows.slice(i, i + 100);
      const { error: pErr } = await supabase.from('participants').upsert(chunk);
      if (pErr) throw new Error(`Failed to seed participants: ${pErr.message}`);
    }

    // Insert feedback in chunks of 100
    const feedbackRows = feedback.map(mapFeedbackToDb);
    for (let i = 0; i < feedbackRows.length; i += 100) {
      const chunk = feedbackRows.slice(i, i + 100);
      const { error: fErr } = await supabase.from('feedback').upsert(chunk);
      if (fErr) throw new Error(`Failed to seed feedback: ${fErr.message}`);
    }

    return { events: events.length, participants: participants.length, feedback: feedback.length };
  }

  // Local fallback
  writeLocal(LOCAL_KEYS.EVENTS, events);
  writeLocal(LOCAL_KEYS.PARTICIPANTS, participants);
  writeLocal(LOCAL_KEYS.FEEDBACK, feedback);
  writeLocal(LOCAL_KEYS.SEEDED, true);
  return { events: events.length, participants: participants.length, feedback: feedback.length };
}

/**
 * Migrates data from browser localStorage to Supabase.
 * Preserves existing records without discarding local history.
 */
export async function migrateLocalStorageToSupabase() {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured. Set environment variables first.');
  }

  const localEvents = readLocal(LOCAL_KEYS.EVENTS) || [];
  const localParticipants = readLocal(LOCAL_KEYS.PARTICIPANTS) || [];
  const localFeedback = readLocal(LOCAL_KEYS.FEEDBACK) || [];

  let migratedEvents = 0;
  let migratedParticipants = 0;
  let migratedFeedback = 0;

  if (localEvents.length > 0) {
    const rows = localEvents.map(mapEventToDb);
    const { error } = await supabase.from('events').upsert(rows);
    if (error) throw new Error(`Event migration failed: ${error.message}`);
    migratedEvents = rows.length;
  }

  if (localParticipants.length > 0) {
    for (let i = 0; i < localParticipants.length; i += 100) {
      const chunk = localParticipants.slice(i, i + 100).map(mapParticipantToDb);
      const { error } = await supabase.from('participants').upsert(chunk);
      if (error) throw new Error(`Participant migration failed: ${error.message}`);
      migratedParticipants += chunk.length;
    }
  }

  if (localFeedback.length > 0) {
    for (let i = 0; i < localFeedback.length; i += 100) {
      const chunk = localFeedback.slice(i, i + 100).map(mapFeedbackToDb);
      const { error } = await supabase.from('feedback').upsert(chunk);
      if (error) throw new Error(`Feedback migration failed: ${error.message}`);
      migratedFeedback += chunk.length;
    }
  }

  return {
    events: migratedEvents,
    participants: migratedParticipants,
    feedback: migratedFeedback,
  };
}

// ─── Events ──────────────────────────────────────────────────────────────────

/** Fetch all events */
export async function getEvents() {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('date', { ascending: true });
    if (error) throw new Error(error.message);
    return (data || []).map(mapEventFromDb);
  }
  return readLocal(LOCAL_KEYS.EVENTS) ?? [];
}

/** Fetch a single event by ID */
export async function getEvent(id) {
  if (!id) return null;
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return mapEventFromDb(data);
  }
  const events = readLocal(LOCAL_KEYS.EVENTS) ?? [];
  return events.find((e) => e.id === id) ?? null;
}

/** Create a new event */
export async function createEvent(eventData) {
  const newEvent = {
    id: eventData.id || uuidv4(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    registrations: 0,
    customFields: [],
    ...eventData,
  };

  if (isSupabaseConfigured()) {
    const dbRow = mapEventToDb(newEvent);
    const { data, error } = await supabase
      .from('events')
      .insert([dbRow])
      .select()
      .single();
    if (error) throw new Error(error.message);
    return mapEventFromDb(data);
  }

  const events = readLocal(LOCAL_KEYS.EVENTS) ?? [];
  writeLocal(LOCAL_KEYS.EVENTS, [...events, newEvent]);
  return newEvent;
}

/** Update an existing event */
export async function updateEvent(id, updates) {
  if (isSupabaseConfigured()) {
    const dbUpdates = mapEventToDb({ ...updates, id });
    delete dbUpdates.id; // Don't overwrite PK
    const { data, error } = await supabase
      .from('events')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return mapEventFromDb(data);
  }

  const events = readLocal(LOCAL_KEYS.EVENTS) ?? [];
  const idx = events.findIndex((e) => e.id === id);
  if (idx === -1) throw new Error(`Event ${id} not found`);
  events[idx] = { ...events[idx], ...updates, updatedAt: new Date().toISOString() };
  writeLocal(LOCAL_KEYS.EVENTS, events);
  return events[idx];
}

/** Delete an event and all its participants & feedback */
export async function deleteEvent(id) {
  if (isSupabaseConfigured()) {
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return;
  }

  const events = readLocal(LOCAL_KEYS.EVENTS) ?? [];
  writeLocal(LOCAL_KEYS.EVENTS, events.filter((e) => e.id !== id));

  const participants = readLocal(LOCAL_KEYS.PARTICIPANTS) ?? [];
  writeLocal(LOCAL_KEYS.PARTICIPANTS, participants.filter((p) => p.eventId !== id));

  const feedback = readLocal(LOCAL_KEYS.FEEDBACK) ?? [];
  writeLocal(LOCAL_KEYS.FEEDBACK, feedback.filter((f) => f.eventId !== id));
}

/** Duplicate an event (clears registrations) */
export async function duplicateEvent(id) {
  const source = await getEvent(id);
  if (!source) throw new Error(`Event ${id} not found`);
  const { id: _id, createdAt: _c, updatedAt: _u, registrations: _r, ...rest } = source;
  return createEvent({
    ...rest,
    title: `${source.title} (Copy)`,
    status: 'draft',
    registrations: 0,
  });
}

// ─── Participants ─────────────────────────────────────────────────────────────

/** Fetch all participants, optionally filtered by eventId */
export async function getParticipants(eventId) {
  if (isSupabaseConfigured()) {
    let query = supabase.from('participants').select('*');
    if (eventId) {
      query = query.eq('event_id', eventId);
    }
    const { data, error } = await query.order('registered_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []).map(mapParticipantFromDb);
  }

  const all = readLocal(LOCAL_KEYS.PARTICIPANTS) ?? [];
  return eventId ? all.filter((p) => p.eventId === eventId) : all;
}

/** Fetch a single participant by ID */
export async function getParticipant(id) {
  if (!id) return null;
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return mapParticipantFromDb(data);
  }

  const all = readLocal(LOCAL_KEYS.PARTICIPANTS) ?? [];
  return all.find((p) => p.id === id) ?? null;
}

/** Add a single participant registration */
export async function addParticipant(participantData) {
  const event = await getEvent(participantData.eventId);

  // 1. Capacity check
  if (event && event.capacity > 0) {
    let currentCount = 0;
    if (isSupabaseConfigured()) {
      const { count, error } = await supabase
        .from('participants')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', participantData.eventId);
      if (!error) currentCount = count || 0;
    } else {
      const allLocal = readLocal(LOCAL_KEYS.PARTICIPANTS) ?? [];
      currentCount = allLocal.filter((p) => p.eventId === participantData.eventId).length;
    }

    if (currentCount >= event.capacity) {
      throw new Error('CAPACITY_REACHED');
    }
  }

  // 2. Duplicate email check within the same event
  if (isSupabaseConfigured()) {
    const { data: duplicate } = await supabase
      .from('participants')
      .select('id')
      .eq('event_id', participantData.eventId)
      .ilike('email', participantData.email.trim())
      .maybeSingle();

    if (duplicate) {
      throw new Error('DUPLICATE_EMAIL');
    }
  } else {
    const all = readLocal(LOCAL_KEYS.PARTICIPANTS) ?? [];
    const duplicate = all.find(
      (p) =>
        p.eventId === participantData.eventId &&
        p.email?.toLowerCase() === participantData.email?.toLowerCase()
    );
    if (duplicate) throw new Error('DUPLICATE_EMAIL');
  }

  const registrationId = `EF-${Date.now().toString(36).toUpperCase()}`;
  const newParticipant = {
    id: uuidv4(),
    registrationId,
    registeredAt: new Date().toISOString(),
    attended: false,
    customFieldValues: {},
    ...participantData,
  };

  if (isSupabaseConfigured()) {
    const dbRow = mapParticipantToDb(newParticipant);
    const { data, error } = await supabase
      .from('participants')
      .insert([dbRow])
      .select()
      .maybeSingle();

    if (error) {
      // Postgres unique constraint violation
      if (error.code === '23505' || error.message.includes('unique')) {
        throw new Error('DUPLICATE_EMAIL');
      }
      throw new Error(error.message);
    }
    return data ? mapParticipantFromDb(data) : newParticipant;
  }

  // Local fallback
  const all = readLocal(LOCAL_KEYS.PARTICIPANTS) ?? [];
  writeLocal(LOCAL_KEYS.PARTICIPANTS, [...all, newParticipant]);

  if (event) {
    await updateEvent(participantData.eventId, {
      registrations: (event.registrations ?? 0) + 1,
    });
  }

  return newParticipant;
}

/**
 * Bulk add participants from parsed rows.
 * Supports 'skip' or 'update' duplicate strategy.
 */
export async function bulkAddParticipants(eventId, rows, options = {}) {
  const { duplicateStrategy = 'skip' } = options;
  const event = await getEvent(eventId);
  const capacity = event?.capacity ?? 0;

  if (isSupabaseConfigured()) {
    // Fetch existing participants for this event to check duplicates
    const { data: existingData, error: fetchErr } = await supabase
      .from('participants')
      .select('id, email')
      .eq('event_id', eventId);
    if (fetchErr) throw new Error(fetchErr.message);

    const existingEmails = new Map(
      (existingData || []).map((p) => [p.email?.toLowerCase(), p.id])
    );

    const toAdd = [];
    const toUpdate = [];
    const errors = [];
    let skipped = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const emailKey = row.email?.toLowerCase();

      if (capacity > 0 && existingEmails.size + toAdd.length >= capacity) {
        errors.push({ row: i + 1, reason: 'Capacity reached', data: row });
        continue;
      }

      if (existingEmails.has(emailKey)) {
        if (duplicateStrategy === 'update') {
          const existingId = existingEmails.get(emailKey);
          toUpdate.push({ id: existingId, eventId, ...row });
        } else {
          skipped++;
          errors.push({ row: i + 1, reason: 'Duplicate email', data: row });
        }
      } else {
        const item = {
          id: uuidv4(),
          eventId,
          registrationId: `EF-${Date.now().toString(36).toUpperCase()}-${i}`,
          registeredAt: new Date().toISOString(),
          attended: false,
          customFieldValues: {},
          ...row,
        };
        toAdd.push(item);
        existingEmails.set(emailKey, item.id);
      }
    }

    // Insert new participants in chunks of 200
    for (let c = 0; c < toAdd.length; c += 200) {
      const chunk = toAdd.slice(c, c + 200).map(mapParticipantToDb);
      const { error } = await supabase.from('participants').insert(chunk);
      if (error) throw new Error(`Bulk insert failed: ${error.message}`);
    }

    // Update existing participants if update strategy chosen
    for (const item of toUpdate) {
      const dbRow = mapParticipantToDb(item);
      await supabase.from('participants').update(dbRow).eq('id', item.id);
    }

    return {
      added: toAdd.length,
      updated: toUpdate.length,
      skipped,
      errors,
    };
  }

  // Local fallback
  const all = readLocal(LOCAL_KEYS.PARTICIPANTS) ?? [];
  const existing = all.filter((p) => p.eventId === eventId);
  const existingEmails = new Map(existing.map((p) => [p.email?.toLowerCase(), p.id]));

  const toAdd = [];
  const toUpdate = [];
  const errors = [];
  let skipped = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const emailKey = row.email?.toLowerCase();

    if (capacity > 0 && all.length + toAdd.length >= capacity) {
      errors.push({ row: i + 1, reason: 'Capacity reached', data: row });
      continue;
    }

    if (existingEmails.has(emailKey)) {
      if (duplicateStrategy === 'update') {
        const existingId = existingEmails.get(emailKey);
        toUpdate.push({ id: existingId, ...row });
      } else {
        skipped++;
        errors.push({ row: i + 1, reason: 'Duplicate email', data: row });
      }
    } else {
      toAdd.push({
        id: uuidv4(),
        eventId,
        registrationId: `EF-${Date.now().toString(36).toUpperCase()}-${i}`,
        registeredAt: new Date().toISOString(),
        attended: false,
        customFieldValues: {},
        ...row,
      });
      existingEmails.set(emailKey, toAdd[toAdd.length - 1].id);
    }
  }

  const updated = all.map((p) => {
    const upd = toUpdate.find((u) => u.id === p.id);
    return upd ? { ...p, ...upd, updatedAt: new Date().toISOString() } : p;
  });

  writeLocal(LOCAL_KEYS.PARTICIPANTS, [...updated, ...toAdd]);

  if (event) {
    const newCount = all.filter((p) => p.eventId === eventId).length + toAdd.length;
    await updateEvent(eventId, { registrations: newCount });
  }

  return { added: toAdd.length, updated: toUpdate.length, skipped, errors };
}

/** Update a participant's details */
export async function updateParticipant(id, updates) {
  if (isSupabaseConfigured()) {
    const dbRow = mapParticipantToDb({ ...updates, id });
    delete dbRow.id;
    const { data, error } = await supabase
      .from('participants')
      .update(dbRow)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return mapParticipantFromDb(data);
  }

  const all = readLocal(LOCAL_KEYS.PARTICIPANTS) ?? [];
  const idx = all.findIndex((p) => p.id === id);
  if (idx === -1) throw new Error(`Participant ${id} not found`);
  all[idx] = { ...all[idx], ...updates, updatedAt: new Date().toISOString() };
  writeLocal(LOCAL_KEYS.PARTICIPANTS, all);
  return all[idx];
}

/** Delete a single participant */
export async function deleteParticipant(id) {
  if (isSupabaseConfigured()) {
    const { error } = await supabase.from('participants').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return;
  }

  const all = readLocal(LOCAL_KEYS.PARTICIPANTS) ?? [];
  const participant = all.find((p) => p.id === id);
  writeLocal(LOCAL_KEYS.PARTICIPANTS, all.filter((p) => p.id !== id));

  if (participant) {
    const event = await getEvent(participant.eventId);
    if (event) {
      await updateEvent(participant.eventId, {
        registrations: Math.max(0, (event.registrations ?? 1) - 1),
      });
    }
  }
}

/** Bulk delete participants by ID array */
export async function bulkDeleteParticipants(ids) {
  if (!ids || ids.length === 0) return;

  if (isSupabaseConfigured()) {
    const { error } = await supabase.from('participants').delete().in('id', ids);
    if (error) throw new Error(error.message);
    return;
  }

  const all = readLocal(LOCAL_KEYS.PARTICIPANTS) ?? [];
  const removed = all.filter((p) => ids.includes(p.id));
  writeLocal(LOCAL_KEYS.PARTICIPANTS, all.filter((p) => !ids.includes(p.id)));

  const eventCounts = {};
  removed.forEach((p) => {
    eventCounts[p.eventId] = (eventCounts[p.eventId] ?? 0) + 1;
  });
  for (const [eventId, count] of Object.entries(eventCounts)) {
    const event = await getEvent(eventId);
    if (event) {
      await updateEvent(eventId, {
        registrations: Math.max(0, (event.registrations ?? count) - count),
      });
    }
  }
}

/** Toggle attendance check-in */
export async function toggleAttendance(id) {
  const participant = await getParticipant(id);
  if (!participant) throw new Error(`Participant ${id} not found`);
  const newAttended = !participant.attended;
  return updateParticipant(id, {
    attended: newAttended,
    checkedInAt: newAttended ? new Date().toISOString() : null,
  });
}

// ─── Feedback ─────────────────────────────────────────────────────────────────

/** Fetch feedback, optionally filtered by eventId */
export async function getFeedback(eventId) {
  if (isSupabaseConfigured()) {
    let query = supabase.from('feedback').select('*');
    if (eventId) {
      query = query.eq('event_id', eventId);
    }
    const { data, error } = await query.order('submitted_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []).map(mapFeedbackFromDb);
  }

  const all = readLocal(LOCAL_KEYS.FEEDBACK) ?? [];
  return eventId ? all.filter((f) => f.eventId === eventId) : all;
}

/** Submit feedback */
export async function addFeedback(feedbackData) {
  const newFeedback = {
    id: uuidv4(),
    submittedAt: new Date().toISOString(),
    ...feedbackData,
  };

  if (isSupabaseConfigured()) {
    const dbRow = mapFeedbackToDb(newFeedback);
    const { data, error } = await supabase
      .from('feedback')
      .insert([dbRow])
      .select()
      .single();
    if (error) throw new Error(error.message);
    return mapFeedbackFromDb(data);
  }

  const all = readLocal(LOCAL_KEYS.FEEDBACK) ?? [];
  writeLocal(LOCAL_KEYS.FEEDBACK, [...all, newFeedback]);
  return newFeedback;
}

/** Update feedback */
export async function updateFeedback(id, updates) {
  if (isSupabaseConfigured()) {
    const dbRow = mapFeedbackToDb({ ...updates, id });
    delete dbRow.id;
    const { data, error } = await supabase
      .from('feedback')
      .update(dbRow)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return mapFeedbackFromDb(data);
  }

  const all = readLocal(LOCAL_KEYS.FEEDBACK) ?? [];
  const idx = all.findIndex((f) => f.id === id);
  if (idx === -1) throw new Error(`Feedback ${id} not found`);
  all[idx] = { ...all[idx], ...updates };
  writeLocal(LOCAL_KEYS.FEEDBACK, all);
  return all[idx];
}

/** Delete feedback */
export async function deleteFeedback(id) {
  if (isSupabaseConfigured()) {
    const { error } = await supabase.from('feedback').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return;
  }

  const all = readLocal(LOCAL_KEYS.FEEDBACK) ?? [];
  writeLocal(LOCAL_KEYS.FEEDBACK, all.filter((f) => f.id !== id));
}

// ─── Backup & Restore ─────────────────────────────────────────────────────────

/** Export all data to JSON */
export async function exportAllData() {
  const [events, participants, feedback] = await Promise.all([
    getEvents(),
    getParticipants(),
    getFeedback(),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    version: '1.0',
    source: isSupabaseConfigured() ? 'supabase' : 'localStorage',
    events,
    participants,
    feedback,
  };
}

/** Restore full app data from JSON */
export async function importAllData(data) {
  if (!data.events || !data.participants || !data.feedback) {
    throw new Error('Invalid backup format. Expected events, participants, and feedback.');
  }

  if (isSupabaseConfigured()) {
    // Clear and restore into Supabase
    await clearAllData();

    // Insert events
    const eventRows = data.events.map(mapEventToDb);
    const { error: evErr } = await supabase.from('events').insert(eventRows);
    if (evErr) throw new Error(`Failed to restore events: ${evErr.message}`);

    // Insert participants in chunks of 100
    const pRows = data.participants.map(mapParticipantToDb);
    for (let i = 0; i < pRows.length; i += 100) {
      const chunk = pRows.slice(i, i + 100);
      const { error: pErr } = await supabase.from('participants').insert(chunk);
      if (pErr) throw new Error(`Failed to restore participants: ${pErr.message}`);
    }

    // Insert feedback in chunks of 100
    const fRows = data.feedback.map(mapFeedbackToDb);
    for (let i = 0; i < fRows.length; i += 100) {
      const chunk = fRows.slice(i, i + 100);
      const { error: fErr } = await supabase.from('feedback').insert(chunk);
      if (fErr) throw new Error(`Failed to restore feedback: ${fErr.message}`);
    }

    return;
  }

  // Local fallback
  writeLocal(LOCAL_KEYS.EVENTS, data.events);
  writeLocal(LOCAL_KEYS.PARTICIPANTS, data.participants);
  writeLocal(LOCAL_KEYS.FEEDBACK, data.feedback);
  writeLocal(LOCAL_KEYS.SEEDED, true);
}

/** Clear all data */
export async function clearAllData() {
  if (isSupabaseConfigured()) {
    // Delete in cascade order
    await supabase.from('feedback').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('participants').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('events').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  }

  // Also clear localStorage keys
  writeLocal(LOCAL_KEYS.EVENTS, []);
  writeLocal(LOCAL_KEYS.PARTICIPANTS, []);
  writeLocal(LOCAL_KEYS.FEEDBACK, []);
  localStorage.removeItem(LOCAL_KEYS.SEEDED);
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

/** Compute dashboard statistics */
export async function getDashboardStats() {
  const [events, participants, feedback] = await Promise.all([
    getEvents(),
    getParticipants(),
    getFeedback(),
  ]);

  const now = new Date();
  const upcomingEvents = events.filter((e) => new Date(e.date) > now && e.status === 'open');
  const avgRating = feedback.length
    ? (feedback.reduce((sum, f) => sum + (f.rating ?? 0), 0) / feedback.length).toFixed(1)
    : '—';

  // Registrations per event (for bar chart)
  const registrationsPerEvent = events.map((e) => ({
    name: e.title.length > 20 ? e.title.slice(0, 20) + '…' : e.title,
    registrations: participants.filter((p) => p.eventId === e.id).length,
  }));

  // Registrations over time (last 30 days, for line chart)
  const registrationsOverTime = (() => {
    const map = {};
    const days = 30;
    for (let i = days; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      map[key] = 0;
    }
    participants.forEach((p) => {
      const key = p.registeredAt?.slice(0, 10);
      if (key && key in map) map[key]++;
    });
    return Object.entries(map).map(([date, count]) => ({ date, count }));
  })();

  // Rating distribution
  const ratingDist = [1, 2, 3, 4, 5].map((r) => ({
    rating: r,
    count: feedback.filter((f) => f.rating === r).length,
  }));

  // Recent activity (last 10 participant registrations)
  const recentActivity = [...participants]
    .sort((a, b) => new Date(b.registeredAt) - new Date(a.registeredAt))
    .slice(0, 10)
    .map((p) => {
      const event = events.find((e) => e.id === p.eventId);
      return {
        type: 'registration',
        name: p.name,
        event: event?.title ?? 'Unknown event',
        time: p.registeredAt,
      };
    });

  return {
    totalEvents: events.length,
    totalParticipants: participants.length,
    upcomingEvents: upcomingEvents.length,
    feedbackCount: feedback.length,
    avgRating,
    registrationsPerEvent,
    registrationsOverTime,
    ratingDist,
    recentActivity,
  };
}

export const getStats = getDashboardStats;
