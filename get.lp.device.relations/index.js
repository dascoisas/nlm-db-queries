const { MongoClient } = require('mongodb');
const { Parser } = require('json2csv');
const fs = require('fs');
require('dotenv').config();

// URI de conexão com o MongoDB
const uri = 'mongodb://nouvenn:nouvenn2021@10.8.0.200:27017/admin';

// Função para verificar se o campo dvc_lp é válido
function isValidDvcLp(dvc_lp) {
    return dvc_lp && dvc_lp.trim() !== ''; // Verifica se não é vazio ou composto por espaços
}

// Função para buscar os dados e gerar o CSV
async function fetchData() {
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

    try {
        // Conectar ao MongoDB
        await client.connect();
        console.log('Conectado ao MongoDB');

        // Acessar a collection 'devicenlmmodels'
        const database = client.db('admin');
        const collection = database.collection('devicenlmmodels');

        // Buscar documentos onde dvc_tenantId é igual ao valor especificado
        const query = { dvc_tenantId: process.env.TENANT_ID };
        const devices = await collection.find(query).project({ dvc_lp: 1, dvc_serialNumber: 1 }).toArray();

        if (devices.length > 0) {
            // Preparar os dados para o CSV
            const csvData = devices.filter(device => isValidDvcLp(device.dvc_lp)).map(device => ({
                ponto_ip: device.dvc_lp,
                dispositivo: device.dvc_serialNumber,
            }));

            if (csvData.length > 0) {
                // Converter para CSV
                const json2csvParser = new Parser();
                const csv = json2csvParser.parse(csvData);

                // Salvar no arquivo CSV
                fs.writeFileSync('devices.csv', csv);
                console.log('Arquivo CSV gerado com sucesso!');
            } else {
                console.log('Nenhum dispositivo válido encontrado com o dvc_lp preenchido.');
            }
        } else {
            console.log('Nenhum dispositivo encontrado com o tenantId especificado.');
        }
    } catch (err) {
        console.error('Erro ao buscar dados:', err);
    } finally {
        await client.close(); // Fechar a conexão com o MongoDB
    }
}

// Executar a função
fetchData();
