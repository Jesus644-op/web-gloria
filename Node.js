// Requiere: npm install express mysql2 bcrypt
const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const app = express();
const PORT = 3000;

// Middleware para leer JSON del body
app.use(express.json());

// Conexión y creación de base de datos + tabla
let connection;

async function setupDatabase() {
  try {
    // Crear conexión inicial
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '', // Cambia si tu MySQL tiene contraseña
    });

    // Crear base de datos si no existe
    await connection.query(`CREATE DATABASE IF NOT EXISTS gloriaweb`);
    await connection.query(`USE gloriaweb`);

    // Crear tabla de usuarios
    await connection.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario VARCHAR(50) NOT NULL UNIQUE,
        email VARCHAR(100) NOT NULL UNIQUE,
        contrasena VARCHAR(255) NOT NULL,
        fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Base de datos y tabla configuradas correctamente.');
  } catch (error) {
    console.error('❌ Error configurando la base de datos:', error);
  }
}

setupDatabase();

// Ruta para registrar usuarios
app.post('/register', async (req, res) => {
  const { usuario, email, contrasena } = req.body;

  if (!usuario || !email || !contrasena) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  try {
    const hash = await bcrypt.hash(contrasena, 10);
    await connection.query(
      'INSERT INTO usuarios (usuario, email, contrasena) VALUES (?, ?, ?)',
      [usuario, email, hash]
    );
    return res.status(200).json({ success: true });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Usuario o correo ya registrado' });
    }
    console.error('Error en /register:', err);
    return res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
