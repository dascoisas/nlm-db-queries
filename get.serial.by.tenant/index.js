const { MongoClient } = require('mongodb');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const fs = require('fs');
const path = require('path');

async function main() {
    const uri = 'mongodb://nouvenn:nouvenn2021@10.8.0.200:27017'; // URL do seu MongoDB
    const client = new MongoClient(uri);
    const dbName = 'admin'; // Substitua pelo nome do seu banco de dados
    const collectionName = 'devicemodels'; // Substitua pelo nome da sua coleção

    try {
        await client.connect();
        console.log('Conectado ao MongoDB');

        const db = client.db(dbName);
        const collection = db.collection(collectionName);
        const tenantModelsCollection = db.collection('tenantmodels');

        // 1. Buscando todos os dados da coleção
        const data = await collection.find({}).toArray();

        // 2. Organizando os dados por tenantId
        const tenantDataMap = {};
        data.forEach(item => {
            const tenantId = item.tenantId;
            const serialNumber = item.serialNumber;
            if (!tenantDataMap[tenantId]) {
                tenantDataMap[tenantId] = [];
            }
            tenantDataMap[tenantId].push(serialNumber);
        });

        // 3. Criando CSVs para cada tenantId
        const csvFiles = [];
        for (const [tenantId, serialNumbers] of Object.entries(tenantDataMap)) {
            const csvWriter = createCsvWriter({
                path: path.join(__dirname, `${tenantId}.csv`), // Nome do arquivo
                header: [{ id: 'serialNumber', title: 'Serial Number' }]
            });

            await csvWriter.writeRecords(serialNumbers.map(sn => ({ serialNumber: sn })));
            csvFiles.push({ tenantId, filePath: `${tenantId}.csv` });
            console.log(`CSV criado para tenantId: ${tenantId}`);
        }

        // 4. Buscando os nomes dos tenants
        const tenantNames = {};
        for (const { tenantId } of csvFiles) {
            const tenant = await tenantModelsCollection.findOne({ id: tenantId });
            if (tenant) {
                tenantNames[tenantId] = tenant.name;
            }
        }

        // 5. Renomeando os arquivos CSV com os nomes dos tenants
        for (const { tenantId, filePath } of csvFiles) {
            const newFileName = tenantNames[tenantId] ? `${tenantNames[tenantId]}.csv` : `${tenantId}.csv`;
            const newFilePath = path.join(__dirname, newFileName);
            fs.renameSync(filePath, newFilePath);
            console.log(`Arquivo renomeado de ${filePath} para ${newFileName}`);
        }

    } catch (error) {
        console.error('Erro:', error);
    } finally {
        await client.close();
    }
}

main();
