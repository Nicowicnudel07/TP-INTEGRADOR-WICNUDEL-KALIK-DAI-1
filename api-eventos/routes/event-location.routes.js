const express = require('express');
const router = express.Router();
const eventLocationController = require('../controllers/event-location.controller');
const auth = require('../middleware/auth');

// Listar todas las event-locations del usuario autenticado
router.get('/', auth, eventLocationController.listEventLocations);

// Detalle de una event-location
router.get('/:id', auth, eventLocationController.getEventLocationDetail);

// Crear event-location
router.post('/', auth, eventLocationController.createEventLocation);

// Editar event-location
router.put('/:id', auth, eventLocationController.updateEventLocation);

// Eliminar event-location
router.delete('/:id', auth, eventLocationController.deleteEventLocation);

module.exports = router; 

/* 
const express = require('express');
const router = express.Router();
const eventLocationController = require('../controllers/event-location.controller');
const auth = require('../middleware/auth');

// Listar todas las event-locations del usuario autenticado
router.get('/', auth, eventLocationController.listEventLocations);

// Detalle de una event-location
router.get('/:id', auth, eventLocationController.getEventLocationDetail);

// Crear event-location
router.post('/', auth, eventLocationController.createEventLocation);

// Editar event-location
router.put('/', auth, eventLocationController.updateEventLocation);

// Eliminar event-location
router.delete('/:id', auth, eventLocationController.deleteEventLocation);

module.exports = router; */