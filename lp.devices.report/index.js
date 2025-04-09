const { MongoClient } = require('mongodb');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const fs = require('fs');

// Configuração do MongoDB
const uri = 'mongodb://nouvenn:nouvenn2021@10.8.0.200:27017/admin';
const client = new MongoClient(uri);

// Função principal
async function processLightingPoints() {
  try {
    // Conectar ao MongoDB
    await client.connect();
    console.log('Conectado ao MongoDB');

    const db = client.db('admin');

    // Passo 1: Buscar pontos de iluminação na collection lightingpointmodels
    const lightingPointsCollection = db.collection('lightingpointmodels');
    const tenantId = '53fdd12e-e6c2-4f4b-b1c4-a0d0f354813d';
    const lightingPoints = await lightingPointsCollection
      .find({ lp_tenantId: tenantId })
      .toArray();

    if (lightingPoints.length === 0) {
      console.log('Nenhum ponto de iluminação encontrado para o tenantId fornecido.');
      return;
    }

    // Passo 2: Criar CSV inicial com os dados dos pontos de iluminação
    const csvWriter = createCsvWriter({
      path: 'lighting_points.csv',
      header: [
        { id: 'Ponto', title: 'Ponto' },
        { id: 'latitude', title: 'latitude' },
        { id: 'longitude', title: 'longitude' },
        { id: 'Luminárias', title: 'Luminárias' },
        { id: 'Potencias das Luminárias', title: 'Potencias das Luminárias' },
        { id: 'Endereço', title: 'Endereço' },
        { id: 'dispositivo', title: 'dispositivo' }, // Coluna para serialNumber (inicialmente vazia)
      ],
    });

    const csvData = lightingPoints.map(point => ({
      Ponto: point.lp_name,
      latitude: point.lp_lat,
      longitude: point.lp_lng,
      Luminárias: point.lp_nLamps,
      Endereço: point.lp_address,
      'Potencias das Luminárias': point.lp_potencies,
      dispositivo: '', // Deixamos vazio por enquanto
    }));

    await csvWriter.writeRecords(csvData);
    console.log('CSV inicial criado com sucesso: lighting_points.csv');

    // Passo 3: Atualizar o CSV com os serialNumbers dos dispositivos
    const devicenlmCollection = db.collection('devicenlmmodels');

    // Ler o CSV como array de objetos para atualização
    const csvLines = csvData.map(line => ({ ...line })); // Copia os dados iniciais

    // Para cada linha, buscar o dispositivo correspondente
    let devicesFound = 0;
    for (let i = 0; i < csvLines.length; i++) {
      const lpName = csvLines[i].Ponto;
      const device = await devicenlmCollection.findOne({ dvc_lp: lpName });
      if (device && device.dvc_serialNumber) {
        devicesFound++;
        console.log('Devices Encontrados: ', devicesFound);
        csvLines[i].dispositivo = device.dvc_serialNumber;
      } else {
        csvLines[i].dispositivo = 'N/A'; // Caso não encontre o dispositivo
      }
    }

    // Sobrescrever o CSV com os dados atualizados
    const updatedCsvWriter = createCsvWriter({
      path: 'lighting_points.csv',
      header: [
        { id: 'Ponto', title: 'Ponto' },
        { id: 'latitude', title: 'latitude' },
        { id: 'longitude', title: 'longitude' },
        { id: 'Luminárias', title: 'Luminárias' },
        { id: 'Endereço', title: 'Endereço' },
        { id: 'Potencias das Luminárias', title: 'Potencias das Luminárias' },
        { id: 'dispositivo', title: 'dispositivo' },
      ],
    });

    await updatedCsvWriter.writeRecords(csvLines);
    console.log('CSV atualizado com sucesso com os serialNumbers dos dispositivos.');

  } catch (error) {
    console.error('Erro ao processar os dados:', error);
  } finally {
    // Fechar a conexão com o MongoDB
    await client.close();
    console.log('Conexão com o MongoDB fechada.');
  }
}

// Executar a função
processLightingPoints();