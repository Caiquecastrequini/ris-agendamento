const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const axios = require('axios');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const db = new sqlite3.Database('./ris.db');

db.run(`
  CREATE TABLE IF NOT EXISTS ris (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patientName TEXT,
    patientId TEXT,
    examType TEXT,
    examDate TEXT,
    examTime TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

app.post('/agendamento', async (req, res) => {
  const { patientName, patientId, examType, examDate, examTime } = req.body;

  db.run(
    `INSERT INTO ris (patientName, patientId, examType, examDate, examTime)
     VALUES (?, ?, ?, ?, ?)`,
    [patientName, patientId, examType, examDate, examTime],
    async function (err) {
      if (err) return res.status(500).json({ error: err.message });

      // Enviar JSON para o Mirth
      try {
        await axios.post('http://localhost:8081/ris', req.body, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        console.log('✅ Enviado ao Mirth com sucesso');
      } catch (error) {
        console.error('❌ Erro ao enviar para o Mirth:', error.message);
      }

      res.status(201).json({ id: this.lastID, status: 'Agendamento salvo e enviado ao Mirth!' });
    }
  );
});

app.get('/agendamentos', (req, res) => {
  db.all('SELECT * FROM ris', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
