const express = require('express');
const axios = require('axios');
const xmlbuilder = require('xmlbuilder');

const app = express();
app.use(express.json());

app.post('/sendToMirth', async (req, res) => {
  try {
    const data = req.body;

    // Assumindo o mesmo JSON do seu exemplo, pegamos o primeiro paciente:
    const paciente = data.rows[0];
    const header = data.header;

    // Mapear colunas
    let patientObj = {};
    header.forEach((key, index) => {
      patientObj[key] = paciente[index];
    });

    // Criar XML
    const xml = xmlbuilder.create('patient')
      .ele('id', patientObj.id).up()
      .ele('patientName', patientObj.patientName).up()
      .ele('patientId', patientObj.patientId).up()
      .ele('examType', patientObj.examType).up()
      .ele('examDate', patientObj.examDate).up()
      .ele('examTime', patientObj.examTime).up()
      .ele('createdAt', patientObj.createdAt)
      .end({ pretty: true });

    console.log('XML enviado para Mirth:\n', xml);

    const mirthUrl = 'http://localhost:8090/'; // sua URL

    // Enviar XML para Mirth
    const response = await axios.post(mirthUrl, xml, {
      headers: { 'Content-Type': 'application/xml' },
      timeout: 5000,
    });

    console.log('Resposta do Mirth:', response.status, response.data);

    res.status(200).send({
      message: 'Dados enviados para o Mirth com sucesso',
      mirthStatus: response.status,
      mirthData: response.data
    });
  } catch (error) {
    console.error('Erro ao enviar dados para o Mirth:', error.response?.data || error.message);
    res.status(500).send({ error: error.response?.data || error.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server rodando na porta ${PORT}`));
