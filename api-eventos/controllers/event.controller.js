const { dbOperations } = require('../config/db');

exports.listEvents = async (req, res) => {
  try {
    console.log('Listando eventos...');
    
    // Paginación
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Filtros
    const { name, startdate, tag } = req.query;
    
    let events = dbOperations.getAllEvents();
    console.log('Eventos encontrados:', events.length);
    
    // Aplicar filtros
    if (name) {
      events = events.filter(event => 
        event.name.toLowerCase().includes(name.toLowerCase())
      );
    }
    
    if (startdate) {
      events = events.filter(event => 
        event.start_date.startsWith(startdate)
      );
    }
    
    // Aplicar paginación
    const paginatedEvents = events.slice(offset, offset + limit);
    console.log('Eventos paginados:', paginatedEvents.length);
    
    // Procesar eventos para incluir información completa
    const processedEvents = paginatedEvents.map(event => {
      const eventLocation = dbOperations.findEventLocationById(event.id_event_location);
      const creatorUser = dbOperations.findUserById(event.id_creator_user);
      
      return {
        id: event.id,
        name: event.name,
        description: event.description,
        start_date: event.start_date,
        duration_in_minutes: event.duration_in_minutes,
        price: event.price,
        enabled_for_enrollment: event.enabled_for_enrollment,
        max_assistance: event.max_assistance,
        event_location: eventLocation,
        creator_user: creatorUser,
        tags: [] // Por ahora sin tags
      };
    });
    
    console.log('Eventos procesados:', processedEvents.length);
    res.json({ collection: processedEvents });
  } catch (err) {
    console.error('Error en listEvents:', err);
    res.status(500).json({ message: 'Error al obtener eventos' });
  }
};

exports.getEventDetail = async (req, res) => {
  try {
    const eventId = req.params.id;
    const event = dbOperations.findEventById(eventId);
    
    if (!event) {
      return res.status(404).json({ message: 'Evento no encontrado' });
    }
    
    const eventLocation = dbOperations.findEventLocationById(event.id_event_location);
    const creatorUser = dbOperations.findUserById(event.id_creator_user);
    
    const result = {
      ...event,
      event_location: eventLocation,
      creator_user: creatorUser,
      tags: [] // Por ahora sin tags
    };
    
    res.status(200).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener el detalle del evento' });
  }
};

exports.createEvent = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({ message: 'No autenticado.' });
    }
    
    const {
      name,
      description,
      id_event_location,
      start_date,
      duration_in_minutes,
      price,
      enabled_for_enrollment,
      max_assistance
    } = req.body;

    // Validaciones
    if (!name || name.length < 3 || !description || description.length < 3) {
      return res.status(400).json({ message: 'El name o description están vacíos o tienen menos de tres (3) letras.' });
    }

    if (price < 0 || duration_in_minutes < 0) {
      return res.status(400).json({ message: 'El price o duration_in_minutes son menores que cero.' });
    }

    const event = dbOperations.createEvent({
      name,
      description,
      id_event_location,
      start_date,
      duration_in_minutes,
      price,
      enabled_for_enrollment,
      max_assistance,
      id_creator_user: userId
    });

    res.status(201).json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al crear evento' });
  }
};

exports.updateEvent = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({ message: 'No autenticado.' });
    }
    
    const eventId = req.body.id;
    const event = dbOperations.findEventById(eventId);
    
    if (!event) {
      return res.status(404).json({ message: 'Evento no encontrado' });
    }
    
    if (event.id_creator_user != userId) {
      return res.status(404).json({ message: 'Evento no pertenece al usuario autenticado' });
    }
    
    const updatedEvent = dbOperations.updateEvent(eventId, req.body);
    
    if (updatedEvent) {
      res.status(200).json(updatedEvent);
    } else {
      res.status(400).json({ message: 'Error al actualizar evento' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al actualizar evento' });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({ message: 'No autenticado.' });
    }
    
    const eventId = req.params.id;
    const event = dbOperations.findEventById(eventId);
    
    if (!event) {
      return res.status(404).json({ message: 'Evento no encontrado' });
    }
    
    if (event.id_creator_user != userId) {
      return res.status(404).json({ message: 'Evento no pertenece al usuario autenticado' });
    }
    
    // Verificar si hay inscripciones
    const enrollments = dbOperations.getEventEnrollments(eventId);
    if (enrollments.length > 0) {
      return res.status(400).json({ message: 'Existe al menos un usuario registrado al evento.' });
    }
    
    const success = dbOperations.deleteEvent(eventId);
    
    if (success) {
      res.status(200).json({ message: 'Evento eliminado correctamente' });
    } else {
      res.status(400).json({ message: 'Error al eliminar evento' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al eliminar evento' });
  }
};

exports.enrollEvent = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({ message: 'No autenticado.' });
    }
    
    const eventId = req.params.id;
    const event = dbOperations.findEventById(eventId);
    
    if (!event) {
      return res.status(404).json({ message: 'Evento no encontrado' });
    }
    
    // Verificar si ya está inscrito
    const existingEnrollment = dbOperations.findEnrollment(eventId, userId);
    if (existingEnrollment) {
      return res.status(400).json({ message: 'El usuario ya se encuentra registrado en el evento.' });
    }
    
    // Verificar capacidad
    const enrollments = dbOperations.getEventEnrollments(eventId);
    if (enrollments.length >= event.max_assistance) {
      return res.status(400).json({ message: 'Exceda la capacidad máxima de registrados al evento.' });
    }
    
    // Verificar fecha del evento
    const eventDate = new Date(event.start_date);
    const today = new Date();
    if (eventDate <= today) {
      return res.status(400).json({ message: 'Intenta registrarse a un evento que ya sucedió o la fecha del evento es hoy.' });
    }
    
    // Verificar si está habilitado para inscripción
    if (!event.enabled_for_enrollment) {
      return res.status(400).json({ message: 'Intenta registrarse a un evento que no está habilitado para la inscripción.' });
    }
    
    const enrollment = dbOperations.createEnrollment({
      id_event: eventId,
      id_user: userId
    });
    
    res.status(201).json(enrollment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al inscribirse al evento' });
  }
};

exports.unenrollEvent = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({ message: 'No autenticado.' });
    }
    
    const eventId = req.params.id;
    const event = dbOperations.findEventById(eventId);
    
    if (!event) {
      return res.status(404).json({ message: 'Evento no encontrado' });
    }
    
    // Verificar si está inscrito
    const enrollment = dbOperations.findEnrollment(eventId, userId);
    if (!enrollment) {
      return res.status(400).json({ message: 'El usuario no se encuentra registrado al evento.' });
    }
    
    // Verificar fecha del evento
    const eventDate = new Date(event.start_date);
    const today = new Date();
    if (eventDate <= today) {
      return res.status(400).json({ message: 'Intenta removerse de un evento que ya sucedió o la fecha del evento es hoy.' });
    }
    
    const success = dbOperations.deleteEnrollment(eventId, userId);
    
    if (success) {
      res.status(200).json({ message: 'Desinscripción exitosa' });
    } else {
      res.status(400).json({ message: 'Error al desinscribirse' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al desinscribirse del evento' });
  }
};

exports.listParticipants = async (req, res) => {
  try {
    const eventId = req.params.id;
    const event = dbOperations.findEventById(eventId);
    
    if (!event) {
      return res.status(404).json({ message: 'Evento no encontrado' });
    }
    
    const enrollments = dbOperations.getEventEnrollments(eventId);
    const participants = enrollments.map(enrollment => {
      const user = dbOperations.findUserById(enrollment.id_user);
      return {
        user: {
          id: user.id,
          username: user.username,
          first_name: user.first_name,
          last_name: user.last_name
        },
        attended: enrollment.attended || false,
        rating: enrollment.rating || null,
        description: enrollment.description || null
      };
    });
    
    res.json({ collection: participants });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener participantes' });
  }
}; 