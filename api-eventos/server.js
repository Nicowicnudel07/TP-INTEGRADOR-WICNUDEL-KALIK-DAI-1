const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { initializeDatabase } = require('./config/db');

const app = express();
app.use(cors());
app.use(express.json());

// Inicializar base de datos y luego iniciar servidor
const startServer = async () => {
  try {
    await initializeDatabase();
    
    // Rutas base
    app.use('/api/user', require('./routes/user.routes'));
    app.use('/api/event', require('./routes/event.routes'));
    app.use('/api/event-location', require('./routes/event-location.routes'));
    // podés agregar más rutas acá

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en puerto ${PORT}`);
    });
  } catch (error) {
    console.error('Error iniciando servidor:', error);
  }
};

startServer();
