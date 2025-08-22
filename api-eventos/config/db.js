const { Pool } = require('pg');
require('dotenv').config();

// Crear pool de conexiones PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/eventos_db',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Inicializar base de datos
const initializeDatabase = async () => {
  try {
    // Verificar conexión
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    
    console.log('Conexión a PostgreSQL establecida correctamente');
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
    const { rows } = await pool.query(
      'INSERT INTO users (first_name, last_name, email, password_hash) VALUES ($1, $2, $3, $4) RETURNING *',
      [user.first_name, user.last_name, user.email, user.password_hash]
    );
    return rows[0];
  },
  
  findUserByEmail: async (email) => {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return rows[0];
  },
  
  findUserById: async (id) => {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    return rows[0];
  },
  
  // Events
  createEvent: async (event) => {
    const { rows } = await pool.query(
      `INSERT INTO events (name, description, id_event_location, start_date, duration_in_minutes, price, enabled_for_enrollment, max_assistance, id_creator_user) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [event.name, event.description, event.id_event_location, event.start_date, event.duration_in_minutes, event.price, event.enabled_for_enrollment, event.max_assistance, event.id_creator_user]
    );
    return rows[0];
  },
  
  findEventById: async (id) => {
    const { rows } = await pool.query(
      'SELECT * FROM events WHERE id = $1',
      [id]
    );
    return rows[0];
  },
  
  getAllEvents: async (filters = {}) => {
    let query = `
      SELECT e.*, 
             u.first_name as creator_first_name, u.last_name as creator_last_name, u.email as creator_email,
             el.name as location_name, el.address as location_address,
             l.name as locality_name, p.name as province_name
      FROM events e
      LEFT JOIN users u ON e.id_creator_user = u.id
      LEFT JOIN event_locations el ON e.id_event_location = el.id
      LEFT JOIN locations l ON el.id_location = l.id
      LEFT JOIN provinces p ON l.id_province = p.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;
    
    // Aplicar filtros
    if (filters.name) {
      paramCount++;
      query += ` AND e.name ILIKE $${paramCount}`;
      params.push(`%${filters.name}%`);
    }
    
    if (filters.startdate) {
      paramCount++;
      query += ` AND DATE(e.start_date) = $${paramCount}`;
      params.push(filters.startdate);
    }
    
    // Ordenar por fecha
    query += ' ORDER BY e.start_date ASC';
    
    // Paginación
    if (filters.page && filters.limit) {
      const page = parseInt(filters.page);
      const limit = parseInt(filters.limit);
      const offset = (page - 1) * limit;
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      params.push(limit);
      paramCount++;
      query += ` OFFSET $${paramCount}`;
      params.push(offset);
    }
    
    const { rows } = await pool.query(query, params);
    
    // Si hay filtro por tag, hay que hacerlo por separado
    if (filters.tag) {
      const { rows: tagRows } = await pool.query(
        'SELECT id FROM tags WHERE name ILIKE $1',
        [`%${filters.tag}%`]
      );
      
      if (tagRows.length > 0) {
        const tagIds = tagRows.map(t => t.id);
        const { rows: eventTagRows } = await pool.query(
          'SELECT id_event FROM event_tags WHERE id_tag = ANY($1)',
          [tagIds]
        );
        
        if (eventTagRows.length > 0) {
          const eventIds = eventTagRows.map(et => et.id_event);
          return rows.filter(event => eventIds.includes(event.id));
        }
        return [];
      }
      return [];
    }
    
    return rows;
  },
  
  updateEvent: async (id, updates) => {
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    
    const { rows } = await pool.query(
      `UPDATE events SET ${setClause} WHERE id = $1 RETURNING *`,
      [id, ...values]
    );
    return rows[0];
  },
  
  deleteEvent: async (id) => {
    // Primero eliminar las referencias en event_tags
    await pool.query('DELETE FROM event_tags WHERE id_event = $1', [id]);
    
    // Luego eliminar el evento
    await pool.query('DELETE FROM events WHERE id = $1', [id]);
    return true;
  },
  
  // Event Tags
  addEventTag: async (eventId, tagId) => {
    await pool.query(
      'INSERT INTO event_tags (id_event, id_tag) VALUES ($1, $2)',
      [eventId, tagId]
    );
    return true;
  },
  
  removeEventTags: async (eventId) => {
    await pool.query('DELETE FROM event_tags WHERE id_event = $1', [eventId]);
    return true;
  },
  
  getEventTags: async (eventId) => {
    const { rows } = await pool.query(
      'SELECT t.* FROM tags t JOIN event_tags et ON t.id = et.id_tag WHERE et.id_event = $1',
      [eventId]
    );
    return rows;
  },
  
  // Event Locations
  createEventLocation: async (location) => {
    const { rows } = await pool.query(
      'INSERT INTO event_locations (name, address, id_location, id_creator_user) VALUES ($1, $2, $3, $4) RETURNING *',
      [location.name, location.address, location.id_location, location.id_creator_user]
    );
    return rows[0];
  },
  
  findEventLocationById: async (id) => {
    const { rows } = await pool.query(
      'SELECT * FROM event_locations WHERE id = $1',
      [id]
    );
    return rows[0];
  },
  
  getEventLocationsByUser: async (userId) => {
    const { rows } = await pool.query(
      'SELECT * FROM event_locations WHERE id_creator_user = $1',
      [userId]
    );
    return rows;
  },
  
  updateEventLocation: async (id, updates) => {
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    
    const { rows } = await pool.query(
      `UPDATE event_locations SET ${setClause} WHERE id = $1 RETURNING *`,
      [id, ...values]
    );
    return rows[0];
  },
  
  deleteEventLocation: async (id) => {
    // Verificar si hay eventos que usen esta ubicación
    const { rows: events } = await pool.query(
      'SELECT id FROM events WHERE id_event_location = $1',
      [id]
    );
    
    if (events.length > 0) {
      return false; // No se puede eliminar porque hay eventos asociados
    }
    
    // Eliminar la ubicación
    await pool.query('DELETE FROM event_locations WHERE id = $1', [id]);
    return true;
  },
  
  // Enrollments
  createEnrollment: async (enrollment) => {
    const { rows } = await pool.query(
      'INSERT INTO event_enrollments (id_event, id_user, registration_date_time, attended) VALUES ($1, $2, NOW(), false) RETURNING *',
      [enrollment.id_event, enrollment.id_user]
    );
    return rows[0];
  },
  
  findEnrollment: async (eventId, userId) => {
    const { rows } = await pool.query(
      'SELECT * FROM event_enrollments WHERE id_event = $1 AND id_user = $2',
      [eventId, userId]
    );
    return rows[0];
  },
  
  deleteEnrollment: async (eventId, userId) => {
    await pool.query(
      'DELETE FROM event_enrollments WHERE id_event = $1 AND id_user = $2',
      [eventId, userId]
    );
    return true;
  },
  
  getEventEnrollments: async (eventId) => {
    const { rows } = await pool.query(
      'SELECT * FROM event_enrollments WHERE id_event = $1',
      [eventId]
    );
    return rows;
  },
  
  // Tags
  getAllTags: async () => {
    const { rows } = await pool.query('SELECT * FROM tags ORDER BY name');
    return rows;
  },
  
  findTagById: async (id) => {
    const { rows } = await pool.query('SELECT * FROM tags WHERE id = $1', [id]);
    return rows[0];
  },
  
  // Provinces
  getAllProvinces: async () => {
    const { rows } = await pool.query('SELECT * FROM provinces ORDER BY name');
    return rows;
  },
  
  findProvinceById: async (id) => {
    const { rows } = await pool.query('SELECT * FROM provinces WHERE id = $1', [id]);
    return rows[0];
  },
  
  // Locations
  getLocationsByProvince: async (provinceId) => {
    const { rows } = await pool.query(
      'SELECT * FROM locations WHERE id_province = $1 ORDER BY name',
      [provinceId]
    );
    return rows;
  },
  
  findLocationById: async (id) => {
    const { rows } = await pool.query('SELECT * FROM locations WHERE id = $1', [id]);
    return rows[0];
  }
};

// Función para mantener compatibilidad con el código original
const query = async (queryString, params = []) => {
  const { rows } = await pool.query(queryString, params);
  return { rows };
};

module.exports = { 
  initializeDatabase, 
  dbOperations,
  query, // Para compatibilidad con código original
  pool // Exponer el pool de conexiones por si se necesita
};