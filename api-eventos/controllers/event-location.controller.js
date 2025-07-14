const pool = require('../config/db');

exports.listEventLocations = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({ message: 'No autenticado.' });
    }
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const query = `
      SELECT el.*, 
        json_build_object(
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
        ) as location
      FROM event_locations el
      JOIN locations l ON el.id_location = l.id
      JOIN provinces p ON l.id_province = p.id
      WHERE el.id_creator_user = $1
      ORDER BY el.id
      LIMIT $2 OFFSET $3
    `;
    const result = await pool.query(query, [userId, limit, offset]);
    res.json({ collection: result.rows });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: 'Error al listar event-locations.' });
  }
};

exports.getEventLocationDetail = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({ message: 'No autenticado.' });
    }
    const id = req.params.id;
    const query = `
      SELECT el.*, 
        json_build_object(
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
        ) as location
      FROM event_locations el
      JOIN locations l ON el.id_location = l.id
      JOIN provinces p ON l.id_province = p.id
      WHERE el.id = $1 AND el.id_creator_user = $2
      LIMIT 1
    `;
    const result = await pool.query(query, [id, userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Event-location no encontrada o no pertenece al usuario.' });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: 'Error al obtener event-location.' });
  }
};

exports.createEventLocation = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({ message: 'No autenticado.' });
    }
    const { id_location, name, full_address, max_capacity, latitude, longitude } = req.body;
    if (!id_location || !name || !full_address || !max_capacity) {
      return res.status(400).json({ message: 'Faltan campos obligatorios.' });
    }
    if (max_capacity < 1) {
      return res.status(400).json({ message: 'La capacidad máxima debe ser mayor a cero.' });
    }
    const insertQuery = `INSERT INTO event_locations (id_location, name, full_address, max_capacity, latitude, longitude, id_creator_user)
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`;
    const result = await pool.query(insertQuery, [id_location, name, full_address, max_capacity, latitude, longitude, userId]);
    res.status(201).json({ id: result.rows[0].id });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: 'Error al crear event-location.' });
  }
};

exports.updateEventLocation = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({ message: 'No autenticado.' });
    }
    const id = req.params.id;
    const { id_location, name, full_address, max_capacity, latitude, longitude } = req.body;
    // Verificar que la event-location exista y sea del usuario
    const result = await pool.query('SELECT * FROM event_locations WHERE id = $1 AND id_creator_user = $2', [id, userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Event-location no encontrada o no pertenece al usuario.' });
    }
    if (!id_location || !name || !full_address || !max_capacity) {
      return res.status(400).json({ message: 'Faltan campos obligatorios.' });
    }
    if (max_capacity < 1) {
      return res.status(400).json({ message: 'La capacidad máxima debe ser mayor a cero.' });
    }
    const updateQuery = `UPDATE event_locations SET id_location = $1, name = $2, full_address = $3, max_capacity = $4, latitude = $5, longitude = $6 WHERE id = $7`;
    await pool.query(updateQuery, [id_location, name, full_address, max_capacity, latitude, longitude, id]);
    res.status(200).json({ message: 'Event-location actualizada correctamente.' });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: 'Error al actualizar event-location.' });
  }
};

exports.deleteEventLocation = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({ message: 'No autenticado.' });
    }
    const id = req.params.id;
    // Verificar que la event-location exista y sea del usuario
    const result = await pool.query('SELECT * FROM event_locations WHERE id = $1 AND id_creator_user = $2', [id, userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Event-location no encontrada o no pertenece al usuario.' });
    }
    // Verificar que no tenga eventos asociados
    const events = await pool.query('SELECT * FROM events WHERE id_event_location = $1', [id]);
    if (events.rows.length > 0) {
      return res.status(400).json({ message: 'No se puede eliminar: existen eventos asociados a esta ubicación.' });
    }
    await pool.query('DELETE FROM event_locations WHERE id = $1', [id]);
    res.status(200).json({ message: 'Event-location eliminada correctamente.' });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: 'Error al eliminar event-location.' });
  }
}; 