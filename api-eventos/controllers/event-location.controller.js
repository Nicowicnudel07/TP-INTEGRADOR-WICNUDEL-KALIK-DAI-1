const pool = require('../config/db');

exports.listEventLocations = async (req, res) => {
  // TODO: Implementar listado paginado de event-locations del usuario
  res.json({ collection: [] });
};

exports.getEventLocationDetail = async (req, res) => {
  // TODO: Implementar detalle de event-location
  res.json({});
};

exports.createEventLocation = async (req, res) => {
  // TODO: Implementar creación de event-location
  res.status(201).json({});
};

exports.updateEventLocation = async (req, res) => {
  // TODO: Implementar actualización de event-location
  res.status(200).json({});
};

exports.deleteEventLocation = async (req, res) => {
  // TODO: Implementar eliminación de event-location
  res.status(200).json({});
}; 