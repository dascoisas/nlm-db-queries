const { MongoClient } = require('mongodb');

// Substitua com sua string de conexão do MongoDB
const uri = 'mongodb://nouvenn:nouvenn2021@10.8.0.200:27017';
const client = new MongoClient(uri);

async function run() {
  try {
    // Conectando ao MongoDB
    await client.connect();
    
    // Substitua 'meuBanco' e 'minhaColecao' pelo nome do seu banco de dados e coleção
    const database = client.db('admin');
    const collection = database.collection('nbproductionmodels');
    
    // Consulta para encontrar todos os documentos onde o campo 'code' contém a letra "A"
    const query = { code: { $regex: "A" } };
    
    // Executando a consulta para contar os documentos
    const count = await collection.countDocuments(query);
    
    // Mostrando a quantidade
    console.log('Quantidade de documentos encontrados:', count);
  } finally {
    // Fechar a conexão
    await client.close();
  }
}

run().catch(console.dir);
