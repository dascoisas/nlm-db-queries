const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const Converter = require('./converter');
// Função para converter um array de IPV6 em um CSV
async function convertArrayToCsv(ipv6Array, outputFilePath) {
    // Cria um writer CSV
    const csvWriter = createCsvWriter({
        path: outputFilePath,
        header: [
            { id: 'ipv6', title: 'IPv6' },
            { id: 'eui64', title: 'EUI-64' }
        ]
    });

    // Mapeia o array de IPv6 e gera um novo array com os resultados
    const records = ipv6Array.map(ipv6 => ({
        ipv6: ipv6,
        eui64: Converter.ipv6ToEUI64(ipv6)  // Chama sua função aqui
    }));

    // Escreve os registros no CSV
    await csvWriter.writeRecords(records);
    console.log(`CSV gerado em: ${outputFilePath}`);
}

// Exemplo de uso
const ipv6Addresses = [
    'aaaa::b635:22ff:fe22:71f6',
    'aaaa::b635:22ff:fe29:9ac9',
    'aaaa::2a76:81ff:fe80:3462'
];

// Chama a função para gerar o CSV
convertArrayToCsv(ipv6Addresses, 'output.csv');
