const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Banco de dados SQLite
const db = new sqlite3.Database('./ris.db');

// Cria tabela se não existir
db.run(`CREATE TABLE IF NOT EXISTS ris (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patientName TEXT,
  patientId TEXT,
  examType TEXT,
  examDate TEXT,
  examTime TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

// Rota para receber dados do formulário
app.post('/agendamento', (req, res) => {
  const { patientName, patientId, examType, examDate, examTime } = req.body;
  db.run(
    `INSERT INTO ris (patientName, patientId, examType, examDate, examTime)
     VALUES (?, ?, ?, ?, ?)`,
    [patientName, patientId, examType, examDate, examTime],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: this.lastID, status: 'Agendamento salvo com sucesso' });
    }
  );
});

// Rota para listar agendamentos
app.get('/agendamentos', (req, res) => {
  db.all('SELECT * FROM ris', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
