const express = require('express');
const router = express.Router();
const eventController = require('../controllers/event.controller');
const auth = require('../middleware/auth');

// Listado de eventos (paginado y filtrado)
router.get('/', eventController.listEvents);

// Detalle de un evento
router.get('/:id', eventController.getEventDetail);

// Crear evento (autenticado)
router.post('/', auth, eventController.createEvent);

// Editar evento (autenticado)
router.put('/', auth, eventController.updateEvent);

// Eliminar evento (autenticado)
router.delete('/:id', auth, eventController.deleteEvent);

// Inscripción a evento (autenticado)
router.post('/:id/enrollment', auth, eventController.enrollEvent);

// Desinscripción de evento (autenticado)
router.delete('/:id/enrollment', auth, eventController.unenrollEvent);

// Listar participantes de un evento
router.get('/:id/participants', eventController.listParticipants);

module.exports = router; 