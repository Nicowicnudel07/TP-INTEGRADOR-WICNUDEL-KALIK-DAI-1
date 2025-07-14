const pool = require('../config/db');

exports.listEvents = async (req, res) => {
  try {
    // Paginación
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Filtros
    const { name, startdate, tag } = req.query;
    let filters = [];
    let values = [];
    let joinTags = false;

    if (name) {
      values.push(`%${name}%`);
      filters.push(`e.name ILIKE $${values.length}`);
    }
    if (startdate) {
      values.push(startdate);
      filters.push(`DATE(e.start_date) = $${values.length}`);
    }
    if (tag) {
      joinTags = true;
      values.push(`%${tag}%`);
      filters.push(`t.name ILIKE $${values.length}`);
    }

    let baseQuery = `SELECT e.*, 
      json_build_object(
        'id', el.id,
        'name', el.name,
        'full_address', el.full_address,
        'latitude', el.latitude,
        'longitude', el.longitude,
        'max_capacity', el.max_capacity,
        'location', json_build_object(
          'id', l.id,
          'name', l.name,
          'latitude', l.latitude,
          'longitude', l.longitude,
          'province', json_build_object(
            'id', p.id,
            'name', p.name,
            'full_name', p.full_name,
            'latitude', p.latitude,
            'longitude', p.longitude,
            'display_order', p.display_order
          )
        )
      ) as event_location,
      json_build_object(
        'id', u.id,
        'username', u.username,
        'first_name', u.first_name,
        'last_name', u.last_name
      ) as creator_user,
      COALESCE(
        (
          SELECT json_agg(json_build_object('id', t2.id, 'name', t2.name))
          FROM event_tags et2
          JOIN tags t2 ON et2.id_tag = t2.id
          WHERE et2.id_event = e.id
        ), '[]'::json
      ) as tags
    FROM events e
    JOIN event_locations el ON e.id_event_location = el.id
    JOIN locations l ON el.id_location = l.id
    JOIN provinces p ON l.id_province = p.id
    JOIN users u ON e.id_creator_user = u.id
    `;
    if (joinTags) {
      baseQuery += 'JOIN event_tags et ON e.id = et.id_event JOIN tags t ON et.id_tag = t.id\n';
    }
    if (filters.length > 0) {
      baseQuery += 'WHERE ' + filters.join(' AND ') + '\n';
    }
    baseQuery += 'ORDER BY e.start_date ASC\n';
    baseQuery += `LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
    values.push(limit, offset);

    const result = await pool.query(baseQuery, values);
    res.json({ collection: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener eventos' });
  }
};

exports.getEventDetail = async (req, res) => {
  try {
    const eventId = req.params.id;
    const query = `
      SELECT e.*, 
        json_build_object(
          'id', el.id,
          'id_location', el.id_location,
          'name', el.name,
          'full_address', el.full_address,
          'max_capacity', el.max_capacity,
          'latitude', el.latitude,
          'longitude', el.longitude,
          'id_creator_user', el.id_creator_user,
          'location', json_build_object(
            'id', l.id,
            'name', l.name,
            'id_province', l.id_province,
            'latitude', l.latitude,
            'longitude', l.longitude,
            'province', json_build_object(
              'id', p.id,
              'name', p.name,
              'full_name', p.full_name,
              'latitude', p.latitude,
              'longitude', p.longitude,
              'display_order', p.display_order
            )
          ),
          'creator_user', json_build_object(
            'id', u2.id,
            'first_name', u2.first_name,
            'last_name', u2.last_name,
            'username', u2.username,
            'password', '******'
          )
        ) as event_location,
        COALESCE(
          (
            SELECT json_agg(json_build_object('id', t2.id, 'name', t2.name))
            FROM event_tags et2
            JOIN tags t2 ON et2.id_tag = t2.id
            WHERE et2.id_event = e.id
          ), '[]'::json
        ) as tags,
        json_build_object(
          'id', u.id,
          'first_name', u.first_name,
          'last_name', u.last_name,
          'username', u.username,
          'password', '******'
        ) as creator_user
      FROM events e
      JOIN event_locations el ON e.id_event_location = el.id
      JOIN locations l ON el.id_location = l.id
      JOIN provinces p ON l.id_province = p.id
      JOIN users u ON e.id_creator_user = u.id
      JOIN users u2 ON el.id_creator_user = u2.id
      WHERE e.id = $1
      LIMIT 1
    `;
    const result = await pool.query(query, [eventId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Evento no encontrado' });
    }
    res.status(200).json(result.rows[0]);
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
      max_assistance,
      tags // array opcional
    } = req.body;

    // Validaciones
    if (!name || name.length < 3 || !description || description.length < 3) {
      return res.status(400).json({ message: 'El name o description están vacíos o tienen menos de tres (3) letras.' });
    }
    if (price < 0 || duration_in_minutes < 0) {
      return res.status(400).json({ message: 'El price o duration_in_minutes son menores que cero.' });
    }
    // Validar max_assistance <= max_capacity de la ubicación
    const locResult = await pool.query('SELECT max_capacity FROM event_locations WHERE id = $1', [id_event_location]);
    if (locResult.rows.length === 0) {
      return res.status(400).json({ message: 'Ubicación de evento inexistente.' });
    }
    const max_capacity = locResult.rows[0].max_capacity;
    if (max_assistance > max_capacity) {
      return res.status(400).json({ message: 'El max_assistance es mayor que el max_capacity del id_event_location.' });
    }

    // Insertar evento
    const insertQuery = `INSERT INTO events
      (name, description, id_event_location, start_date, duration_in_minutes, price, enabled_for_enrollment, max_assistance, id_creator_user)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`;
    const insertValues = [
      name,
      description,
      id_event_location,
      start_date,
      duration_in_minutes,
      price,
      enabled_for_enrollment !== undefined ? enabled_for_enrollment : true,
      max_assistance,
      userId
    ];
    const result = await pool.query(insertQuery, insertValues);
    const eventId = result.rows[0].id;

    // Insertar tags si vienen
    if (tags && Array.isArray(tags) && tags.length > 0) {
      for (const tagId of tags) {
        await pool.query('INSERT INTO event_tags (id_event, id_tag) VALUES ($1, $2) ON CONFLICT DO NOTHING', [eventId, tagId]);
      }
    }

    res.status(201).json({ id: eventId });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: 'Error al crear evento.' });
  }
};

exports.updateEvent = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({ message: 'No autenticado.' });
    }
    const {
      id,
      name,
      description,
      id_event_location,
      start_date,
      duration_in_minutes,
      price,
      enabled_for_enrollment,
      max_assistance,
      tags // array opcional
    } = req.body;

    if (!id) {
      return res.status(400).json({ message: 'Falta el id del evento.' });
    }
    // Validaciones
    if (!name || name.length < 3 || !description || description.length < 3) {
      return res.status(400).json({ message: 'El name o description están vacíos o tienen menos de tres (3) letras.' });
    }
    if (price < 0 || duration_in_minutes < 0) {
      return res.status(400).json({ message: 'El price o duration_in_minutes son menores que cero.' });
    }
    // Validar max_assistance <= max_capacity de la ubicación
    const locResult = await pool.query('SELECT max_capacity FROM event_locations WHERE id = $1', [id_event_location]);
    if (locResult.rows.length === 0) {
      return res.status(400).json({ message: 'Ubicación de evento inexistente.' });
    }
    const max_capacity = locResult.rows[0].max_capacity;
    if (max_assistance > max_capacity) {
      return res.status(400).json({ message: 'El max_assistance es mayor que el max_capacity del id_event_location.' });
    }
    // Verificar que el evento exista y pertenezca al usuario
    const eventResult = await pool.query('SELECT * FROM events WHERE id = $1', [id]);
    if (eventResult.rows.length === 0) {
      return res.status(404).json({ message: 'El id del evento no existe.' });
    }
    if (eventResult.rows[0].id_creator_user !== userId) {
      return res.status(404).json({ message: 'El evento no pertenece al usuario autenticado.' });
    }
    // Actualizar evento
    const updateQuery = `UPDATE events SET
      name = $1,
      description = $2,
      id_event_location = $3,
      start_date = $4,
      duration_in_minutes = $5,
      price = $6,
      enabled_for_enrollment = $7,
      max_assistance = $8
      WHERE id = $9`;
    const updateValues = [
      name,
      description,
      id_event_location,
      start_date,
      duration_in_minutes,
      price,
      enabled_for_enrollment !== undefined ? enabled_for_enrollment : true,
      max_assistance,
      id
    ];
    await pool.query(updateQuery, updateValues);
    // Actualizar tags si vienen
    if (tags && Array.isArray(tags)) {
      await pool.query('DELETE FROM event_tags WHERE id_event = $1', [id]);
      for (const tagId of tags) {
        await pool.query('INSERT INTO event_tags (id_event, id_tag) VALUES ($1, $2) ON CONFLICT DO NOTHING', [id, tagId]);
      }
    }
    res.status(200).json({ message: 'Evento actualizado correctamente.' });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: 'Error al actualizar evento.' });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({ message: 'No autenticado.' });
    }
    const eventId = req.params.id;
    // Verificar que el evento exista y pertenezca al usuario
    const eventResult = await pool.query('SELECT * FROM events WHERE id = $1', [eventId]);
    if (eventResult.rows.length === 0) {
      return res.status(404).json({ message: 'El id del evento no existe.' });
    }
    if (eventResult.rows[0].id_creator_user !== userId) {
      return res.status(404).json({ message: 'El evento no pertenece al usuario autenticado.' });
    }
    // Verificar que no haya inscriptos
    const enrollResult = await pool.query('SELECT COUNT(*) FROM event_enrollments WHERE id_event = $1', [eventId]);
    if (parseInt(enrollResult.rows[0].count) > 0) {
      return res.status(400).json({ message: 'Existe al menos un usuario registrado al evento.' });
    }
    // Eliminar tags relacionados
    await pool.query('DELETE FROM event_tags WHERE id_event = $1', [eventId]);
    // Eliminar evento
    await pool.query('DELETE FROM events WHERE id = $1', [eventId]);
    res.status(200).json({ message: 'Evento eliminado correctamente.' });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: 'Error al eliminar evento.' });
  }
};

exports.enrollEvent = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({ message: 'No autenticado.' });
    }
    const eventId = req.params.id;
    // Verificar existencia del evento
    const eventResult = await pool.query('SELECT * FROM events WHERE id = $1', [eventId]);
    if (eventResult.rows.length === 0) {
      return res.status(404).json({ message: 'Evento inexistente.' });
    }
    const event = eventResult.rows[0];
    // Validaciones de capacidad
    const enrollCount = await pool.query('SELECT COUNT(*) FROM event_enrollments WHERE id_event = $1', [eventId]);
    if (parseInt(enrollCount.rows[0].count) >= event.max_assistance) {
      return res.status(400).json({ message: 'Exceda la capacidad máxima de registrados (max_assistance) al evento.' });
    }
    // Validar fecha
    const now = new Date();
    const eventDate = new Date(event.start_date);
    if (eventDate <= now) {
      return res.status(400).json({ message: 'Intenta registrarse a un evento que ya sucedió (start_date), o la fecha del evento es hoy.' });
    }
    // Validar habilitación
    if (!event.enabled_for_enrollment) {
      return res.status(400).json({ message: 'Intenta registrarse a un evento que no está habilitado para la inscripción (enabled_for_enrollment).' });
    }
    // Validar ya inscripto
    const alreadyEnrolled = await pool.query('SELECT * FROM event_enrollments WHERE id_event = $1 AND id_user = $2', [eventId, userId]);
    if (alreadyEnrolled.rows.length > 0) {
      return res.status(400).json({ message: 'El usuario ya se encuentra registrado en el evento.' });
    }
    // Registrar inscripción
    await pool.query('INSERT INTO event_enrollments (id_event, id_user) VALUES ($1, $2)', [eventId, userId]);
    res.status(201).json({ message: 'Inscripción exitosa.' });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: 'Error al inscribirse al evento.' });
  }
};

exports.unenrollEvent = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({ message: 'No autenticado.' });
    }
    const eventId = req.params.id;
    // Verificar existencia del evento
    const eventResult = await pool.query('SELECT * FROM events WHERE id = $1', [eventId]);
    if (eventResult.rows.length === 0) {
      return res.status(404).json({ message: 'Evento inexistente.' });
    }
    const event = eventResult.rows[0];
    // Validar fecha
    const now = new Date();
    const eventDate = new Date(event.start_date);
    if (eventDate <= now) {
      return res.status(400).json({ message: 'Intenta removerse de un evento que ya sucedió (start_date), o la fecha del evento es hoy.' });
    }
    // Validar inscripción previa
    const enrolled = await pool.query('SELECT * FROM event_enrollments WHERE id_event = $1 AND id_user = $2', [eventId, userId]);
    if (enrolled.rows.length === 0) {
      return res.status(400).json({ message: 'El usuario no se encuentra registrado al evento.' });
    }
    // Eliminar inscripción
    await pool.query('DELETE FROM event_enrollments WHERE id_event = $1 AND id_user = $2', [eventId, userId]);
    res.status(200).json({ message: 'Desinscripción exitosa.' });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: 'Error al desinscribirse del evento.' });
  }
};

exports.listParticipants = async (req, res) => {
  try {
    const eventId = req.params.id;
    // Verificar existencia del evento
    const eventResult = await pool.query('SELECT * FROM events WHERE id = $1', [eventId]);
    if (eventResult.rows.length === 0) {
      return res.status(404).json({ message: 'Evento inexistente.' });
    }
    // Listar participantes
    const query = `
      SELECT 
        json_build_object(
          'id', u.id,
          'username', u.username,
          'first_name', u.first_name,
          'last_name', u.last_name
        ) as user,
        ee.attended,
        ee.rating,
        ee.description
      FROM event_enrollments ee
      JOIN users u ON ee.id_user = u.id
      WHERE ee.id_event = $1
    `;
    const result = await pool.query(query, [eventId]);
    res.json({ collection: result.rows });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: 'Error al listar participantes.' });
  }
}; 