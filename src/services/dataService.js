/**
 * dataService.js — ALL data operations live here.
 *
 * Currently backed by localStorage.
 * Every exported function has a "// TODO: replace with DB call" comment.
 * To connect a real database (REST API, Supabase, Firebase, etc.):
 *   1. Install your database client / SDK.
 *   2. Replace the localStorage logic inside each function with an API call.
 *   3. The UI imports only these functions and does NOT need to change.
 *
 * Keys used in localStorage:
 *   ef_events        — Array<Event>
 *   ef_participants  — Array<Participant>
 *   ef_feedback      — Array<Feedback>
 *   ef_seeded        — boolean (prevents re-seeding)
 */

import { v4 as uuidv4 } from '../utils/uuid.js';
import { seedData } from '../utils/seedData.js';

// ─── Helpers ────────────────────────────────────────────────────────────────

const KEYS = {
  EVENTS: 'ef_events',
  PARTICIPANTS: 'ef_participants',
  FEEDBACK: 'ef_feedback',
  SEEDED: 'ef_seeded',
};

function read(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function write(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

// Simulate async latency so the UI can show skeletons (remove in production)
const delay = (ms = 0) => new Promise((r) => setTimeout(r, ms));

// ─── Seed on first load ───────────────────────────────────────────────────────

export async function initializeData() {
  // TODO: replace with DB call
  if (read(KEYS.SEEDED)) return;
  const { events, participants, feedback } = seedData();
  write(KEYS.EVENTS, events);
  write(KEYS.PARTICIPANTS, participants);
  write(KEYS.FEEDBACK, feedback);
  write(KEYS.SEEDED, true);
}

// ─── Events ──────────────────────────────────────────────────────────────────

/** Fetch all events. TODO: replace with DB call */
export async function getEvents() {
  // TODO: replace with DB call
  await delay(50);
  return read(KEYS.EVENTS) ?? [];
}

/** Fetch a single event by id. TODO: replace with DB call */
export async function getEvent(id) {
  // TODO: replace with DB call
  await delay(50);
  const events = read(KEYS.EVENTS) ?? [];
  return events.find((e) => e.id === id) ?? null;
}

/** Create a new event. TODO: replace with DB call */
export async function createEvent(eventData) {
  // TODO: replace with DB call
  await delay(50);
  const events = read(KEYS.EVENTS) ?? [];
  const newEvent = {
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    registrations: 0,
    customFields: [],
    ...eventData,
  };
  write(KEYS.EVENTS, [...events, newEvent]);
  return newEvent;
}

/** Update an existing event. TODO: replace with DB call */
export async function updateEvent(id, updates) {
  // TODO: replace with DB call
  await delay(50);
  const events = read(KEYS.EVENTS) ?? [];
  const idx = events.findIndex((e) => e.id === id);
  if (idx === -1) throw new Error(`Event ${id} not found`);
  events[idx] = { ...events[idx], ...updates, updatedAt: new Date().toISOString() };
  write(KEYS.EVENTS, events);
  return events[idx];
}

/** Delete an event and all its participants & feedback. TODO: replace with DB call */
export async function deleteEvent(id) {
  // TODO: replace with DB call
  await delay(50);
  const events = read(KEYS.EVENTS) ?? [];
  write(KEYS.EVENTS, events.filter((e) => e.id !== id));

  // Cascade delete participants and feedback
  const participants = read(KEYS.PARTICIPANTS) ?? [];
  write(KEYS.PARTICIPANTS, participants.filter((p) => p.eventId !== id));
  const feedback = read(KEYS.FEEDBACK) ?? [];
  write(KEYS.FEEDBACK, feedback.filter((f) => f.eventId !== id));
}

/** Duplicate an event (clears registrations). TODO: replace with DB call */
export async function duplicateEvent(id) {
  // TODO: replace with DB call
  const source = await getEvent(id);
  if (!source) throw new Error(`Event ${id} not found`);
  const { id: _id, createdAt: _c, updatedAt: _u, registrations: _r, ...rest } = source;
  return createEvent({
    ...rest,
    title: `${source.title} (Copy)`,
    status: 'draft',
  });
}

// ─── Participants ─────────────────────────────────────────────────────────────

/** Fetch all participants, optionally filtered by eventId. TODO: replace with DB call */
export async function getParticipants(eventId) {
  // TODO: replace with DB call
  await delay(50);
  const all = read(KEYS.PARTICIPANTS) ?? [];
  return eventId ? all.filter((p) => p.eventId === eventId) : all;
}

/** Fetch a single participant. TODO: replace with DB call */
export async function getParticipant(id) {
  // TODO: replace with DB call
  await delay(50);
  const all = read(KEYS.PARTICIPANTS) ?? [];
  return all.find((p) => p.id === id) ?? null;
}

/** Add a single participant (registration). TODO: replace with DB call */
export async function addParticipant(participantData) {
  // TODO: replace with DB call
  await delay(50);
  const all = read(KEYS.PARTICIPANTS) ?? [];

  // Duplicate email check within the same event
  const duplicate = all.find(
    (p) => p.eventId === participantData.eventId && p.email?.toLowerCase() === participantData.email?.toLowerCase()
  );
  if (duplicate) throw new Error('DUPLICATE_EMAIL');

  // Capacity check
  const event = await getEvent(participantData.eventId);
  if (event && event.capacity > 0) {
    const count = all.filter((p) => p.eventId === participantData.eventId).length;
    if (count >= event.capacity) throw new Error('CAPACITY_REACHED');
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
  write(KEYS.PARTICIPANTS, [...all, newParticipant]);

  // Increment event registration count
  if (event) {
    await updateEvent(participantData.eventId, { registrations: (event.registrations ?? 0) + 1 });
  }

  return newParticipant;
}

/**
 * Bulk add participants from a parsed array.
 * Supports "skipDuplicates" or "updateExisting" strategy.
 * TODO: replace with DB call (ideally a batched insert endpoint).
 *
 * @param {string} eventId
 * @param {Array} rows - Array of participant objects
 * @param {{ duplicateStrategy: 'skip'|'update' }} options
 * @returns {{ added: number, updated: number, skipped: number, errors: Array }}
 */
export async function bulkAddParticipants(eventId, rows, options = {}) {
  // TODO: replace with DB call
  // NOTE: This is called from the Web Worker result handler, not the worker itself.
  // TODO: replace with DB call — e.g., POST /api/events/:id/participants/bulk
  const { duplicateStrategy = 'skip' } = options;
  const all = read(KEYS.PARTICIPANTS) ?? [];
  const event = await getEvent(eventId);
  const capacity = event?.capacity ?? 0;

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

  // Apply updates
  const updated = all.map((p) => {
    const upd = toUpdate.find((u) => u.id === p.id);
    return upd ? { ...p, ...upd, updatedAt: new Date().toISOString() } : p;
  });

  // Append new
  write(KEYS.PARTICIPANTS, [...updated, ...toAdd]);

  // Update event registration count
  if (event) {
    const newCount = (all.filter((p) => p.eventId === eventId).length + toAdd.length);
    await updateEvent(eventId, { registrations: newCount });
  }

  return {
    added: toAdd.length,
    updated: toUpdate.length,
    skipped,
    errors,
  };
}

/** Update a participant's data. TODO: replace with DB call */
export async function updateParticipant(id, updates) {
  // TODO: replace with DB call
  await delay(50);
  const all = read(KEYS.PARTICIPANTS) ?? [];
  const idx = all.findIndex((p) => p.id === id);
  if (idx === -1) throw new Error(`Participant ${id} not found`);
  all[idx] = { ...all[idx], ...updates, updatedAt: new Date().toISOString() };
  write(KEYS.PARTICIPANTS, all);
  return all[idx];
}

/** Delete a single participant. TODO: replace with DB call */
export async function deleteParticipant(id) {
  // TODO: replace with DB call
  await delay(50);
  const all = read(KEYS.PARTICIPANTS) ?? [];
  const participant = all.find((p) => p.id === id);
  write(KEYS.PARTICIPANTS, all.filter((p) => p.id !== id));

  // Decrement event registration count
  if (participant) {
    const event = await getEvent(participant.eventId);
    if (event) {
      await updateEvent(participant.eventId, { registrations: Math.max(0, (event.registrations ?? 1) - 1) });
    }
  }
}

/** Bulk delete participants by id array. TODO: replace with DB call */
export async function bulkDeleteParticipants(ids) {
  // TODO: replace with DB call
  await delay(50);
  const all = read(KEYS.PARTICIPANTS) ?? [];
  const removed = all.filter((p) => ids.includes(p.id));
  write(KEYS.PARTICIPANTS, all.filter((p) => !ids.includes(p.id)));

  // Decrement counts per event
  const eventCounts = {};
  removed.forEach((p) => {
    eventCounts[p.eventId] = (eventCounts[p.eventId] ?? 0) + 1;
  });
  for (const [eventId, count] of Object.entries(eventCounts)) {
    const event = await getEvent(eventId);
    if (event) {
      await updateEvent(eventId, { registrations: Math.max(0, (event.registrations ?? count) - count) });
    }
  }
}

/** Toggle attendance check-in for a participant. TODO: replace with DB call */
export async function toggleAttendance(id) {
  // TODO: replace with DB call
  const participant = await getParticipant(id);
  if (!participant) throw new Error(`Participant ${id} not found`);
  return updateParticipant(id, { attended: !participant.attended, checkedInAt: !participant.attended ? new Date().toISOString() : null });
}

// ─── Feedback ─────────────────────────────────────────────────────────────────

/** Fetch all feedback, optionally filtered by eventId. TODO: replace with DB call */
export async function getFeedback(eventId) {
  // TODO: replace with DB call
  await delay(50);
  const all = read(KEYS.FEEDBACK) ?? [];
  return eventId ? all.filter((f) => f.eventId === eventId) : all;
}

/** Add a feedback response. TODO: replace with DB call */
export async function addFeedback(feedbackData) {
  // TODO: replace with DB call
  await delay(50);
  const all = read(KEYS.FEEDBACK) ?? [];
  const newFeedback = {
    id: uuidv4(),
    submittedAt: new Date().toISOString(),
    ...feedbackData,
  };
  write(KEYS.FEEDBACK, [...all, newFeedback]);
  return newFeedback;
}

/** Update a feedback entry. TODO: replace with DB call */
export async function updateFeedback(id, updates) {
  // TODO: replace with DB call
  await delay(50);
  const all = read(KEYS.FEEDBACK) ?? [];
  const idx = all.findIndex((f) => f.id === id);
  if (idx === -1) throw new Error(`Feedback ${id} not found`);
  all[idx] = { ...all[idx], ...updates };
  write(KEYS.FEEDBACK, all);
  return all[idx];
}

/** Delete a feedback entry. TODO: replace with DB call */
export async function deleteFeedback(id) {
  // TODO: replace with DB call
  await delay(50);
  const all = read(KEYS.FEEDBACK) ?? [];
  write(KEYS.FEEDBACK, all.filter((f) => f.id !== id));
}

// ─── Full backup / restore ────────────────────────────────────────────────────

/** Export the full app data as a JSON object. TODO: replace with DB call */
export async function exportAllData() {
  // TODO: replace with DB call — e.g., GET /api/backup
  return {
    exportedAt: new Date().toISOString(),
    version: '1.0',
    events: read(KEYS.EVENTS) ?? [],
    participants: read(KEYS.PARTICIPANTS) ?? [],
    feedback: read(KEYS.FEEDBACK) ?? [],
  };
}

/** Import (restore) full app data from a JSON object. TODO: replace with DB call */
export async function importAllData(data) {
  // TODO: replace with DB call — e.g., POST /api/restore
  if (!data.events || !data.participants || !data.feedback) throw new Error('Invalid backup format');
  write(KEYS.EVENTS, data.events);
  write(KEYS.PARTICIPANTS, data.participants);
  write(KEYS.FEEDBACK, data.feedback);
  write(KEYS.SEEDED, true);
}

/** Clear all app data (factory reset). TODO: replace with DB call */
export async function clearAllData() {
  // TODO: replace with DB call — e.g., DELETE /api/data
  Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
}

// ─── Dashboard stats ──────────────────────────────────────────────────────────

/** Compute dashboard statistics. TODO: replace with DB call / aggregation query */
export async function getDashboardStats() {
  // TODO: replace with DB call
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

/** Alias for getDashboardStats. // TODO: replace with DB call */
export const getStats = getDashboardStats;

