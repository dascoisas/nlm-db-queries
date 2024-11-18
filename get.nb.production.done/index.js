const { MongoClient } = require('mongodb');
const fs = require('fs');
const { createObjectCsvWriter } = require('csv-writer');

// Configurações do MongoDB
const uri = 'mongodb://nouvenn:nouvenn2021@10.8.0.200:27017/admin';
const dbName = 'admin';
const collection1 = 'nbproductionlogmodels';
const collection2 = 'nbproductionmodels';

// Configuração do arquivo CSV
const csvWriter = createObjectCsvWriter({
    path: 'output.csv',
    header: [
        { id: 'serialNumber', title: 'SerialNumber' },
        { id: 'identification', title: 'Identification' },
        { id: 'iccid', title: 'ICCID' },
        { id: 'code', title: 'Code' },
    ],
});

(async () => {
    const client = new MongoClient(uri);

    try {
        // Conecta ao MongoDB
        await client.connect();
        const db = client.db(dbName);
        const col1 = db.collection(collection1);
        const col2 = db.collection(collection2);

        // Busca na primeira coleção
        const results1 = await col1.find({ type: 'nbiot' }).toArray();
        console.log('PRODUCTION LOGS: ', results1.length);
        const csvData = [];

        for (const item of results1) {
            console.log('Getting testing code: ', item);
            const { identification, serialNumber, iccid } = item;

            // Busca na segunda coleção usando o campo "identification"
            const relatedItem = await col2.findOne({ identification });
            console.log('Code: ', relatedItem);

            if (relatedItem) {
                csvData.push({
                    serialNumber,
                    identification,
                    iccid,
                    code: relatedItem.code || '',
                });
            }
        }

        // Escreve os dados no arquivo CSV
        await csvWriter.writeRecords(csvData);

        console.log('Dados salvos no arquivo output.csv');
    } catch (err) {
        console.error('Erro ao executar o script:', err);
    } finally {
        // Fecha a conexão com o MongoDB
        await client.close();
    }
})();
