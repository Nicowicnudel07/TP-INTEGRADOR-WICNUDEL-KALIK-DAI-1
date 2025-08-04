const db = require('./config/db');
const bcrypt = require('bcryptjs');

const insertSeedData = async () => {
  try {
    // Insertar provincias
    db.run(`INSERT OR IGNORE INTO provinces (id, name, full_name, latitude, longitude, display_order) VALUES
      (1, 'Buenos Aires', 'Provincia de Buenos Aires', '-34.61444091796875', '-58.445877075195312', 1),
      (2, 'CABA', 'Ciudad Autónoma de Buenos Aires', '-34.61444091796875', '-58.445877075195312', 2)`);

    // Insertar localidades
    db.run(`INSERT OR IGNORE INTO locations (id, name, id_province, latitude, longitude) VALUES
      (3391, 'Nuñez', 2, '-34.548805236816406', '-58.463230133056641'),
      (3397, 'Villa Crespo', 2, '-34.599876403808594', '-58.438816070556641')`);

    // Insertar usuarios
    const hashedPassword = await bcrypt.hash('123456', 10);
    db.run(`INSERT OR IGNORE INTO users (id, first_name, last_name, username, password) VALUES
      (1, 'Pablo', 'Ulman', 'pablo.ulman@ort.edu.ar', ?),
      (2, 'Julian', 'Schiffer', 'jschiffer@email.com', ?)`, [hashedPassword, hashedPassword]);

    // Insertar tags
    db.run(`INSERT OR IGNORE INTO tags (id, name) VALUES
      (1, 'Rock'),
      (2, 'Pop'),
      (3, 'Jazz'),
      (4, 'Electrónica')`);

    // Insertar ubicaciones de eventos
    db.run(`INSERT OR IGNORE INTO event_locations (id, id_location, name, full_address, max_capacity, latitude, longitude, id_creator_user) VALUES
      (1, 3391, 'Club Atlético River Plate', 'Av. Pres. Figueroa Alcorta 7597', 84567, '-34.54454505693356', '-58.4494761175694', 1),
      (2, 3397, 'Movistar Arena', 'Humboldt 450, C1414 Cdad. Autónoma de Buenos Aires', 15000, '-34.593488697344405', '-58.44735886932156', 1)`);

    // Insertar eventos
    db.run(`INSERT OR IGNORE INTO events (id, name, description, id_event_location, start_date, duration_in_minutes, price, enabled_for_enrollment, max_assistance, id_creator_user) VALUES
      (1, 'Taylor Swift', 'Un alto show', 1, '2024-03-21 03:00:00', 210, 15500, 1, 120000, 2),
      (2, 'Toto', 'La legendaria banda estadounidense se presentará en Buenos Aires.', 2, '2024-11-22 03:00:00', 120, 150000, 1, 12000, 1)`);

    // Insertar relación evento-tags
    db.run(`INSERT OR IGNORE INTO event_tags (id_event, id_tag) VALUES
      (1, 1), (1, 2),
      (2, 1)`);

    console.log('Datos de prueba insertados correctamente');
  } catch (error) {
    console.error('Error insertando datos de prueba:', error);
  }
};

// Ejecutar si se llama directamente
if (require.main === module) {
  insertSeedData();
}

module.exports = insertSeedData; 