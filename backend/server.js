const express = require('express');
const axios = require('axios');
const xmlbuilder = require('xmlbuilder');

const app = express();
app.use(express.json());

app.post('/sendToMirth', async (req, res) => {
  try {
    const data = req.body;

    // Exemplo: pegar um paciente do JSON recebido (assumindo estrutura igual ao que mandou)
    const paciente = data.rows[0]; // só o primeiro paciente
    const header = data.header;

    // Mapeando as colunas para os valores (para ficar legível)
    let patientObj = {};
    header.forEach((key, index) => {
      patientObj[key] = paciente[index];
    });

    // Construir XML com xmlbuilder
    const xml = xmlbuilder.create('patient')
      .ele('id', patientObj.id).up()
      .ele('patientName', patientObj.patientName).up()
      .ele('patientId', patientObj.patientId).up()
      .ele('examType', patientObj.examType).up()
      .ele('examDate', patientObj.examDate).up()
      .ele('examTime', patientObj.examTime).up()
      .ele('createdAt', patientObj.createdAt)
      .end({ pretty: true });

    console.log('XML gerado:\n', xml);

    // Enviar para Mirth Connect via POST HTTP
    const mirthUrl = 'http://localhost:8090'; // ajuste a URL se necessário

    const response = await axios.post(mirthUrl, xml, {
      headers: { 'Content-Type': 'application/xml' }
    });

    res.status(200).send({
      message: 'Dados enviados para o Mirth com sucesso',
      mirthResponseStatus: response.status
    });
  } catch (error) {
    console.error('Erro ao enviar dados para o Mirth:', error.message);
    res.status(500).send({ error: error.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server rodando na porta ${PORT}`);
});
