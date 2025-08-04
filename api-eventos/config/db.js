const fs = require('fs');
const path = require('path');

// Crear conexión a base de datos JSON
const dbPath = path.resolve(__dirname, '..', 'database.json');

// Inicializar base de datos
let db = {
  users: [],
  provinces: [],
  locations: [],
  event_locations: [],
  events: [],
  tags: [],
  event_tags: [],
  event_enrollments: []
};

// Cargar base de datos desde archivo
const loadDatabase = () => {
  try {
    if (fs.existsSync(dbPath)) {
      const data = fs.readFileSync(dbPath, 'utf8');
      db = JSON.parse(data);
    } else {
      saveDatabase();
    }
  } catch (error) {
    console.error('Error loading database:', error);
  }
};

// Guardar base de datos en archivo
const saveDatabase = () => {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
  } catch (error) {
    console.error('Error saving database:', error);
  }
};

// Crear las tablas si no existen
const createTables = () => {
  // Las tablas ya están definidas en el objeto db
  console.log('Database initialized successfully');
};

// Inicializar la base de datos
const initializeDatabase = async () => {
  loadDatabase();
  createTables();
  return db;
};

// Funciones helper para operaciones de base de datos
const dbOperations = {
  // Users
  createUser: (user) => {
    user.id = db.users.length + 1;
    db.users.push(user);
    saveDatabase();
    return user;
  },
  
  findUserByUsername: (username) => {
    return db.users.find(user => user.username === username);
  },
  
  findUserById: (id) => {
    return db.users.find(user => user.id == id);
  },
  
  // Events
  createEvent: (event) => {
    event.id = db.events.length + 1;
    db.events.push(event);
    saveDatabase();
    return event;
  },
  
  findEventById: (id) => {
    return db.events.find(event => event.id == id);
  },
  
  getAllEvents: () => {
    return db.events;
  },
  
  updateEvent: (id, updates) => {
    const event = db.events.find(e => e.id == id);
    if (event) {
      Object.assign(event, updates);
      saveDatabase();
      return event;
    }
    return null;
  },
  
  deleteEvent: (id) => {
    const index = db.events.findIndex(e => e.id == id);
    if (index !== -1) {
      db.events.splice(index, 1);
      saveDatabase();
      return true;
    }
    return false;
  },
  
  // Event Locations
  createEventLocation: (location) => {
    location.id = db.event_locations.length + 1;
    db.event_locations.push(location);
    saveDatabase();
    return location;
  },
  
  findEventLocationById: (id) => {
    return db.event_locations.find(loc => loc.id == id);
  },
  
  getEventLocationsByUser: (userId) => {
    return db.event_locations.filter(loc => loc.id_creator_user == userId);
  },
  
  // Enrollments
  createEnrollment: (enrollment) => {
    enrollment.id = db.event_enrollments.length + 1;
    enrollment.registration_date_time = new Date().toISOString();
    db.event_enrollments.push(enrollment);
    saveDatabase();
    return enrollment;
  },
  
  findEnrollment: (eventId, userId) => {
    return db.event_enrollments.find(e => e.id_event == eventId && e.id_user == userId);
  },
  
  deleteEnrollment: (eventId, userId) => {
    const index = db.event_enrollments.findIndex(e => e.id_event == eventId && e.id_user == userId);
    if (index !== -1) {
      db.event_enrollments.splice(index, 1);
      saveDatabase();
      return true;
    }
    return false;
  },
  
  getEventEnrollments: (eventId) => {
    return db.event_enrollments.filter(e => e.id_event == eventId);
  }
};

module.exports = { db, initializeDatabase, dbOperations };