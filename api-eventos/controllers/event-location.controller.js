const db = require('../config/db');

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
        json_object(
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
        ) as location
      FROM event_locations el
      JOIN locations l ON el.id_location = l.id
      JOIN provinces p ON l.id_province = p.id
      WHERE el.id_creator_user = ?
      ORDER BY el.id
      LIMIT ? OFFSET ?
    `;
    db.all(query, [userId, limit, offset], (err, rows) => {
      if (err) {
        console.error(err);
        return res.status(400).json({ message: 'Error al listar event-locations.' });
      }
      const processedRows = rows.map(row => ({
        ...row,
        location: JSON.parse(row.location)
      }));
      res.json({ collection: processedRows });
    });
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
        json_object(
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
        ) as location
      FROM event_locations el
      JOIN locations l ON el.id_location = l.id
      JOIN provinces p ON l.id_province = p.id
      WHERE el.id = ? AND el.id_creator_user = ?
      LIMIT 1
    `;
    db.get(query, [id, userId], (err, row) => {
      if (err) {
        console.error(err);
        return res.status(400).json({ message: 'Error al obtener event-location.' });
      }
      if (!row) {
        return res.status(404).json({ message: 'Event-location no encontrada o no pertenece al usuario.' });
      }
      const result = {
        ...row,
        location: JSON.parse(row.location)
      };
      res.status(200).json(result);
    });
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
      VALUES (?, ?, ?, ?, ?, ?, ?)`;
    db.run(insertQuery, [id_location, name, full_address, max_capacity, latitude, longitude, userId], function(err) {
      if (err) {
        console.error(err);
        return res.status(400).json({ message: 'Error al crear event-location.' });
      }
      res.status(201).json({ id: this.lastID });
    });
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
    db.get('SELECT * FROM event_locations WHERE id = ? AND id_creator_user = ?', [id, userId], (err, result) => {
      if (err || !result) {
        return res.status(404).json({ message: 'Event-location no encontrada o no pertenece al usuario.' });
      }
      if (!id_location || !name || !full_address || !max_capacity) {
        return res.status(400).json({ message: 'Faltan campos obligatorios.' });
      }
      if (max_capacity < 1) {
        return res.status(400).json({ message: 'La capacidad máxima debe ser mayor a cero.' });
      }
      const updateQuery = `UPDATE event_locations SET id_location = ?, name = ?, full_address = ?, max_capacity = ?, latitude = ?, longitude = ? WHERE id = ?`;
      db.run(updateQuery, [id_location, name, full_address, max_capacity, latitude, longitude, id], function(err) {
        if (err) {
          console.error(err);
          return res.status(400).json({ message: 'Error al actualizar event-location.' });
        }
        res.status(200).json({ message: 'Event-location actualizada correctamente.' });
      });
    });
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
    db.get('SELECT * FROM event_locations WHERE id = ? AND id_creator_user = ?', [id, userId], (err, result) => {
      if (err || !result) {
        return res.status(404).json({ message: 'Event-location no encontrada o no pertenece al usuario.' });
      }
      // Verificar que no tenga eventos asociados
      db.get('SELECT * FROM events WHERE id_event_location = ?', [id], (err, events) => {
        if (err) {
          console.error(err);
          return res.status(400).json({ message: 'Error al verificar eventos asociados.' });
        }
        if (events) {
          return res.status(400).json({ message: 'No se puede eliminar: existen eventos asociados a esta ubicación.' });
        }
        db.run('DELETE FROM event_locations WHERE id = ?', [id], function(err) {
          if (err) {
            console.error(err);
            return res.status(400).json({ message: 'Error al eliminar event-location.' });
          }
          res.status(200).json({ message: 'Event-location eliminada correctamente.' });
        });
      });
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: 'Error al eliminar event-location.' });
  }
}; 

/*
const { dbOperations } = require('../config/db');

exports.listEventLocations = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({ message: 'No autenticado.' });
    }
    
    // Obtener ubicaciones del usuario
    const locations = dbOperations.getEventLocationsByUser(userId);
    
    // Aplicar paginación si se solicita
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    
    const paginatedLocations = locations.slice(startIndex, endIndex);
    
    // Enriquecer cada ubicación con datos de location y province
    const enrichedLocations = paginatedLocations.map(el => {
      const location = dbOperations.findLocationById(el.id_location);
      const province = location ? dbOperations.findProvinceById(location.id_province) : null;
      
      return {
        ...el,
        location: location ? {
          id: location.id,
          name: location.name,
          id_province: location.id_province,
          latitude: location.latitude,
          longitude: location.longitude,
          province: province ? {
            id: province.id,
            name: province.name,
            full_name: province.full_name,
            latitude: province.latitude,
            longitude: province.longitude,
            display_order: province.display_order
          } : null
        } : null
      };
    });
    
    res.json({ collection: enrichedLocations });
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
    
    // Buscar la ubicación y verificar que pertenezca al usuario
    const eventLocation = dbOperations.findEventLocationById(id);
    
    if (!eventLocation || eventLocation.id_creator_user != userId) {
      return res.status(404).json({ message: 'Event-location no encontrada o no pertenece al usuario.' });
    }
    
    // Obtener datos de location y province
    const location = dbOperations.findLocationById(eventLocation.id_location);
    const province = location ? dbOperations.findProvinceById(location.id_province) : null;
    
    const result = {
      ...eventLocation,
      location: location ? {
        id: location.id,
        name: location.name,
        id_province: location.id_province,
        latitude: location.latitude,
        longitude: location.longitude,
        province: province ? {
          id: province.id,
          name: province.name,
          full_name: province.full_name,
          latitude: province.latitude,
          longitude: province.longitude,
          display_order: province.display_order
        } : null
      } : null
    };
    
    res.status(200).json(result);
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
    
    // Validaciones
    if (!id_location || !name || !full_address || !max_capacity) {
      return res.status(400).json({ message: 'Faltan campos obligatorios.' });
    }
    
    if (max_capacity < 1) {
      return res.status(400).json({ message: 'La capacidad máxima debe ser mayor a cero.' });
    }
    
    // Verificar que la location exista
    const location = dbOperations.findLocationById(id_location);
    if (!location) {
      return res.status(400).json({ message: 'La localidad especificada no existe.' });
    }
    
    // Crear la event-location
    const newLocation = dbOperations.createEventLocation({
      id_location,
      name,
      full_address,
      max_capacity,
      latitude,
      longitude,
      id_creator_user: userId
    });
    
    res.status(201).json({ id: newLocation.id });
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
    const eventLocation = dbOperations.findEventLocationById(id);
    if (!eventLocation || eventLocation.id_creator_user != userId) {
      return res.status(404).json({ message: 'Event-location no encontrada o no pertenece al usuario.' });
    }
    
    // Validaciones
    if (!id_location || !name || !full_address || !max_capacity) {
      return res.status(400).json({ message: 'Faltan campos obligatorios.' });
    }
    
    if (max_capacity < 1) {
      return res.status(400).json({ message: 'La capacidad máxima debe ser mayor a cero.' });
    }
    
    // Verificar que la location exista
    const location = dbOperations.findLocationById(id_location);
    if (!location) {
      return res.status(400).json({ message: 'La localidad especificada no existe.' });
    }
    
    // Actualizar la event-location
    const updated = dbOperations.updateEventLocation(id, {
      id_location,
      name,
      full_address,
      max_capacity,
      latitude,
      longitude
    });
    
    if (updated) {
      res.status(200).json({ message: 'Event-location actualizada correctamente.' });
    } else {
      res.status(400).json({ message: 'Error al actualizar event-location.' });
    }
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
    const eventLocation = dbOperations.findEventLocationById(id);
    if (!eventLocation || eventLocation.id_creator_user != userId) {
      return res.status(404).json({ message: 'Event-location no encontrada o no pertenece al usuario.' });
    }
    
    // Verificar que no tenga eventos asociados
    const events = dbOperations.getAllEvents().filter(e => e.id_event_location == id);
    if (events.length > 0) {
      return res.status(400).json({ message: 'No se puede eliminar: existen eventos asociados a esta ubicación.' });
    }
    
    // Eliminar la event-location
    const deleted = dbOperations.deleteEventLocation(id);
    
    if (deleted) {
      res.status(200).json({ message: 'Event-location eliminada correctamente.' });
    } else {
      res.status(400).json({ message: 'Error al eliminar event-location.' });
    }
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: 'Error al eliminar event-location.' });
  }
}; */