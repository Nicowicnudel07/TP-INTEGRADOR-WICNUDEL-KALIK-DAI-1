const pool = require('../config/db');

exports.listEvents = async (req, res) => {
  // TODO: Implementar paginación y filtros
  res.json({ collection: [] });
};

exports.getEventDetail = async (req, res) => {
  // TODO: Implementar detalle de evento
  res.json({});
};

exports.createEvent = async (req, res) => {
  // TODO: Implementar creación de evento
  res.status(201).json({});
};

exports.updateEvent = async (req, res) => {
  // TODO: Implementar actualización de evento
  res.status(200).json({});
};

exports.deleteEvent = async (req, res) => {
  // TODO: Implementar eliminación de evento
  res.status(200).json({});
};

exports.enrollEvent = async (req, res) => {
  // TODO: Implementar inscripción a evento
  res.status(201).json({});
};

exports.unenrollEvent = async (req, res) => {
  // TODO: Implementar desinscripción de evento
  res.status(200).json({});
};

exports.listParticipants = async (req, res) => {
  // TODO: Implementar listado de participantes
  res.json({ collection: [] });
}; 