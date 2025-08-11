const express = require('express');
const router = express.Router();
const eventController = require('../controllers/event.controller');
const auth = require('../middleware/auth');

// Listar todos los eventos (público, paginado y filtrado)
router.get('/', eventController.listEvents);

// Obtener detalle de un evento (público)
router.get('/:id', eventController.getEventDetail);

// Crear un nuevo evento (requiere autenticación)
router.post('/', auth, eventController.createEvent);

// Editar un evento (requiere autenticación)
router.put('/', auth, eventController.updateEvent);

// Eliminar un evento (requiere autenticación)
router.delete('/:id', auth, eventController.deleteEvent);

// Inscribirse a un evento (requiere autenticación)
router.post('/:id/enrollment', auth, eventController.enrollEvent);

// Cancelar inscripción a un evento (requiere autenticación)
router.delete('/:id/enrollment', auth, eventController.unenrollEvent);

// Listar participantes de un evento (según tu preferencia: público o autenticado)
router.get('/:id/participants', eventController.listParticipants);
// Si querés que sólo usuarios autenticados puedan ver los participantes, usá:
// router.get('/:id/participants', auth, eventController.listParticipants);

module.exports = router;