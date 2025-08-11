const { dbOperations } = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  const { first_name, last_name, username, password } = req.body;

  if (!first_name || first_name.length < 3 || !last_name || last_name.length < 3) {
    return res.status(400).json({ success: false, message: 'Los campos first_name o last_name están vacíos o tienen menos de tres (3) letras.', token: '' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(username)) {
    return res.status(400).json({ success: false, message: 'El email es invalido.', token: '' });
  }

  if (!password || password.length < 3) {
    return res.status(400).json({ success: false, message: 'El campo password está vacío o tiene menos de tres (3) letras.', token: '' });
  }

  try {
    // Verificar si el usuario ya existe
    const existingUser = await dbOperations.findUserByUsername(username);
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'El usuario ya existe', token: '' });
    }

    const hashed = await bcrypt.hash(password, 10);
    await dbOperations.createUser({
      first_name,
      last_name,
      username,
      password: hashed
    });

    res.status(201).json({ success: true, message: '', token: '' });
  } catch (err) {
    console.error('ERROR AL REGISTRAR USUARIO:', err);
    res.status(400).json({ success: false, message: 'Error al registrar usuario', token: '' });
  }
};

exports.login = async (req, res) => {
  const { username, password } = req.body;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(username)) {
    console.log("Email inválido:", username);
    return res.status(400).json({ success: false, message: 'El email es invalido.', token: '' });
  }

  try {
    const user = await dbOperations.findUserByUsername(username);
    console.log("Usuario encontrado:", user);

    if (!user) {
      return res.status(401).json({ success: false, message: 'Usuario o clave inválida.', token: '' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    console.log("¿Password correcta?", isValid);

    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Usuario o clave inválida.', token: '' });
    }

    const token = jwt.sign(
      { id: user.id, first_name: user.first_name, last_name: user.last_name },
      process.env.JWT_SECRET || 'default_secret'
    );

    res.status(200).json({ success: true, message: '', token });
  } catch (err) {
    console.error('ERROR AL INICIAR SESIÓN:', err);
    res.status(400).json({ success: false, message: 'Error al iniciar sesión', token: '' });
  }
};
