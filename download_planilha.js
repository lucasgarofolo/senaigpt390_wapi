// Arquivo: download.js

const axios = require('axios');

// **SUBSTITUA ESTA URL pelo seu link de download direto do arquivo cursos.csv**
const CSV_DOWNLOAD_URL = 'https://sesisenaisp-my.sharepoint.com/:x:/r/personal/manutencao_390_sp_senai_br/Documents/Agenda/cursos.csv?download=1'; 

async function testCSVDownload() {
    console.log(`Tentando baixar o CSV da URL: ${CSV_DOWNLOAD_URL}`);
    
    try {
        // Usa axios.get para fazer a requisição HTTP.
        // responseType: 'arraybuffer' é usado para garantir que o conteúdo binário (ou texto)
        // seja tratado de forma bruta, sem problemas de codificação.
        const response = await axios.get(CSV_DOWNLOAD_URL, {
            responseType: 'arraybuffer' 
        });

        // Converte o buffer (dados binários) em uma string de texto usando UTF-8
        const csvContent = response.data.toString('utf-8');

        console.log('--- Download Concluído com Sucesso! ---');
        console.log(`Status HTTP: ${response.status}`);
        console.log(`Tamanho do Conteúdo (Bytes): ${response.data.length}`);
        console.log('\n--- Primeiras Linhas do Conteúdo CSV: ---\n');
        
        // Imprime apenas as 5 primeiras linhas para não poluir o console
        const lines = csvContent.split('\n');
        for (let i = 0; i < Math.min(5, lines.length); i++) {
            console.log(`[Linha ${i + 1}]: ${lines[i].trim()}`);
        }
        
        console.log('\n--------------------------------------');
        console.log('O download do CSV está funcionando. Agora você pode integrar a lógica de processamento.');

    } catch (error) {
        console.error('--- ERRO DURANTE O DOWNLOAD ---');
        
        // Trata erros de requisição (404, 401, timeout, etc.)
        if (error.response) {
            console.error(`Falha na Requisição HTTP! Status: ${error.response.status}`);
            console.error('Verifique se o link de download direto está correto e se as permissões de acesso estão OK (públicas ou configuradas para o servidor).');
        } else if (error.request) {
            console.error('Nenhuma resposta recebida. O servidor pode estar offline ou inacessível.');
        } else {
            console.error('Erro ao configurar a requisição:', error.message);
        }
        console.error('-------------------------------');
    }
}

testCSVDownload();