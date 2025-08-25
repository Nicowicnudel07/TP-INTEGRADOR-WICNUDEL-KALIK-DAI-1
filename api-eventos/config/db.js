const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function initializeDatabase() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    console.warn('Supabase credentials are not set. Skipping database initialization.');
    return;
  }

  try {
    await supabase.from('users').select('id').limit(1);
    console.log('Database initialized');
  } catch (err) {
    console.warn('Could not verify database connection:', err.message);
  }
}

// USERS
async function createUser(user) {
  const { data, error } = await supabase
    .from('users')
    .insert([user]);
  if (error) throw error;
  return data[0];
}

async function findUserByEmail(email) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();
  if (error) throw error;
  return data;
}

// Nueva función para buscar usuario por username
async function findUserByUsername(username) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .single();
  if (error) throw error;
  return data;
}

async function findUserById(id) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

// EVENTS
async function createEvent(event) {
  const { data, error } = await supabase
    .from('events')
    .insert([event]);
  if (error) throw error;
  return data[0];
}

async function findEventById(id) {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

async function getAllEvents(filters = {}) {
  let query = supabase.from('events').select('*');
  if (filters.name) {
    query = query.ilike('name', `%${filters.name}%`);
  }
  if (filters.startdate) {
    query = query.eq('start_date', filters.startdate);
  }
  if (filters.page && filters.limit) {
    const page = parseInt(filters.page);
    const limit = parseInt(filters.limit);
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

async function updateEvent(id, updates) {
  const { data, error } = await supabase
    .from('events')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function deleteEvent(id) {
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return true;
}

// EVENT TAGS
async function addEventTag(eventId, tagId) {
  const { error } = await supabase
    .from('event_tags')
    .insert([{ id_event: eventId, id_tag: tagId }]);
  if (error) throw error;
  return true;
}

async function removeEventTags(eventId) {
  const { error } = await supabase
    .from('event_tags')
    .delete()
    .eq('id_event', eventId);
  if (error) throw error;
  return true;
}

async function getEventTags(eventId) {
  const { data, error } = await supabase
    .from('tags')
    .select('*,event_tags(id_event)')
    .eq('event_tags.id_event', eventId);
  if (error) throw error;
  return data;
}

// EVENT LOCATIONS
async function createEventLocation(location) {
  const { data, error } = await supabase
    .from('event_locations')
    .insert([location]);
  if (error) throw error;
  return data[0];
}

async function findEventLocationById(id) {
  const { data, error } = await supabase
    .from('event_locations')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

async function getEventLocationsByUser(userId) {
  const { data, error } = await supabase
    .from('event_locations')
    .select('*')
    .eq('id_creator_user', userId);
  if (error) throw error;
  return data;
}

async function updateEventLocation(id, updates) {
  const { data, error } = await supabase
    .from('event_locations')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function deleteEventLocation(id) {
  // Chequear si hay eventos con esa ubicación
  const { data: events, error: errorEvents } = await supabase
    .from('events')
    .select('id')
    .eq('id_event_location', id);
  if (errorEvents) throw errorEvents;
  if (events.length > 0) return false;

  const { error } = await supabase
    .from('event_locations')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return true;
}

// ENROLLMENTS
async function createEnrollment(enrollment) {
  const { data, error } = await supabase
    .from('event_enrollments')
    .insert([{
      id_event: enrollment.id_event,
      id_user: enrollment.id_user,
      registration_date_time: new Date().toISOString(),
      attended: false
    }]);
  if (error) throw error;
  return data[0];
}

async function findEnrollment(eventId, userId) {
  const { data, error } = await supabase
    .from('event_enrollments')
    .select('*')
    .eq('id_event', eventId)
    .eq('id_user', userId)
    .single();
  if (error) throw error;
  return data;
}

async function deleteEnrollment(eventId, userId) {
  const { error } = await supabase
    .from('event_enrollments')
    .delete()
    .eq('id_event', eventId)
    .eq('id_user', userId);
  if (error) throw error;
  return true;
}

async function getEventEnrollments(eventId) {
  const { data, error } = await supabase
    .from('event_enrollments')
    .select('*')
    .eq('id_event', eventId);
  if (error) throw error;
  return data;
}

// TAGS
async function getAllTags() {
  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .order('name');
  if (error) throw error;
  return data;
}

async function findTagById(id) {
  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

// PROVINCES
async function getAllProvinces() {
  const { data, error } = await supabase
    .from('provinces')
    .select('*')
    .order('name');
  if (error) throw error;
  return data;
}

async function findProvinceById(id) {
  const { data, error } = await supabase
    .from('provinces')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

// LOCATIONS
async function getLocationsByProvince(provinceId) {
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .eq('id_province', provinceId)
    .order('name');
  if (error) throw error;
  return data;
}

async function findLocationById(id) {
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

module.exports = {
  initializeDatabase,
  // Users
  createUser,
  findUserByEmail,
  findUserByUsername,
  findUserById,
  // Events
  createEvent,
  findEventById,
  getAllEvents,
  updateEvent,
  deleteEvent,
  // Event Tags
  addEventTag,
  removeEventTags,
  getEventTags,
  // Event Locations
  createEventLocation,
  findEventLocationById,
  getEventLocationsByUser,
  updateEventLocation,
  deleteEventLocation,
  // Enrollments
  createEnrollment,
  findEnrollment,
  deleteEnrollment,
  getEventEnrollments,
  // Tags
  getAllTags,
  findTagById,
  // Provinces
  getAllProvinces,
  findProvinceById,
  // Locations
  getLocationsByProvince,
  findLocationById,
  // Supabase client (por si lo necesitás para queries custom)
  supabase,
  initializeDatabase
};
