const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Rutas base
app.use('/api/user', require('./routes/user.routes'));
app.use('/api/event', require('./routes/event.routes'));
// podés agregar más rutas acá

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
