const db = require('../config/db');

exports.listEvents = async (req, res) => {
  try {
    // Paginación
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Filtros
    const { name, startdate, tag } = req.query;
    let whereClause = '';
    let params = [];

    if (name) {
      whereClause += ' WHERE e.name LIKE ?';
      params.push(`%${name}%`);
    }
    if (startdate) {
      whereClause += whereClause ? ' AND' : ' WHERE';
      whereClause += ' DATE(e.start_date) = ?';
      params.push(startdate);
    }

    let query = `
      SELECT e.*, 
        json_object(
          'id', el.id,
          'name', el.name,
          'full_address', el.full_address,
          'latitude', el.latitude,
          'longitude', el.longitude,
          'max_capacity', el.max_capacity,
          'location', json_object(
            'id', l.id,
            'name', l.name,
            'latitude', l.latitude,
            'longitude', l.longitude,
            'province', json_object(
              'id', p.id,
              'name', p.name,
              'full_name', p.full_name,
              'latitude', p.latitude,
              'longitude', p.longitude,
              'display_order', p.display_order
            )
          )
        ) as event_location,
        json_object(
          'id', u.id,
          'username', u.username,
          'first_name', u.first_name,
          'last_name', u.last_name
        ) as creator_user
      FROM events e
      JOIN event_locations el ON e.id_event_location = el.id
      JOIN locations l ON el.id_location = l.id
      JOIN provinces p ON l.id_province = p.id
      JOIN users u ON e.id_creator_user = u.id
      ${whereClause}
      ORDER BY e.start_date ASC
      LIMIT ? OFFSET ?
    `;
    params.push(limit, offset);

    db.all(query, params, (err, rows) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Error al obtener eventos' });
      }

      // Procesar tags para cada evento
      const processTags = (eventId) => {
        return new Promise((resolve) => {
          db.all('SELECT t.id, t.name FROM tags t JOIN event_tags et ON t.id = et.id_tag WHERE et.id_event = ?', [eventId], (err, tags) => {
            resolve(tags || []);
          });
        });
      };

      Promise.all(rows.map(async (row) => {
        const tags = await processTags(row.id);
        return {
          ...row,
          event_location: JSON.parse(row.event_location),
          creator_user: JSON.parse(row.creator_user),
          tags: tags
        };
      })).then(processedRows => {
        res.json({ collection: processedRows });
      });
    });
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
        json_object(
          'id', el.id,
          'id_location', el.id_location,
          'name', el.name,
          'full_address', el.full_address,
          'max_capacity', el.max_capacity,
          'latitude', el.latitude,
          'longitude', el.longitude,
          'id_creator_user', el.id_creator_user,
          'location', json_object(
            'id', l.id,
            'name', l.name,
            'id_province', l.id_province,
            'latitude', l.latitude,
            'longitude', l.longitude,
            'province', json_object(
              'id', p.id,
              'name', p.name,
              'full_name', p.full_name,
              'latitude', p.latitude,
              'longitude', p.longitude,
              'display_order', p.display_order
            )
          ),
          'creator_user', json_object(
            'id', u2.id,
            'first_name', u2.first_name,
            'last_name', u2.last_name,
            'username', u2.username,
            'password', '******'
          )
        ) as event_location,
        json_object(
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
      WHERE e.id = ?
      LIMIT 1
    `;

    db.get(query, [eventId], (err, row) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Error al obtener el detalle del evento' });
      }
      if (!row) {
        return res.status(404).json({ message: 'Evento no encontrado' });
      }

      // Obtener tags
      db.all('SELECT t.id, t.name FROM tags t JOIN event_tags et ON t.id = et.id_tag WHERE et.id_event = ?', [eventId], (err, tags) => {
        const result = {
          ...row,
          event_location: JSON.parse(row.event_location),
          creator_user: JSON.parse(row.creator_user),
          tags: tags || []
        };
        res.status(200).json(result);
      });
    });
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
      tags
    } = req.body;

    // Validaciones
    if (!name || name.length < 3 || !description || description.length < 3) {
      return res.status(400).json({ message: 'El name o description están vacíos o tienen menos de tres (3) letras.' });
    }
    if (price < 0 || duration_in_minutes < 0) {
      return res.status(400).json({ message: 'El price o duration_in_minutes son menores que cero.' });
    }

    // Validar max_assistance <= max_capacity de la ubicación
    db.get('SELECT max_capacity FROM event_locations WHERE id = ?', [id_event_location], (err, row) => {
      if (err || !row) {
        return res.status(400).json({ message: 'Ubicación de evento inexistente.' });
      }
      if (max_assistance > row.max_capacity) {
        return res.status(400).json({ message: 'El max_assistance es mayor que el max_capacity del id_event_location.' });
      }

      // Insertar evento
      const insertQuery = `INSERT INTO events
        (name, description, id_event_location, start_date, duration_in_minutes, price, enabled_for_enrollment, max_assistance, id_creator_user)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
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

      db.run(insertQuery, insertValues, function(err) {
        if (err) {
          console.error(err);
          return res.status(400).json({ message: 'Error al crear evento.' });
        }

        const eventId = this.lastID;

        // Insertar tags si vienen
        if (tags && Array.isArray(tags) && tags.length > 0) {
          const insertTag = (tagId) => {
            return new Promise((resolve) => {
              db.run('INSERT OR IGNORE INTO event_tags (id_event, id_tag) VALUES (?, ?)', [eventId, tagId], resolve);
            });
          };
          Promise.all(tags.map(insertTag)).then(() => {
            res.status(201).json({ id: eventId });
          });
        } else {
          res.status(201).json({ id: eventId });
        }
      });
    });
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
      tags
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

    // Verificar que el evento exista y pertenezca al usuario
    db.get('SELECT * FROM events WHERE id = ?', [id], (err, event) => {
      if (err || !event) {
        return res.status(404).json({ message: 'El id del evento no existe.' });
      }
      if (event.id_creator_user !== userId) {
        return res.status(404).json({ message: 'El evento no pertenece al usuario autenticado.' });
      }

      // Validar max_assistance <= max_capacity de la ubicación
      db.get('SELECT max_capacity FROM event_locations WHERE id = ?', [id_event_location], (err, location) => {
        if (err || !location) {
          return res.status(400).json({ message: 'Ubicación de evento inexistente.' });
        }
        if (max_assistance > location.max_capacity) {
          return res.status(400).json({ message: 'El max_assistance es mayor que el max_capacity del id_event_location.' });
        }

        // Actualizar evento
        const updateQuery = `UPDATE events SET
          name = ?, description = ?, id_event_location = ?, start_date = ?,
          duration_in_minutes = ?, price = ?, enabled_for_enrollment = ?, max_assistance = ?
          WHERE id = ?`;
        const updateValues = [
          name, description, id_event_location, start_date,
          duration_in_minutes, price, enabled_for_enrollment !== undefined ? enabled_for_enrollment : true,
          max_assistance, id
        ];

        db.run(updateQuery, updateValues, function(err) {
          if (err) {
            console.error(err);
            return res.status(400).json({ message: 'Error al actualizar evento.' });
          }

          // Actualizar tags si vienen
          if (tags && Array.isArray(tags)) {
            db.run('DELETE FROM event_tags WHERE id_event = ?', [id], () => {
              const insertTag = (tagId) => {
                return new Promise((resolve) => {
                  db.run('INSERT OR IGNORE INTO event_tags (id_event, id_tag) VALUES (?, ?)', [id, tagId], resolve);
                });
              };
              Promise.all(tags.map(insertTag)).then(() => {
                res.status(200).json({ message: 'Evento actualizado correctamente.' });
              });
            });
          } else {
            res.status(200).json({ message: 'Evento actualizado correctamente.' });
          }
        });
      });
    });
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
    db.get('SELECT * FROM events WHERE id = ?', [eventId], (err, event) => {
      if (err || !event) {
        return res.status(404).json({ message: 'El id del evento no existe.' });
      }
      if (event.id_creator_user !== userId) {
        return res.status(404).json({ message: 'El evento no pertenece al usuario autenticado.' });
      }

      // Verificar que no haya inscriptos
      db.get('SELECT COUNT(*) as count FROM event_enrollments WHERE id_event = ?', [eventId], (err, result) => {
        if (err) {
          console.error(err);
          return res.status(400).json({ message: 'Error al verificar inscriptos.' });
        }
        if (result.count > 0) {
          return res.status(400).json({ message: 'Existe al menos un usuario registrado al evento.' });
        }

        // Eliminar tags relacionados
        db.run('DELETE FROM event_tags WHERE id_event = ?', [eventId], () => {
          // Eliminar evento
          db.run('DELETE FROM events WHERE id = ?', [eventId], function(err) {
            if (err) {
              console.error(err);
              return res.status(400).json({ message: 'Error al eliminar evento.' });
            }
            res.status(200).json({ message: 'Evento eliminado correctamente.' });
          });
        });
      });
    });
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
    db.get('SELECT * FROM events WHERE id = ?', [eventId], (err, event) => {
      if (err || !event) {
        return res.status(404).json({ message: 'Evento inexistente.' });
      }

      // Validaciones de capacidad
      db.get('SELECT COUNT(*) as count FROM event_enrollments WHERE id_event = ?', [eventId], (err, enrollCount) => {
        if (err) {
          console.error(err);
          return res.status(400).json({ message: 'Error al verificar capacidad.' });
        }
        if (enrollCount.count >= event.max_assistance) {
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
        db.get('SELECT * FROM event_enrollments WHERE id_event = ? AND id_user = ?', [eventId, userId], (err, alreadyEnrolled) => {
          if (err) {
            console.error(err);
            return res.status(400).json({ message: 'Error al verificar inscripción.' });
          }
          if (alreadyEnrolled) {
            return res.status(400).json({ message: 'El usuario ya se encuentra registrado en el evento.' });
          }

          // Registrar inscripción
          db.run('INSERT INTO event_enrollments (id_event, id_user) VALUES (?, ?)', [eventId, userId], function(err) {
            if (err) {
              console.error(err);
              return res.status(400).json({ message: 'Error al inscribirse al evento.' });
            }
            res.status(201).json({ message: 'Inscripción exitosa.' });
          });
        });
      });
    });
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
    db.get('SELECT * FROM events WHERE id = ?', [eventId], (err, event) => {
      if (err || !event) {
        return res.status(404).json({ message: 'Evento inexistente.' });
      }

      // Validar fecha
      const now = new Date();
      const eventDate = new Date(event.start_date);
      if (eventDate <= now) {
        return res.status(400).json({ message: 'Intenta removerse de un evento que ya sucedió (start_date), o la fecha del evento es hoy.' });
      }

      // Validar inscripción previa
      db.get('SELECT * FROM event_enrollments WHERE id_event = ? AND id_user = ?', [eventId, userId], (err, enrolled) => {
        if (err) {
          console.error(err);
          return res.status(400).json({ message: 'Error al verificar inscripción.' });
        }
        if (!enrolled) {
          return res.status(400).json({ message: 'El usuario no se encuentra registrado al evento.' });
        }

        // Eliminar inscripción
        db.run('DELETE FROM event_enrollments WHERE id_event = ? AND id_user = ?', [eventId, userId], function(err) {
          if (err) {
            console.error(err);
            return res.status(400).json({ message: 'Error al desinscribirse del evento.' });
          }
          res.status(200).json({ message: 'Desinscripción exitosa.' });
        });
      });
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: 'Error al desinscribirse del evento.' });
  }
};

exports.listParticipants = async (req, res) => {
  try {
    const eventId = req.params.id;

    // Verificar existencia del evento
    db.get('SELECT * FROM events WHERE id = ?', [eventId], (err, event) => {
      if (err || !event) {
        return res.status(404).json({ message: 'Evento inexistente.' });
      }

      // Listar participantes
      const query = `
        SELECT 
          json_object(
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
        WHERE ee.id_event = ?
      `;

      db.all(query, [eventId], (err, rows) => {
        if (err) {
          console.error(err);
          return res.status(400).json({ message: 'Error al listar participantes.' });
        }

        const processedRows = rows.map(row => ({
          user: JSON.parse(row.user),
          attended: row.attended,
          rating: row.rating,
          description: row.description
        }));

        res.json({ collection: processedRows });
      });
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: 'Error al listar participantes.' });
  }
}; 