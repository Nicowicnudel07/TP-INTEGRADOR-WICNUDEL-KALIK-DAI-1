const express = require('express');
const router = express.Router();
const { dbOperations } = require('../config/db');

router.get('/', async (req, res) => {
  try {
    const provinces = await dbOperations.getAllProvinces();

    return res.status(200).json({
      success: true,
      provinces: provinces
    });
  } catch (error) {
    console.error('Error al obtener provincias:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;