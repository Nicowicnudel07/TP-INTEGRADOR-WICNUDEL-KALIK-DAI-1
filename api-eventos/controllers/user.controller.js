const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  const { first_name, last_name, username, password } = req.body;

  if (!first_name || first_name.length < 3 || !last_name || last_name.length < 3) {
    return res.status(400).json({ message: 'Nombre o apellido inválido' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(username)) {
    return res.status(400).json({ message: 'El email es inválido' });
  }

  if (!password || password.length < 3) {
    return res.status(400).json({ message: 'Password inválido' });
  }

  const hashed = await bcrypt.hash(password, 10);

  try {
    await pool.query(
      `INSERT INTO users (first_name, last_name, username, password) VALUES ($1, $2, $3, $4)`,
      [first_name, last_name, username, hashed]
    );
    res.status(201).json({ success: true });
  } catch (err) {
    res.status(400).json({ message: 'Error al registrar usuario' });
  }
};

exports.login = async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query(`SELECT * FROM users WHERE username = $1`, [username]);
    const user = result.rows[0];

    if (!user) return res.status(401).json({ message: 'Usuario o clave inválida' });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ message: 'Usuario o clave inválida' });

    const token = jwt.sign(
      { id: user.id, first_name: user.first_name, last_name: user.last_name },
      process.env.JWT_SECRET
    );

    res.status(200).json({ success: true, token });
  } catch (err) {
    res.status(400).json({ message: 'Error al iniciar sesión' });
  }
};
