const { dbOperations } = require('../config/db');

exports.listEventLocations = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) throw { status: 401, message: 'No autenticado.' };
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const { locations, total } = await dbOperations.getEventLocationsByUser(userId, page, limit);
    res.json({ page, total, collection: locations });
  } catch (err) {
    console.error('Error en listEventLocations:', err);
    res.status(err.status || 400).json({ message: err.message || 'Error al listar event-locations.' });
  }
};

exports.getEventLocationDetail = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) throw { status: 401, message: 'No autenticado.' };
    const id = req.params.id;

    const location = await dbOperations.findEventLocationById(id);
    if (!location || location.id_creator_user !== userId)
      throw { status: 404, message: 'Event-location no encontrada o no pertenece al usuario.' };

    res.status(200).json(location);
  } catch (err) {
    console.error('Error en getEventLocationDetail:', err);
    res.status(err.status || 400).json({ message: err.message || 'Error al obtener event-location.' });
  }
};

exports.createEventLocation = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) throw { status: 401, message: 'No autenticado.' };

    const { id_location, name, full_address, max_capacity, latitude, longitude } = req.body;
    if (!id_location || !name || !full_address || !max_capacity)
      throw { status: 400, message: 'Faltan campos obligatorios.' };
    if (max_capacity < 1) throw { status: 400, message: 'La capacidad máxima debe ser mayor a cero.' };

    const newLocation = {
      id_location,
      name,
      full_address,
      max_capacity,
      latitude,
      longitude,
      id_creator_user: userId
    };
    const created = await dbOperations.createEventLocation(newLocation);
    res.status(201).json({ id: created.id });
  } catch (err) {
    console.error('Error en createEventLocation:', err);
    res.status(err.status || 400).json({ message: err.message || 'Error al crear event-location.' });
  }
};

exports.updateEventLocation = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) throw { status: 401, message: 'No autenticado.' };

    const id = req.params.id;
    const { id_location, name, full_address, max_capacity, latitude, longitude } = req.body;
    const existing = await dbOperations.findEventLocationById(id);
    if (!existing || existing.id_creator_user !== userId)
      throw { status: 404, message: 'Event-location no encontrada o no pertenece al usuario.' };
    if (!id_location || !name || !full_address || !max_capacity)
      throw { status: 400, message: 'Faltan campos obligatorios.' };
    if (max_capacity < 1) throw { status: 400, message: 'La capacidad máxima debe ser mayor a cero.' };

    const updates = { id_location, name, full_address, max_capacity, latitude, longitude };
    await dbOperations.updateEventLocation(id, updates);
    res.status(200).json({ message: 'Event-location actualizada correctamente.' });
  } catch (err) {
    console.error('Error en updateEventLocation:', err);
    res.status(err.status || 400).json({ message: err.message || 'Error al actualizar event-location.' });
  }
};

exports.deleteEventLocation = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) throw { status: 401, message: 'No autenticado.' };

    const id = req.params.id;
    const existing = await dbOperations.findEventLocationById(id);
    if (!existing || existing.id_creator_user !== userId)
      throw { status: 404, message: 'Event-location no encontrada o no pertenece al usuario.' };

    const deleted = await dbOperations.deleteEventLocation(id);
    if (!deleted)
      throw { status: 400, message: 'No se puede eliminar: existen eventos asociados a esta ubicación.' };

    res.status(200).json({ message: 'Event-location eliminada correctamente.' });
  } catch (err) {
    console.error('Error en deleteEventLocation:', err);
    res.status(err.status || 400).json({ message: err.message || 'Error al eliminar event-location.' });
  }
};