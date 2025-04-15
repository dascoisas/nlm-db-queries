const { MongoClient } = require('mongodb');
const ExcelJS = require('exceljs');
const path = require('path');

// MongoDB connection settings
const uri = 'mongodb://nouvenn:nouvenn2021@10.8.0.200:27017';
const dbName = 'admin';
const collectionName = 'gatewaymodels';

// Função para verificar se uma coordenada é válida
function isValidCoordinate(coord) {
    if (coord === undefined || coord === null) return false;

    // Verifica se é um número válido
    const num = parseFloat(coord);
    return !isNaN(num);
}

async function main() {
    const client = new MongoClient(uri);

    try {
        // Conectar ao MongoDB
        await client.connect();
        console.log('Conectado com sucesso ao MongoDB');

        const database = client.db(dbName);
        const collection = database.collection(collectionName);
        const tenantCollection = database.collection('tenantmodels');

        // Buscar gateways com coordenadas válidas
        const gateways = await collection.find({}).toArray();

        console.log(`Total de gateways encontrados: ${gateways.length}`);

        // Filtrar apenas gateways com coordenadas válidas
        const validGateways = gateways.filter(gw =>
            isValidCoordinate(gw.gw_lat) && isValidCoordinate(gw.gw_lng)
        );

        console.log(`Gateways com coordenadas válidas: ${validGateways.length}`);

        // Buscar informações de cidade para cada gateway
        const gatewaysWithCity = [];

        for (const gw of validGateways) {
            let city = 'N/A';
            if (gw.tenantId) {
                const tenant = await tenantCollection.findOne({ id: gw.tenantId });
                if (tenant && tenant.city) {
                    city = tenant.city;
                }
            }
            gatewaysWithCity.push({ ...gw, city });
        }

        // Ordenar gateways por cidade
        gatewaysWithCity.sort((a, b) => {
            if (a.city < b.city) return -1;
            if (a.city > b.city) return 1;
            return 0;
        });

        console.log(`Gateways com informações de cidade: ${gatewaysWithCity.length}`);

        // Criar um arquivo Excel
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Gateways');

        // Adicionar cabeçalho
        worksheet.columns = [
            { header: 'city', key: 'city', width: 20 },
            { header: 'ipv4', key: 'ipv4', width: 15 },
            { header: 'eui64_coord', key: 'identification', width: 20 },
            { header: 'lat', key: 'lat', width: 15 },
            { header: 'lng', key: 'lng', width: 15 }
        ];

        // Adicionar dados
        gatewaysWithCity.forEach(gw => {
            worksheet.addRow({
                city: gw.city || 'N/A',
                ipv4: gw.ipv4 || '',
                identification: gw.identification || '',
                lat: gw.gw_lat || '',
                lng: gw.gw_lng || ''
            });
        });

        // Salvar o arquivo
        const outputPath = path.join(__dirname, 'gateways_com_coordenadas.xlsx');
        await workbook.xlsx.writeFile(outputPath);

        console.log(`Arquivo Excel gerado com sucesso: ${outputPath}`);

    } catch (error) {
        console.error('Erro durante a execução:', error);
    } finally {
        await client.close();
        console.log('Conexão com MongoDB fechada');
    }
}

// Executar o script
main().catch(console.error);
