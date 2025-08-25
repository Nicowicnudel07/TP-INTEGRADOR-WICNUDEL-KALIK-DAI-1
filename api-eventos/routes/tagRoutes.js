const express = require('express');
const router = express.Router();
const { dbOperations } = require('../config/db');

router.get('/', async (req, res) => {
  try {
    const tags = await dbOperations.getAllTags();

    return res.status(200).json({
      success: true,
      tags: tags
    });
  } catch (error) {
    console.error('Error al obtener tags:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;