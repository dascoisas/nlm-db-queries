const fs = require('fs');
const csv = require('csv-parser');
const { MongoClient } = require('mongodb');
const fastCsv = require('fast-csv');

const mongoUrl = 'mongodb://nouvenn:nouvenn2021@10.8.0.200:27017';
const dbName = 'admin';
const collectionName = 'devicemodels';

async function main() {
    const serialNumbers = new Set();

    // Lendo o arquivo CSV
    fs.createReadStream('input.csv')
        .pipe(fastCsv.parse({ headers: true }))
        .on('data', (row) => {
            console.log('Row lida:', row);
            console.log('Chaves do objeto:', Object.keys(row));

            // Acesso com trim para remover espaços
            const serialNumber = row['serialNumber'] ? row['serialNumber'].trim() : null; 
            console.log('Serial Number:', serialNumber); 

            if (serialNumber) {
                serialNumbers.add(serialNumber);
            } else {
                console.log('Serial Number inválido ou vazio:', serialNumber);
            }
        })
        .on('end', async () => {
            console.log('CSV lido com sucesso!');
            console.log('Serial Numbers coletados:', Array.from(serialNumbers));
            await checkSerialNumbers(Array.from(serialNumbers));
        });
}

async function checkSerialNumbers(serialNumbers) {
    const client = new MongoClient(mongoUrl);

    try {
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection(collectionName);

        const existing = await collection
            .find({ serialNumber: { $in: serialNumbers } })
            .project({ serialNumber: 1 })
            .toArray();

        const existingSerialNumbers = new Set(existing.map(item => item.serialNumber));
        const notInDb = serialNumbers.filter(sn => !existingSerialNumbers.has(sn));

        const ws = fs.createWriteStream('output.csv');
        fastCsv
            .write(notInDb.map(sn => ({ serialNumber: sn })), { headers: true })
            .pipe(ws);

        ws.on('finish', () => {
            console.log('Arquivo CSV de saída criado com sucesso!');
        });
    } catch (error) {
        console.error('Erro ao verificar os serialNumbers:', error);
    } finally {
        await client.close();
    }
}

main().catch(console.error);
