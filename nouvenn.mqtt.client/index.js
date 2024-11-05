const mqtt = require('mqtt');
const fs = require('fs');

// Função para obter a data e hora formatadas
function getFormattedDate() {
    const now = new Date();
    return now.toLocaleString(); // Formato "dd/mm/aaaa hh:mm:ss"
}

// Caminhos para os certificados
const options = {
    host: 'vpn-nlm.nouvenn.com',
    port: 8883,
    protocol: 'mqtts',
    username: 'nouvenn',
    password: 'passN0uv3nn2021!#',
    // ca: fs.readFileSync('ca 1.crt'), // CA certificate
    // cert: fs.readFileSync('cimatec 1.crt'), // Client certificate
    // key: fs.readFileSync('cimatec 1.key'), // Client key
    keepalive: 240, // Tempo de envio do PINGREQ para o servidor - Tempo máximo da lib
    reconnectPeriod: 60000, // Tempo após uma desconexão que o client vai tentar se reconectar - 1 minuto
    connectTimeout: 60000, // Tempo após uma tentativa falha de conexão em que o client vai desistir de tentar se conectar - 1 minuto
    clean: true, // Client não deseja receber mensagens que foram acumuladas no broker enquanto ele estava offline
};

// Conectando ao broker MQTT com as opções de segurança
const client = mqtt.connect(options);

client.on('connect', () => {
    console.log(`[${getFormattedDate()}] Conectado com sucesso ao broker MQTT.`);

    // Inscrever-se no tópico desejado
    const topic = 'slc/nouvenn/AAAAAAAAAAAAAAAA';
    client.subscribe(topic, (err) => {
        if (!err) {
            console.log(`[${getFormattedDate()}] Inscrito com sucesso no tópico: ${topic}`);
        } else {
            console.error(`[${getFormattedDate()}] Erro ao se inscrever no tópico: ${topic}`, err);
        }
    });
});

// Recebendo mensagens do tópico
client.on('message', (topic, message) => {
    console.log(`[${getFormattedDate()}] Mensagem recebida do tópico ${topic}: ${message.toString()}`);
});

// Lidando com desconexão
client.on('close', () => {
    console.log(`[${getFormattedDate()}] Conexão com o broker MQTT encerrada.`);
});

// Lidando com erros de conexão
client.on('error', (err) => {
    console.error(`[${getFormattedDate()}] Erro de conexão:`, err);
});
