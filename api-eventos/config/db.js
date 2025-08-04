const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Crear conexión a SQLite
const dbPath = path.join(__dirname, '..', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// Crear las tablas si no existen
const createTables = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Tabla users
      db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        username VARCHAR(255) UNIQUE NOT NULL,
        password TEXT NOT NULL
      )`);

      // Tabla provinces
      db.run(`CREATE TABLE IF NOT EXISTS provinces (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(100) NOT NULL,
        full_name VARCHAR(255),
        latitude VARCHAR(50),
        longitude VARCHAR(50),
        display_order INTEGER
      )`);

      // Tabla locations
      db.run(`CREATE TABLE IF NOT EXISTS locations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(100) NOT NULL,
        id_province INTEGER REFERENCES provinces(id),
        latitude VARCHAR(50),
        longitude VARCHAR(50)
      )`);

      // Tabla event_locations
      db.run(`CREATE TABLE IF NOT EXISTS event_locations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        id_location INTEGER REFERENCES locations(id),
        name VARCHAR(255) NOT NULL,
        full_address VARCHAR(255),
        max_capacity INTEGER NOT NULL,
        latitude VARCHAR(50),
        longitude VARCHAR(50),
        id_creator_user INTEGER REFERENCES users(id)
      )`);

      // Tabla events
      db.run(`CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        id_event_location INTEGER REFERENCES event_locations(id),
        start_date DATETIME NOT NULL,
        duration_in_minutes INTEGER NOT NULL,
        price REAL NOT NULL,
        enabled_for_enrollment BOOLEAN NOT NULL DEFAULT 1,
        max_assistance INTEGER NOT NULL,
        id_creator_user INTEGER REFERENCES users(id)
      )`);

      // Tabla tags
      db.run(`CREATE TABLE IF NOT EXISTS tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(100) NOT NULL
      )`);

      // Tabla event_tags
      db.run(`CREATE TABLE IF NOT EXISTS event_tags (
        id_event INTEGER REFERENCES events(id),
        id_tag INTEGER REFERENCES tags(id),
        PRIMARY KEY (id_event, id_tag)
      )`);

      // Tabla event_enrollments
      db.run(`CREATE TABLE IF NOT EXISTS event_enrollments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        id_event INTEGER REFERENCES events(id),
        id_user INTEGER REFERENCES users(id),
        registration_date_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        attended BOOLEAN DEFAULT 0,
        rating INTEGER,
        description TEXT,
        UNIQUE (id_event, id_user)
      )`, (err) => {
        if (err) {
          console.error('Error creating tables:', err);
          reject(err);
        } else {
          console.log('Tables created successfully');
          resolve();
        }
      });
    });
  });
};

// Inicializar tablas
createTables().catch(console.error);

module.exports = db;