const express = require('express');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Pool con configuración segura para Render
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// Verificar conexión antes de iniciar rutas
async function initDB() {
  try {
    await pool.query('SELECT NOW()');
    console.log('✅ Conexión a PostgreSQL establecida');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS records (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tabla "records" lista');
  } catch (err) {
    console.error('❌ ERROR CRÍTICO DE BASE DE DATOS:', err.message);
    console.log('👉 Verifica que DATABASE_URL esté configurada correctamente en Render');
  }
}

initDB().then(() => {
  app.listen(PORT, () => console.log(`🚀 Servidor escuchando en puerto ${PORT}`));
});

// Rutas CRUD
app.get('/api/records', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM records ORDER BY id DESC');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/records/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM records WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'No encontrado' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/records', async (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'Faltan campos' });
  try {
    const { rows } = await pool.query(
      'INSERT INTO records (name, email) VALUES ($1, $2) RETURNING *', [name, email]
    );
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/records/:id', async (req, res) => {
  const { name, email } = req.body;
  try {
    const { rows } = await pool.query(
      'UPDATE records SET name = $1, email = $2 WHERE id = $3 RETURNING *', [name, email, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'No encontrado' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/records/:id', async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM records WHERE id = $1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'No encontrado' });
    res.json({ message: 'Eliminado' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});