const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const wwebVersion = '2.2412.54';

const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: 'fuyusession'
    }),
    puppeteer: { //headless: true,
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    },

    webVersionCache: {
    type: 'remote',
    remotePath: `https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/${wwebVersion}.html`,
    },
});

client.on('ready', () => {
    console.log('fuyu ojamashimasu..');
});

client.on('qr', qr => {
    qrcode.generate(qr, {small: true});
});

// Listening to all incoming messages
client.on('message_create', async (msg) => {
    if (msg.type === "audio") {
        const data = await msg.downloadMedia();
        client.sendMessage(msg.from, data, {
            sendAudioAsVoice: true,
        });
    }
});



client.initialize();
