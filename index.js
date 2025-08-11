const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: 'session'
    })
});

// Gerenciamento de estado do usuário
const userStates = new Map();

// Mensagens globais
const mensagens = {
    boasvindas: "👋 Olá, como vai? \n\nEu sou GPT390, o *assistente virtual* do SENAI - Cruzeiro. \n",
    
    menu: "*Como posso te ajudar?* 🙋‍♂️\n \n*Escolha uma opção de 1 a 6* \n-----------------------------------\n1️⃣ - *Informações Gerais* \n2️⃣ - *Localização* \n3️⃣ - *Cursos Oferecidos*  \n4️⃣ - *Documentos de Matrícula* \n5️⃣ - *Atendimento humanizado* \n6️⃣ - *Certificados* \n",
    
    cursos: "📢 *Cursos com Matrículas Abertas!* 📢 \nConfira as áreas disponíveis e escolha a que mais combina com você: \n \n0️⃣ **Voltar ao Menu Principal** 🔙\n1️⃣ *Comandos Elétricos* ⚡\n2️⃣ *Ajustador Mecânico* 🔧\n3️⃣ *CLP - Controladores Lógicos Programáveis* 🖥️\n4️⃣ *Eletricista Instalador* 💡\n5️⃣ *Ferramenteiraria* 🔩\n6️⃣ *Informática Básica* 🖥️\n7️⃣ *Inspetor de Qualidade*  📊\n8️⃣ *NR11 - Operador de Ponte Rolante* 🏗️\n9️⃣ *NR11 - Operador de Empilhadeira* 🚜\n🔟 *Operador de Centro de Usinagem CNC* ⚙️\n1️⃣1️⃣ *Operador de Torno CNC* 🔄\n1️⃣2️⃣ *Máquinas de Usinagem Convencional* 🏭\n1️⃣3️⃣ *Prensa Industrial* 🏗️\n1️⃣4️⃣ *Soldador ao Arco Elétrico e Oxigás* 🔥 \n\n ✅ *Vagas limitadas!*  \n 📅 *Matrículas abertas por tempo limitado!*",
    
    informacoesGerais: "🌟 *Informações Gerais da Escola* 🌟 \n\n 📅 *Horário de Funcionamento:* \n Segunda a Sexta: 08h00 às 20h00 \n Sábados: 08h00 às 12h00 \n\n 📍 *Endereço:* \n Rua São Tomás, 01 - Jardim São José - Cruzeiro/SP \n\n 📞 *Telefone:* \n (12) 3141-1400 \n\n 🟢 *WhatsApp (atendimento humano, pode demorar um pouco mais):* \n (12) 99653-2560 \n\n 🌐 *Redes Sociais e Site:* \n 🔗 Instagram: @senaicruzeiro \n 🔗 Facebook: fb.com/escolasenaicruzeiro \n 🔗 Site Oficial: https://sp.senai.br/unidade/cruzeiro/ \n\n Estamos à disposição para mais informações! 😊",
    
    localizacao: "📍 *SENAI - Cruzeiro*\n\n🗺️ *Endereço:*\nAv. Major Novaes, 1000 - Centro\nCruzeiro - SP, 12700-000\n\n📞 *Telefone:* (12) 99653-2560",
    
    documentos: "📋 *Documentos Necessários para Matrícula*\n\n✅ *Documentos pessoais:*\n• RG e CPF (cópias)\n• Comprovante de residência\n• 2 fotos 3x4\n\n✅ *Documentos escolares:*\n• Histórico escolar\n• Certificado de conclusão\n\n✅ *Documentos adicionais:*\n• Comprovante de renda familiar\n• Termo de responsabilidade (menores de idade)\n\n📞 *Para mais informações, entre em contato conosco!*",
    
    atendimentoHumanizado: "👥 *Atendimento Humanizado*\n\nNossa equipe está pronta para te ajudar com todas as suas dúvidas sobre matrículas, cursos e informações gerais.\n\n📞 *Entre em contato:*\n+55 12 99653-2560\n\n⏰ *Horário de atendimento:*\nSegunda a Sexta: 8h às 17h\nSábado: 8h às 12h",
    
    certificados: "🎓 *Certificados*\n\nApós a conclusão do curso com aproveitamento mínimo de 70% e presença mínima de 75%, você receberá um certificado reconhecido pelo SENAI e válido em todo o território nacional.\n\n📋 *Para solicitar segunda via:*\n*Compareça à nossa escola!* \n\n⏰ *Horário de atendimento:*\nSegunda a Sexta: 8h às 17h\nSábado: 8h às 12h"
};

// URLs dos cursos
const urlsCursos = {
    '1': 'https://sp.senai.br/cursos/0/0?unidade=390&pesquisa=Comandos&pag=1',
    '2': 'https://sp.senai.br/cursos/0/0?unidade=390&pesquisa=Ajustador%20&pag=1',
    '3': 'https://sp.senai.br/cursos/0/0?unidade=390&pesquisa=Controladores&pag=1',
    '4': 'https://sp.senai.br/cursos/0/0?unidade=390&pesquisa=Eletricista&pag=1',
    '5': 'https://sp.senai.br/cursos/0/0?unidade=390&pesquisa=Ferramenteiro%20de%20corte&pag=1',
    '6': 'https://sp.senai.br/cursos/0/0?unidade=390&pesquisa=INFORM%C3%81TICA&pag=1',
    '7': 'https://sp.senai.br/cursos/0/0?unidade=390&pesquisa=iNSPETOR%20DE%20QUALIDADE&pag=1',
    '8': 'https://sp.senai.br/cursos/0/0?unidade=390&pesquisa=PONTE&pag=1',
    '9': 'https://sp.senai.br/cursos/0/0?unidade=390&pesquisa=EMPILHADEIRA&pag=1',
    '10': 'https://sp.senai.br/cursos/0/0?unidade=390&pesquisa=CENTRO%20DE%20USINAGEM&pag=1',
    '11': 'https://sp.senai.br/cursos/0/0?unidade=390&pesquisa=TORNO%20CNC&pag=1',
    '12': 'https://sp.senai.br/cursos/0/0?unidade=390&pesquisa=OPERADOR%20DE%20M%C3%81QUINAS%20DE%20USINAGEM%20CONVENCIONAIS&pag=1',
    '13': 'https://sp.senai.br/cursos/0/0?unidade=390&pesquisa=PRENSA&pag=1',
    '14': 'https://sp.senai.br/cursos/0/0?unidade=390&pesquisa=SOLDADOR&pag=1'
};

// Nomes dos cursos
const nomesCursos = {
    '1': 'Comandos Elétricos',
    '2': 'Ajustador Mecânico',
    '3': 'CLP - Controladores Lógicos Programáveis',
    '4': 'Eletricista Instalador',
    '5': 'Ferramenteiraria',
    '6': 'Informática Básica',
    '7': 'Inspetor de Qualidade',
    '8': 'NR11 - Operador de Ponte Rolante',
    '9': 'NR11 - Operador de Empilhadeira',
    '10': 'Operador de Centro de Usinagem CNC',
    '11': 'Operador de Torno CNC',
    '12': 'Máquinas de Usinagem Convencional',
    '13': 'Prensa Industrial',
    '14': 'Soldador ao Arco Elétrico e Oxigás'
};

// Função para obter ou criar estado do usuário
function getUserState(userId) {
    if (!userStates.has(userId)) {
        userStates.set(userId, {
            submenu: undefined
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
            await new Promise(resolve => setTimeout(resolve, 5000));
            await message.reply(mensagens.menu);
            break;
            
        case '2': // Localização
            await message.reply(mensagens.localizacao);
            await new Promise(resolve => setTimeout(resolve, 5000));
            await message.reply(mensagens.menu);
            break;
            
        case '3': // Cursos Oferecidos
            userState.submenu = 'courses';
            await message.reply(mensagens.cursos);
            break;
            
        case '4': // Documentos
            await message.reply(mensagens.documentos);
            await new Promise(resolve => setTimeout(resolve, 5000));
            await message.reply(mensagens.menu);
            break;
            
        case '5': // Atendimento Humanizado
            // Enviar VCard
            const vcard = `BEGIN:VCARD
VERSION:3.0
FN:SENAI Cruzeiro - Atendimento Humanizado
TEL:+551231411405
END:VCARD`;
            await message.reply(vcard);
            await new Promise(resolve => setTimeout(resolve, 5000));
            await message.reply(mensagens.menu);
            break;
            
        case '6': // Certificados
            await message.reply(mensagens.certificados);
            await new Promise(resolve => setTimeout(resolve, 5000));
            await message.reply(mensagens.menu);
            break;
            
        default: // Qualquer outra mensagem
            await message.reply(mensagens.boasvindas + mensagens.menu);
            break;
    }
}

// Função para lidar com o submenu de cursos
async function handleSubmenuCourses(message, userState) {
    const option = message.body.trim();
    
    if (option === '0') { // Voltar ao menu principal
        userState.submenu = undefined;
        await message.reply(mensagens.menu);
        return;
    }
    
    // Verificar se é uma opção válida de curso (1-14)
    if (urlsCursos[option]) {
        const nomeCurso = nomesCursos[option];
        const urlCurso = urlsCursos[option];
        
        // Enviar LinkPreview
        await message.reply(`🔗 *${nomeCurso}*\n\nVeja todas as informações sobre o curso através desse link:\n${urlCurso}`);
        
        // Reenviar menu de cursos
        await new Promise(resolve => setTimeout(resolve, 5000));
        await message.reply(mensagens.cursos);
    } else {
        // Opção inválida - limpar estado e voltar ao menu principal
        userState.submenu = undefined;
        await message.reply("❌ Opção inválida. Retornando ao menu principal.");
        await new Promise(resolve => setTimeout(resolve, 5000));
        await message.reply(mensagens.menu);
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
    console.log('GPT390 está online e pronto para ajudar! 🚀');
});

client.on('qr', qr => {
    qrcode.generate(qr, {small: true});
});

client.on('message', async message => {
    // Ignorar mensagens do próprio bot
    if (message.fromMe) return;
    
    // Processar mensagem
    await processMessage(message);
});

client.initialize();