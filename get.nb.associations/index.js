const { MongoClient } = require('mongodb');
const fs = require('fs');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const url = 'mongodb://nouvenn:nouvenn2021@10.8.0.200:27017';
const dbName = 'admin';
const collection1 = 'nbproductionmodels'; // Primeira collection
const collection2 = 'nbsettingsmodels'; // Segunda collection

// Função principal que executa a tarefa
async function exportDataToCsv() {
  // Conectar ao MongoDB
  const client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });

  try {
    await client.connect();
    console.log('Conectado ao MongoDB');

    const db = client.db(dbName);
    const productionModels = db.collection(collection1);
    const settingsModels = db.collection(collection2);

    // Buscar todos os dados da collection 'nbproductionmodels'
    const productionData = await productionModels.find().toArray();
    console.log('Production Models: ', productionData);

    // Inicializar array para armazenar dados combinados
    const outputData = [];

    // Loop pelos dados de 'nbproductionmodels'
    for (const item of productionData) {
      const { identification, code } = item;
      console.log('ITEM: ', item);

      // Buscar dados relacionados na collection 'nbsettingsmodels'
      const settingsData = await settingsModels.findOne({ identification: identification });
      console.log('Settings Data: ', settingsData);


      if (settingsData) {
        // Combinar 'code' da primeira coleção com os dados da segunda
        outputData.push({
          qrCode: code,
          snCupula: settingsData.serialNumber,
          chipICCID: settingsData.iccid,
          macPlaca: identification,
        });
      }
    }

    // Criar o writer para gerar o arquivo CSV
    const csvWriter = createCsvWriter({
      path: 'cromatek-producao.csv',
      header: [
        { id: 'qrCode', title: 'qrCode' },
        { id: 'snCupula', title: 'snCupula' },
        { id: 'chipICCID', title: 'chipICCID' }, // Substitua por campos reais
        { id: 'macPlaca', title: 'macPlaca' }, // Substitua por campos reais
      ]
    });

    // Escrever os dados no CSV
    await csvWriter.writeRecords(outputData);
    console.log('Arquivo CSV gerado com sucesso: output.csv');

  } catch (error) {
    console.error('Erro ao conectar ou buscar dados:', error);
  } finally {
    await client.close(); // Fechar a conexão com o MongoDB
  }
}

// Executa a função
exportDataToCsv();
