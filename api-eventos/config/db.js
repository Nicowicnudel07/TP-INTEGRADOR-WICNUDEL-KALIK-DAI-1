const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Crear cliente de Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Inicializar base de datos
const initializeDatabase = async () => {
  try {
    // Verificar conexión
    const { data, error } = await supabase.from('users').select('count');
    
    if (error) {
      console.error('Error conectando a Supabase:', error);
      throw error;
    }
    
    console.log('Conexión a Supabase establecida correctamente');
    return true;
  } catch (error) {
    console.error('Error inicializando la base de datos:', error);
    throw error;
  }
};

// Funciones helper para operaciones de base de datos
const dbOperations = {
  // Users
  createUser: async (user) => {
    const { data, error } = await supabase
      .from('users')
      .insert([user])
      .select();
    
    if (error) throw error;
    return data[0];
  },
  
  findUserByUsername: async (username) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 es el código para "no se encontraron resultados"
    return data;
  },
  
  findUserById: async (id) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },
  
  // Events
  createEvent: async (event) => {
    const { data, error } = await supabase
      .from('events')
      .insert([event])
      .select();
    
    if (error) throw error;
    return data[0];
  },
  
  findEventById: async (id) => {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },
  
  getAllEvents: async (filters = {}) => {
    let query = supabase
      .from('events')
      .select('*');
    
    // Aplicar filtros
    if (filters.name) {
      query = query.ilike('name', `%${filters.name}%`);
    }
    
    if (filters.startdate) {
      // Convertir la fecha a formato ISO para comparación
      const startDate = new Date(filters.startdate);
      const nextDay = new Date(startDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      query = query.gte('start_date', startDate.toISOString())
                   .lt('start_date', nextDay.toISOString());
    }
    
    // Paginación
    if (filters.page && filters.limit) {
      const page = parseInt(filters.page);
      const limit = parseInt(filters.limit);
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      
      query = query.range(from, to);
    }
    
    // Ordenar por fecha
    query = query.order('start_date', { ascending: true });
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Si hay filtro por tag, hay que hacerlo por separado
    if (filters.tag) {
      // Obtener IDs de tags que coinciden con el nombre
      const { data: tagData, error: tagError } = await supabase
        .from('tags')
        .select('id')
        .ilike('name', `%${filters.tag}%`);
      
      if (tagError) throw tagError;
      
      if (tagData && tagData.length > 0) {
        const tagIds = tagData.map(t => t.id);
        
        // Obtener IDs de eventos que tienen esos tags
        const { data: eventTagData, error: eventTagError } = await supabase
          .from('event_tags')
          .select('id_event')
          .in('id_tag', tagIds);
        
        if (eventTagError) throw eventTagError;
        
        if (eventTagData && eventTagData.length > 0) {
          const eventIds = eventTagData.map(et => et.id_event);
          // Filtrar los eventos que tienen esos tags
          return data.filter(event => eventIds.includes(event.id));
        }
        return [];
      }
      return [];
    }
    
    return data;
  },
  
  updateEvent: async (id, updates) => {
    const { data, error } = await supabase
      .from('events')
      .update(updates)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data[0];
  },
  
  deleteEvent: async (id) => {
    // Primero eliminar las referencias en event_tags
    const { error: tagError } = await supabase
      .from('event_tags')
      .delete()
      .eq('id_event', id);
    
    if (tagError) throw tagError;
    
    // Luego eliminar el evento
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  },
  
  // Event Tags
  addEventTag: async (eventId, tagId) => {
    const { error } = await supabase
      .from('event_tags')
      .insert([{ id_event: eventId, id_tag: tagId }]);
    
    if (error) throw error;
    return true;
  },
  
  removeEventTags: async (eventId) => {
    const { error } = await supabase
      .from('event_tags')
      .delete()
      .eq('id_event', eventId);
    
    if (error) throw error;
    return true;
  },
  
  getEventTags: async (eventId) => {
    const { data, error } = await supabase
      .from('event_tags')
      .select('id_tag')
      .eq('id_event', eventId);
    
    if (error) throw error;
    
    if (data && data.length > 0) {
      const tagIds = data.map(et => et.id_tag);
      
      const { data: tagData, error: tagError } = await supabase
        .from('tags')
        .select('*')
        .in('id', tagIds);
      
      if (tagError) throw tagError;
      return tagData;
    }
    
    return [];
  },
  
  // Event Locations
  createEventLocation: async (location) => {
    const { data, error } = await supabase
      .from('event_locations')
      .insert([location])
      .select();
    
    if (error) throw error;
    return data[0];
  },
  
  findEventLocationById: async (id) => {
    const { data, error } = await supabase
      .from('event_locations')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },
  
  getEventLocationsByUser: async (userId) => {
    const { data, error } = await supabase
      .from('event_locations')
      .select('*')
      .eq('id_creator_user', userId);
    
    if (error) throw error;
    return data;
  },
  
  updateEventLocation: async (id, updates) => {
    const { data, error } = await supabase
      .from('event_locations')
      .update(updates)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data[0];
  },
  
  deleteEventLocation: async (id) => {
    // Verificar si hay eventos que usen esta ubicación
    const { data: events, error: eventError } = await supabase
      .from('events')
      .select('id')
      .eq('id_event_location', id);
    
    if (eventError) throw eventError;
    
    if (events && events.length > 0) {
      return false; // No se puede eliminar porque hay eventos asociados
    }
    
    // Eliminar la ubicación
    const { error } = await supabase
      .from('event_locations')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  },
  
  // Enrollments
  createEnrollment: async (enrollment) => {
    enrollment.registration_date_time = new Date().toISOString();
    enrollment.attended = false;
    
    const { data, error } = await supabase
      .from('event_enrollments')
      .insert([enrollment])
      .select();
    
    if (error) throw error;
    return data[0];
  },
  
  findEnrollment: async (eventId, userId) => {
    const { data, error } = await supabase
      .from('event_enrollments')
      .select('*')
      .eq('id_event', eventId)
      .eq('id_user', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },
  
  deleteEnrollment: async (eventId, userId) => {
    const { error } = await supabase
      .from('event_enrollments')
      .delete()
      .eq('id_event', eventId)
      .eq('id_user', userId);
    
    if (error) throw error;
    return true;
  },
  
  getEventEnrollments: async (eventId) => {
    const { data, error } = await supabase
      .from('event_enrollments')
      .select('*')
      .eq('id_event', eventId);
    
    if (error) throw error;
    return data;
  },
  
  // Tags
  getAllTags: async () => {
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data;
  },
  
  findTagById: async (id) => {
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },
  
  // Provinces
  getAllProvinces: async () => {
    const { data, error } = await supabase
      .from('provinces')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data;
  },
  
  findProvinceById: async (id) => {
    const { data, error } = await supabase
      .from('provinces')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },
  
  // Locations
  getLocationsByProvince: async (provinceId) => {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('id_province', provinceId)
      .order('name');
    
    if (error) throw error;
    return data;
  },
  
  findLocationById: async (id) => {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }
};

// Función para mantener compatibilidad con el código original
const query = async (queryString, params = []) => {
  console.warn('La función query() está en desuso. Usa dbOperations en su lugar.');
  return { rows: [] };
};

module.exports = { 
  initializeDatabase, 
  dbOperations,
  query, // Para compatibilidad con código original
  supabase // Exponer el cliente de Supabase por si se necesita
};