const express = require('express');
const router = express.Router();
const { dbOperations } = require('../config/db');

router.get('/province/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const locations = await dbOperations.getLocationsByProvince(id);

    return res.status(200).json({
      success: true,
      locations: locations
    });
  } catch (error) {
    console.error('Error al obtener localidades:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;