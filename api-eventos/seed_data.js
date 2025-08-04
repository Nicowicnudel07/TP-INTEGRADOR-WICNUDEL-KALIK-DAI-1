const { dbOperations } = require('./config/db');
const bcrypt = require('bcryptjs');

const insertSeedData = async () => {
  try {
    // Insertar usuarios
    const hashedPassword = await bcrypt.hash('123456', 10);
    
    // Crear usuarios si no existen
    if (dbOperations.findUserByUsername('pablo.ulman@ort.edu.ar')) {
      console.log('Usuarios ya existen');
      return;
    }
    
    dbOperations.createUser({
      first_name: 'Pablo',
      last_name: 'Ulman',
      username: 'pablo.ulman@ort.edu.ar',
      password: hashedPassword
    });
    
    dbOperations.createUser({
      first_name: 'Julian',
      last_name: 'Schiffer',
      username: 'jschiffer@email.com',
      password: hashedPassword
    });

    // Insertar ubicaciones de eventos
    dbOperations.createEventLocation({
      id_location: 3391,
      name: 'Club Atlético River Plate',
      full_address: 'Av. Pres. Figueroa Alcorta 7597',
      max_capacity: 84567,
      latitude: '-34.54454505693356',
      longitude: '-58.4494761175694',
      id_creator_user: 1
    });

    dbOperations.createEventLocation({
      id_location: 3397,
      name: 'Movistar Arena',
      full_address: 'Humboldt 450, C1414 Cdad. Autónoma de Buenos Aires',
      max_capacity: 15000,
      latitude: '-34.593488697344405',
      longitude: '-58.44735886932156',
      id_creator_user: 1
    });

    // Insertar eventos
    dbOperations.createEvent({
      name: 'Taylor Swift',
      description: 'Un alto show',
      id_event_location: 1,
      start_date: '2024-03-21 03:00:00',
      duration_in_minutes: 210,
      price: 15500,
      enabled_for_enrollment: true,
      max_assistance: 120000,
      id_creator_user: 2
    });

    dbOperations.createEvent({
      name: 'Toto',
      description: 'La legendaria banda estadounidense se presentará en Buenos Aires.',
      id_event_location: 2,
      start_date: '2024-11-22 03:00:00',
      duration_in_minutes: 120,
      price: 150000,
      enabled_for_enrollment: true,
      max_assistance: 12000,
      id_creator_user: 1
    });

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