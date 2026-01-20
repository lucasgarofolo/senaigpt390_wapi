const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: 'sessionBot'
    }),
    puppeteer: {
        headless: true,
        executablePath: 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote'
        ]
    },
    // SOLUÇÃO TEMPORÁRIA DEVIDO AO markedUnread que estava dando problema! 20/01/2026
    webVersionCache: {
            type: 'remote',
            remotePath: `https://raw.githubusercontent.com/wppconnect-team/wa-version/refs/heads/main/html/2.3000.1031490220-alpha.html`,    
        },
});

// Dashboard Web - estado de conexão e QRCode
const app = express();
app.use(express.urlencoded({ extended: true }));

let lastQrDataUrl = null; // Data URL do QRCode atual
let connectionStatus = 'disconnected'; // 'disconnected' | 'qr' | 'authenticated' | 'ready'
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

// Gerenciamento de estado do usuário
const userStates = new Map();

// Mensagens globais
const mensagens = {
    boasvindas: "👋 Olá, como vai? \n\nEu sou GPT390, o *assistente virtual* do SENAI - Cruzeiro. \n",
    
    menu: "*Como posso te ajudar?* 🙋‍♂️\n \n*Escolha uma opção de 1 a 6* \n-----------------------------------\n1️⃣ - *Informações Gerais* \n2️⃣ - *Localização* \n3️⃣ - *Documentos de Matrículas*  \n4️⃣ - *Cursos Oferecidos* \n5️⃣ - *Boletos* \n6️⃣ - *Certificados* \n7️⃣ - *Atendimento com uma pessoa*",
    
    cursos: "📢 *Cursos com Matrículas Abertas!* \n \n0️⃣ **Voltar ao Menu Principal** 🔙\n1️⃣  *Ajustador Mecânico* 🔧\n2️⃣  *Comandos Elétricos* ⚡\n3️⃣  *CLP - Controladores Lógicos Programáveis* 💻\n4️⃣  *Eletricista Instalador* 💡\n5️⃣  *Excel* 📊\n6️⃣  *Ferramenteiro de Corte e Dobra* 🔩\n7️⃣  *Informática Básica* 🖥️\n8️⃣  *Inspetor de Qualidade* 🔎\n9️⃣  *Mecânico de Manutenção* ⚙️\n1️⃣0️⃣ *NR11 - Operador de Ponte Rolante* 🏗️\n1️⃣1️⃣ *NR11 - Operador de Empilhadeira* 🚜\n1️⃣2️⃣ *Operador de Centro de Usinagem CNC* ⚙️\n1️⃣3️⃣ *Operador de Máquina de Usinagem Convencional* 🏭\n1️⃣4️⃣ *Operador de Prensa Industrial* 🏗️\n1️⃣5️⃣ *Operador de Torno CNC* 🔄\n1️⃣6️⃣ *Programação de Robôs Articulados* 🤖\n1️⃣7️⃣ *Realidade Virtual* 🕶️\n1️⃣8️⃣ *Soldador ao Arco Elétrico e Oxigás* 🔥\n1️⃣9️⃣ *Cursos Gratuitos*     🎁 \n\n ✅ *Vagas limitadas!*  \n 📅 *Matrículas abertas por tempo limitado!*",    
    
    retorno:"Deseja ver a lista de cursos novamente ou voltar ao menu principal? \n \n1️⃣ - *Ver a lista de cursos* \n0️⃣ - *Retornar ao menu principal*",

    informacoesGerais: "🌟 *Informações Gerais da Escola* 🌟 \n\n 📅 *Horário de Funcionamento:* \n Segunda a Sexta: 08h00 às 20h00 \n Sábados: 09h00 às 11h00 \n **Exceto Domingos e Feriados** \n\n 📍 *Endereço:* \n Rua São Tomás, 01 - Jardim São José - Cruzeiro/SP \n\n 📞 *Telefone:* \n (12) 3141-1400 \n\n 🟢 *WhatsApp (atendimento realizado por um atendente - o tempo de resposta pode variar):* \n (12) 3141-1405 \n\n 🌐 *Redes Sociais e Site:* \n 🔗 Instagram: @senaicruzeiro \n 🔗 Facebook: fb.com/escolasenaicruzeiro \n 🔗 Site Oficial: https://sp.senai.br/unidade/cruzeiro/ \n\n Estamos à disposição para mais informações! 😊",
    
    localizacao: "📍 *SENAI - Cruzeiro*\n\n🗺️ *Endereço:*\nRua São Tomás, 01 - Jardim São José \nCruzeiro - SP, 12703-290\n\n Google Maps: https://maps.app.goo.gl/dWA2ufXcZdUQHFZz9 \n \n 📞 *Telefone:* (12) 3141-1400",
    
    documentos: "📋 *Documentos Necessários para Matrícula Presencial*\n\n✅ *Documentos pessoais:*\n• RG e CPF (cópias)\n• Comprovante de Escolaridade\n\n Informações a serem fornecidas: e-mail, telefone e endereço completo com CEP. \n\n📞 *Para mais informações, entre em contato conosco!*",
    
    atendimentoHumanizado: "👥 *Atendimento Humanizado*\n\nNossa equipe está pronta para te ajudar com todas as suas dúvidas sobre matrículas, cursos e informações gerais.\n\n📞 *WhatsApp (atendimento realizado por um atendente - o tempo de resposta pode variar):*\n https://wa.me/551231411405 \n\n⏰ *Horário de atendimento:*\nSegunda a Sexta: 8h às 17h\nSábado: 9h às 11h",
    
    certificados: "🎓 *Certificados*\n\nApós a conclusão do curso com aproveitamento mínimo de 70% e presença mínima de 75%, você receberá um certificado reconhecido pelo SENAI e válido em todo o território nacional.\n\n📋 *Para solicitar segunda via:*\n Compareça pessoalmente à nossa escola ou envie sua solicitação para o e-mail: *secretaria390@sp.senai.br* \n\n Inclua as seguintes informações: \n *- Nome completo* \n *- CPF* \n *- Nome do Curso*.",

    boletos: "Perdeu o seu boleto ou precisa da 2ª via? Sem problemas! \n \n Para emitir um novo boleto (enquanto ele estiver dentro do vencimento), é só acessar nosso Portal Financeiro. \n 💻 Acesse por aqui: https://www.sp.senai.br/boletos \n \n Se precisar de algo mais, é só chamar!"
};

// URLs dos cursos
const urlsCursos = {
    '1': 'https://www.sp.senai.br/cursos/0/0?regiao=3&cidadeint=cruzeiro&pesquisa=Ajustador&pag=1',
    '2': 'https://www.sp.senai.br/cursos/0/0?regiao=3&cidadeint=cruzeiro&pesquisa=Comandos&pag=1',
    '3': 'https://www.sp.senai.br/cursos/0/0?regiao=3&cidadeint=cruzeiro&pesquisa=Controladores&pag=1',
    '4': 'https://www.sp.senai.br/cursos/0/0?regiao=3&cidadeint=cruzeiro&pesquisa=Eletricista&pag=1',
    '5': 'https://www.sp.senai.br/cursos/0/0?regiao=3&cidadeint=cruzeiro&pesquisa=Excel&pag=1',
    '6': 'https://www.sp.senai.br/cursos/0/0?regiao=3&cidadeint=cruzeiro&pesquisa=Ferramenteiro&pag=1',
    '7': 'https://www.sp.senai.br/cursos/0/0?regiao=3&cidadeint=cruzeiro&pesquisa=inform%C3%A1tica&pag=1',
    '8': 'https://www.sp.senai.br/cursos/0/0?regiao=3&cidadeint=cruzeiro&pesquisa=inspetor&pag=1',
    '9': 'https://www.sp.senai.br/cursos/cursos-livres/0?regiao=3&cidadeint=cruzeiro&pesquisa=mec%C3%A2nico',
    '10': 'https://www.sp.senai.br/cursos/0/0?regiao=3&cidadeint=cruzeiro&pesquisa=ponte&pag=1',
    '11': 'https://www.sp.senai.br/cursos/0/0?regiao=3&cidadeint=cruzeiro&pesquisa=empilhadeira&pag=1',
    '12': 'https://www.sp.senai.br/cursos/0/0?regiao=3&cidadeint=cruzeiro&pesquisa=usinagem&pag=1',
    '13': 'https://www.sp.senai.br/cursos/0/0?regiao=3&cidadeint=cruzeiro&pesquisa=OPERADOR%20DE%20M%C3%81QUINAS%20DE%20USINAGEM%20CONVENCIONAIS&pag=1',
    '14': 'https://www.sp.senai.br/cursos/0/0?regiao=3&cidadeint=cruzeiro&pesquisa=prensa&pag=1',
    '15': 'https://www.sp.senai.br/cursos/0/0?regiao=3&cidadeint=cruzeiro&pesquisa=TORNO%20CNC&pag=1',
    '16': 'https://www.sp.senai.br/cursos/0/0?regiao=3&cidadeint=cruzeiro&pesquisa=Programa%C3%A7%C3%A3o&pag=1',
    '17': 'https://www.sp.senai.br/cursos/0/0?regiao=3&cidadeint=cruzeiro&pesquisa=realidade&pag=1',
    '18': 'https://www.sp.senai.br/cursos/0/0?regiao=3&cidadeint=cruzeiro&pesquisa=soldador&pag=1',
    '19': 'https://www.sp.senai.br/cursos/0/0?modalidade=3&cidadeint=cruzeiro'
};

// Nomes dos cursos
const nomesCursos = {
    '1': 'Ajustador Mecânico',
    '2': 'Comandos Elétricos',
    '3': 'CLP - Controladores Lógicos Programáveis',
    '4': 'Eletricista Instalador',
    '5': 'Excel',
    '6': 'Ferramenteiro de Corte e Dobra',
    '7': 'Informática Básica',
    '8': 'Inspetor de Qualidade',
    '9': 'Mecânico de Manutenção',
    '10': 'NR11 - Operador de Ponte Rolante',
    '11': 'NR11 - Operador de Empilhadeira',
    '12': 'Operador de Centro de Usinagem CNC',
    '13': 'Operador de Máquina de Usinagem Convencional',
    '14': 'Operador de Prensa Industrial',
    '15': 'Operador de Torno CNC',
    '16': 'Programação de Robôs Articulados',
    '17': 'Realidade Virtual',
    '18': 'Soldador ao Arco Elétrico e Oxigás',
    '19': 'Cursos Gratuitos'
};

// Função para obter ou criar estado do usuário
function getUserState(userId) {
    if (!userStates.has(userId)) {
        userStates.set(userId, {
            submenu: undefined,
            courseStep:undefined,
        });
    }
    return userStates.get(userId);
}

// Função para lidar com o menu principal
async function handleMainMenu(message, userState) {
    const option = message.body.trim();
    
    switch (option) {
        case '1': // Informações Gerais
            await message.reply(mensagens.informacoesGerais);
            break;
            
        case '2': // Localização
            await message.reply(mensagens.localizacao);
            break;
            
        case '3': // Documentos
            await message.reply(mensagens.documentos);
            break;
            
        case '4': // Cursos Oferecidos
            userState.submenu = 'courses';
            await message.reply(mensagens.cursos);
            break;
        
        case '5': // Boletos
            await message.reply(mensagens.boletos);
            break;    
            
        case '6': // Certificados
            await message.reply(mensagens.certificados);
            break;

        case '7': // Atendimento Humanizado
            await message.reply(mensagens.atendimentoHumanizado);
            break;
            
        default: // Qualquer outra mensagem
            await message.reply(mensagens.boasvindas + mensagens.menu);
            break;
    }
}

// Função para lidar com o submenu de cursos
async function handleSubmenuCourses(message, userState) {
    const option = message.body.trim();

    // Se o usuário ainda está escolhendo um curso
    if (userState.courseStep !== 'afterCourse') {

        if (option === '0') {
            userState.submenu = undefined;
            userState.courseStep = undefined;
            await message.reply(mensagens.menu);
            return;
        }

        // Opção válida de curso
        if (urlsCursos[option]) {
            const nomeCurso = nomesCursos[option];
            const urlCurso = urlsCursos[option];

            await message.reply(
                `🔗 *${nomeCurso}*\n\nVeja todas as informações sobre o curso através desse link:\n${urlCurso}`
            );

            await message.reply(mensagens.retorno);

            // Agora muda o estado
            userState.courseStep = 'afterCourse';
            return;
        }

        // Opção inválida
        await message.reply("❌ Opção inválida. Escolha um curso de 1 a 14 ou 0 para voltar.");
        await message.reply(mensagens.cursos);
        return;
    }

    // Após ver um curso
    if (userState.courseStep === 'afterCourse') {

        if (option === '0') {
            userState.submenu = undefined;
            userState.courseStep = undefined;
            await message.reply(mensagens.menu);
            return;
        }

        if (option === '1') {
            userState.courseStep = undefined;
            await message.reply(mensagens.cursos);
            return;
        }

        await message.reply("❌ Opção inválida. Digite 0 para voltar ao menu principal ou 1 para ver os cursos novamente.");
    }
}

// Função principal para processar mensagens
async function processMessage(message) {
    try {
        const userId = message.from;
        const userState = getUserState(userId);
        
        // Verificar se o usuário está em um submenu
        if (userState.submenu === 'courses') {
            await handleSubmenuCourses(message, userState);
        } else {
            await handleMainMenu(message, userState);
        }
        
    } catch (error) {
        console.error('Erro ao processar mensagem:', error);
        await message.reply("❌ Ocorreu um erro ao processar sua mensagem. Tente novamente.");
    }
}

client.on('ready', () => {
    connectionStatus = 'ready';
    lastQrDataUrl = null;
    reconnectAttempts = 0; // Reset contador de tentativas
    console.log('GPT390 está online e pronto para ajudar! 🚀');
});

client.on('authenticated', () => {
    connectionStatus = 'authenticated';
    reconnectAttempts = 0; // Reset contador de tentativas
    console.log('✅ WhatsApp autenticado com sucesso');
});

client.on('qr', async qr => {
    connectionStatus = 'qr';
    try {
        lastQrDataUrl = await QRCode.toDataURL(qr);
        console.log('📱 QR Code gerado, aguardando leitura...');
    } catch (e) {
        console.error('Falha ao gerar DataURL do QR:', e);
        lastQrDataUrl = null;
    }
});

client.on('disconnected', async (reason) => {
    console.log('❌ WhatsApp desconectado:', reason);
    connectionStatus = 'disconnected';
    lastQrDataUrl = null;
    
    // Tentar reconectar automaticamente
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++;
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000); // Backoff exponencial, max 30s
        
        console.log(`🔄 Tentativa de reconexão ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS} em ${delay/1000}s...`);
        
        setTimeout(async () => {
            try {
                await client.initialize();
            } catch (error) {
                console.error('❌ Falha na reconexão:', error);
            }
        }, delay);
    } else {
        console.error('❌ Máximo de tentativas de reconexão atingido. Reinicie o bot manualmente.');
    }
});

client.on('message', async message => {
    // Ignorar mensagens do próprio bot
    if (message.fromMe) return;
    
    console.log('📨 Nova mensagem recebida:', {
        from: message.from,
        body: message.body,
        timestamp: new Date().toISOString(),
        connectionStatus: connectionStatus
    });
    
    // Verificar se o cliente está pronto
    if (connectionStatus !== 'ready' && connectionStatus !== 'authenticated') {
        console.log('⚠️ Cliente não está pronto para processar mensagens. Status:', connectionStatus);
        return;
    }
    
    // Processar mensagem
    try {
        await processMessage(message);
        console.log('✅ Mensagem processada com sucesso');
    } catch (error) {
        console.error('❌ Erro ao processar mensagem:', error);
        
        // Verificar se é erro de contexto destruído
        if (error.message && error.message.includes('Execution context was destroyed')) {
            console.error('🔄 Contexto de execução destruído - tentando reconectar...');
            connectionStatus = 'disconnected';
            
            // Tentar reconectar
            try {
                await client.initialize();
            } catch (reconnectError) {
                console.error('❌ Falha na reconexão após erro de contexto:', reconnectError);
            }
            return;
        }
        
        // Para outros erros, tentar enviar mensagem de erro
        try {
            await message.reply("❌ Ocorreu um erro ao processar sua mensagem. Tente novamente.");
        } catch (replyError) {
            console.error('❌ Erro ao enviar mensagem de erro:', replyError);
        }
    }
});

// Logs detalhados do estado de carregamento e autenticação
client.on('loading_screen', (percent, message) => {
	console.log('⏳ Carregando WhatsApp Web:', percent, message);
});

client.on('change_state', (state) => {
	console.log('🔁 Estado do cliente:', state);
});

client.on('auth_failure', (message) => {
	console.error('❌ Falha de autenticação:', message);
});

// Função para inicializar o cliente com tratamento de erro
async function initializeClient() {
    try {
        await client.initialize();
    } catch (error) {
        console.error('❌ Erro na inicialização do cliente:', error);
        
        if (error.message && error.message.includes('Execution context was destroyed')) {
            console.log('🔄 Tentando reinicializar em 5 segundos...');
            setTimeout(() => {
                initializeClient();
            }, 5000);
        }
    }
}

// Inicializar cliente
initializeClient();

// Rotas do dashboard
app.get('/health', (req, res) => {
    return res.status(200).json({ status: 'ok' });
});

app.get('/', (req, res) => {
    const isConnected = connectionStatus === 'ready' || connectionStatus === 'authenticated';
    const user = client.info && client.info.pushname ? client.info.pushname : (client.info && client.info.wid ? client.info.wid._serialized : null);

    const html = `<!doctype html>
<html lang="pt-br">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Dashboard WhatsApp - GPT390</title>
<style>
  body { font-family: Arial, sans-serif; background: #0f172a; color: #e2e8f0; margin: 0; padding: 0; }
  .container { max-width: 720px; margin: 0 auto; padding: 24px; }
  .card { background: #111827; border: 1px solid #1f2937; border-radius: 12px; padding: 24px; }
  h1 { margin: 0 0 12px; font-size: 22px; }
  .status { margin: 12px 0 20px; }
  .status span { padding: 6px 10px; border-radius: 999px; font-size: 14px; }
  .ok { background: #065f46; color: #d1fae5; }
  .warn { background: #92400e; color: #ffedd5; }
  .qr { display: flex; justify-content: center; align-items: center; margin: 24px 0; }
  img { max-width: 320px; width: 100%; border-radius: 8px; background: #fff; padding: 8px; }
  .actions { display: flex; gap: 12px; }
  button { background: #2563eb; color: #fff; border: none; padding: 10px 16px; border-radius: 8px; cursor: pointer; }
  button.danger { background: #dc2626; }
  a { color: #93c5fd; }
  .footer { opacity: .6; margin-top: 16px; font-size: 12px; }
  /* Estado de preparo do QR */
  .qr-wait { display: flex; flex-direction: column; align-items: center; gap: 12px; margin: 24px 0; }
  .spinner { width: 36px; height: 36px; border: 3px solid rgba(255,255,255,.2); border-top-color: #60a5fa; border-radius: 50%; animation: spin 1s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
</style>
</head>
<body>
  <div class="container">
    <div class="card">
      <h1>Dashboard WhatsApp - GPT390</h1>
      <div class="status">
        <strong>Status:</strong> <span class="${isConnected ? 'ok' : 'warn'}">${isConnected ? 'Conectado' : (connectionStatus === 'qr' ? 'Aguardando leitura do QRCode' : 'Desconectado')}</span>
      </div>
      ${isConnected && user ? `<div><strong>Usuário:</strong> ${user}</div>` : ''}
      ${!isConnected ? (lastQrDataUrl ? `<div class="qr"><img src="${lastQrDataUrl}" alt="QRCode de conexão" /></div>` : `
        <div class="qr-wait">
          <div class="spinner"></div>
          <div>Preparando QR Code, por favor aguarde... <strong><span id="timer">0s</span></strong></div>
          <div class="footer">Assim que o QR estiver pronto, ele aparecerá aqui automaticamente.</div>
        </div>
      `) : ''}
      ${isConnected ? `
      <div class="actions"> 
        <form action="/logout" method="post" onsubmit="return confirm('Desconectar e limpar sessão?')"> 
          <button class="danger" type="submit">Desconectar e limpar sessão</button> 
        </form> 
      </div>` : ''}
      <div class="footer">Atualize a página para ver o status atual.</div>
    </div>
  </div>
  <script>
    (function(){
      var waiting = ${!isConnected && !lastQrDataUrl ? 'true' : 'false'};
      if (waiting) {
        var seconds = 0;
        var el = document.getElementById('timer');
        setInterval(function(){
          seconds += 1;
          if (el) { el.textContent = seconds + 's'; }
        }, 1000);
        // Atualiza a página periodicamente para exibir o QR assim que for gerado
        setInterval(function(){ location.reload(); }, 4000);
      }
    })();
  </script>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(html);
});

app.post('/flow/atualizar-cursos', async (req, res) => {

});

app.post('/logout', async (req, res) => {
    try {
        // Logout do WhatsApp
        try { await client.logout(); } catch (_) {}

        // Limpar pasta de sessão usada pelo LocalAuth
        const sessionDir = path.resolve(process.cwd(), 'sessionBot');
        try {
            await fs.promises.rm(sessionDir, { recursive: true, force: true });
        } catch (e) {
            console.warn('Falha ao remover sessão:', e?.message);
        }

        // Resetar estado do dashboard
        connectionStatus = 'disconnected';
        lastQrDataUrl = null;
        reconnectAttempts = 0; // Reset contador de tentativas

        // Re-inicializar cliente para gerar novo QR
        setTimeout(() => {
            initializeClient();
        }, 500);

        return res.redirect('/');
    } catch (error) {
        console.error('Erro no logout:', error);
        return res.status(500).send('Erro ao desconectar. Verifique os logs do servidor.');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Dashboard disponível em http://localhost:${PORT}`);
});