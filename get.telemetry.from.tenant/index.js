const { MongoClient } = require('mongodb');
const fs = require('fs');
const csvWriter = require('fast-csv');

const uri = "mongodb://nouvenn:nouvenn2021@10.8.0.200:27017";
const client = new MongoClient(uri);
const collectionName = 'measuremodels';
const tenantId = '4ae96abd-dbaa-4df2-8287-e4ee9e46c59a';
const batchSize = 1000;
const outputFile = 'output.csv';

async function fetchAndSaveToCSV() {
    try {
        await client.connect();
        const db = client.db('admin');
        const collection = db.collection(collectionName);

        const cursor = collection.find({
            tenantId,
            attr: 'U_RMS',
            // $or: [
            //     { value: { $gt: 24800 } },
            //     { value: { $lt: 19800 } }
            // ]
        });
        console.log('CURSOR: ', cursor);

        // Escrever CSV com cabeçalho
        const csvStream = csvWriter.format({ headers: true });
        const writableStream = fs.createWriteStream(outputFile, { flags: 'a' });
        csvStream.pipe(writableStream);

        let batch = [];
        let count = 0;

        while (await cursor.hasNext()) {
            const doc = await cursor.next();
            batch.push(doc);

            if (batch.length === batchSize) {
                // Escreve os dados do lote atual no CSV
                batch.forEach(record => csvStream.write(record));
                console.log(`Salvou ${batchSize * ++count} registros...`);
                batch = [];
            }
        }

        // Gravação final para o que resta no lote
        if (batch.length > 0) {
            batch.forEach(record => csvStream.write(record));
            console.log(`Salvou o último lote de ${batch.length} registros.`);
        }

        csvStream.end(); // Finaliza o stream do CSV
        console.log("Processo completo.");
    } catch (error) {
        console.error("Erro ao buscar dados:", error);
    } finally {
        await client.close();
    }
}

fetchAndSaveToCSV();
