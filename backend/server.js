const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const axios = require('axios');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

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

// Rota para salvar e enviar agendamento
app.post('/agendamento', async (req, res) => {
  const { patientName, patientId, examType, examDate, examTime } = req.body;

  db.run(
    `INSERT INTO ris (patientName, patientId, examType, examDate, examTime)
     VALUES (?, ?, ?, ?, ?)`,
    [patientName, patientId, examType, examDate, examTime],
    async function (err) {
      if (err) return res.status(500).json({ error: err.message });

      // Escapa caracteres especiais do XML
      const escapeXml = (str) =>
        str?.toString().replace(/&/g, '&amp;')
                       .replace(/</g, '&lt;')
                       .replace(/>/g, '&gt;')
                       .replace(/"/g, '&quot;')
                       .replace(/'/g, '&apos;') || '';

      const xmlData = `<ris>
  <patientName>${escapeXml(patientName)}</patientName>
  <patientId>${escapeXml(patientId)}</patientId>
  <examType>${escapeXml(examType)}</examType>
  <examDate>${escapeXml(examDate)}</examDate>
  <examTime>${escapeXml(examTime)}</examTime>
</ris>`;

      try {
        await axios.post('http://localhost:8081/ris', xmlData, {
          headers: {
            'Content-Type': 'application/xml'
          }
        });
        console.log('✅ XML enviado ao Mirth com sucesso');
      } catch (error) {
        console.error('❌ Erro ao enviar para o Mirth:', error.message);
      }

      res.status(201).json({
        id: this.lastID,
        status: 'Agendamento salvo e XML enviado ao Mirth!'
      });
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

// Inicia o servidor
app.listen(port, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${port}`);
});
