const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const wwebVersion = '2.2412.54';
const adhan = require('adhan');
const { Coordinates, CalculationMethod, PrayerTimes } = require('adhan') ;
const moment = require ('moment-timezone');
let userRequests = {}; // Objek untuk melacak permintaan pengguna

let userConfirmed = {}; // Objek untuk melacak konfirmasi pengguna
const topicNames = {
    'satria/humi': 'Kelembaban',
    'satria/suhuc': 'Suhu',
    'satria/v': 'Tegangan',
    'satria/i': 'Arus',
    'satria/w': 'Daya',
    'satria/rssi': 'Rssi'
};
const topicUnits = {
    'satria/humi': '%',
    'satria/suhuc': '°C',
    'satria/v': 'V',
    'satria/i': 'A',
    'satria/w': 'W'

};
const currentDate = new Date();
const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
const formattedDate = currentDate.toLocaleDateString('id-ID', options);
const topicToPublish = 'satria/pesan'; // Ganti dengan nama topic yang ingin Anda publish
let messageToPublish = ''; // Ganti dengan pesan yang ingin Anda publish
let messagemqtt = {};
let pesanStatus = '';

const fs = require('fs');
const userConfirmedPath = './userConfirmed.json';

function saveConfirmedUsers() {
    fs.writeFileSync(userConfirmedPath, JSON.stringify(userConfirmed, null, 2), 'utf-8');
}

function loadConfirmedUsers() {
    if (fs.existsSync(userConfirmedPath)) {
        const data = fs.readFileSync(userConfirmedPath, 'utf-8');
        userConfirmed = JSON.parse(data);
    }
}

loadConfirmedUsers();

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
    const pesandarikakak = msg.body.toLowerCase();
    // Cek apakah pengguna sudah terkonfirmasi
    if (!userConfirmed[msg.from]) {
        // Jika belum, kirim pesan konfirmasi
        if (!userRequests[msg.from]) { // Pastikan belum ada permintaan yang sedang diproses
            userRequests[msg.from] = 'konfirmasi';
            await client.sendMessage(msg.from, 'nomermu akan aku ingat ');
            return; // Hentikan proses lebih lanjut sampai konfirmasi diterima
        } else if (pesandarikakak.includes('y') && userRequests[msg.from] === 'konfirmasi') {
            // Pengguna mengonfirmasi
            userConfirmed[msg.from] = true; // Tandai sebagai terkonfirmasi
            delete userRequests[msg.from]; // Bersihkan permintaan konfirmasi
            await client.sendMessage(msg.from, 'Terima kasih');
            saveConfirmedUsers(); // Simpan konfirmasi pengguna
            // Lanjutkan dengan logika lain jika diperlukan
            return;
        }
    }

    // Logika untuk menangani pesan berdasarkan permintaan pengguna
    if (pesandarikakak.includes('fuyu') && userConfirmed[msg.from]) {
        // Proses pesan jika pengguna sudah terkonfirmasi
        await msg.react('🥰');
        client.sendMessage(msg.from, 'iyaaa sayang..');
    }
    // Tambahkan logika lainnya di sini
    else if (pesandarikakak.includes('buko') && userConfirmed[msg.from]) {
        // Simpan permintaan pengguna di dalam objek userRequests
        userRequests[msg.from] = 'buka';
        await delay(3000);
        client.sendMessage(msg.from, 'sampean ndek endi😗');
    } else if (pesandarikakak.includes('sholat') && userConfirmed[msg.from]) {
        // Simpan permintaan pengguna di dalam objek userRequests
        userRequests[msg.from] = 'cihuy';
        await delay(3000);
        client.sendMessage(msg.from, 'lokasii..');
    } else if (msg.type == 'location' && userConfirmed[msg.from]) {
        const request = userRequests[msg.from]; // Periksa permintaan pengguna sebelumnya
        if (request === 'buka') {
            const coordinates = new Coordinates(msg.location.latitude, msg.location.longitude);
            const params = CalculationMethod.MoonsightingCommittee();
            const date = new Date();
            const prayerTimes = new PrayerTimes(coordinates, date, params);
            await client.sendMessage(msg.from, ' hari ini bukanya jam ' + prosesdatabuka(prayerTimes)+ ' mas');
            
            delete userRequests[msg.from];

        }else if (request === 'cihuy' && userConfirmed[msg.from]) {
            const coordinates = new Coordinates(msg.location.latitude, msg.location.longitude);
            const params = CalculationMethod.MoonsightingCommittee();
            const date = new Date();
            const prayerTimes = new PrayerTimes(coordinates, date, params);
            client.sendMessage(msg.from, prosesdatafull(prayerTimes));
            
            // Hapus permintaan dari objek setelah digunakan
            delete userRequests[msg.from];
        }

    } else if (pesandarikakak.includes('stiker') && userConfirmed[msg.from]) {
    const media = await msg.downloadMedia();
        client.sendMessage(msg.from, media, {
            sendMediaAsSticker: true,
            stickerAuthor: 'Fuyu',
            stickerName: 'Fuyu Sticker',
        })
    } else if (pesandarikakak.includes('👍') && userConfirmed[msg.from]) {
        const chat = await msg.getChat();
        // Simulasi mengetik
        chat.sendStateTyping();
        console.log('Mengetik...');
        await delay(5000);
        const media = MessageMedia.fromFilePath('C:\\Users\\satria\\Desktop\\Fuyu\\database\\image\\1.jpg');
        await client.sendMessage(msg.from, media, {
            sendMediaAsSticker: true,
            stickerAuthor: 'Fuyu',
            stickerName: 'Fuyu Sticker',
        });

    } else if (pesandarikakak.includes('cek') && userConfirmed[msg.from]) {
        msg.reply(messagemqtt.message)

    } else if (pesandarikakak.includes('saya') || pesandarikakak.includes('tak')) {
        const media = MessageMedia.fromFilePath('C:\\Users\\satria\\Desktop\\Fuyu\\database\\image\\2.jpg');
        await client.sendMessage(msg.from, media, {
            sendMediaAsSticker: true,
            stickerAuthor: 'Fuyu',
            stickerName: 'Fuyu Sticker',
        });

    // Inisialisasi status pesan


    } else if (pesandarikakak.includes('b1') && userConfirmed[msg.from]) {
        // Proses pesan jika pengguna sudah terkonfirmasi
        await msg.react('⚡');
            
        // Ubah pesan yang akan dipublish
        if (pesanStatus === '') {
            // Jika belum ada pesan yang ditentukan sebelumnya
            messageToPublish = '1000';
            client.sendMessage(msg.from, 'Beban 1 dinyalakan');
            pesanStatus = '1000'; // Update status pesan
        } else if (pesanStatus === '1000') {
            // Jika pesan sebelumnya sudah ditentukan dan statusnya adalah '1000'
            messageToPublish = '0000';
            client.sendMessage(msg.from, 'Beban 1 dimatikan');
            pesanStatus = '0000'; // Update status pesan
        } else {
            // Jika pesan sebelumnya sudah ditentukan dan statusnya adalah '0000'
            messageToPublish = '1000';
            client.sendMessage(msg.from, 'Beban 1 dinyalakan');
            pesanStatus = '1000'; // Update status pesan
        }

        // Mengonversi pesan menjadi bentuk biner
        console.log('Message to publish:', messageToPublish);
        
        clientmqtt.publish(topicToPublish, messageToPublish, (err) => {
            if (err) {
                console.error('Error publishing message:', err);
            } else {
                console.log('Message published successfully to topic:', topicToPublish);
            }
        });
 
        } else if (pesandarikakak.includes('b2') && userConfirmed[msg.from]) {
        // Proses pesan jika pengguna sudah terkonfirmasi
        await msg.react('⚡');
            
        // Ubah pesan yang akan dipublish
        if (pesanStatus === '') {
            // Jika belum ada pesan yang ditentukan sebelumnya
            messageToPublish = '0100';
            client.sendMessage(msg.from, 'Beban 2 dinyalakan');
            pesanStatus = '0100'; // Update status pesan
        } else if (pesanStatus === '0100') {
            // Jika pesan sebelumnya sudah ditentukan dan statusnya adalah '1000'
            messageToPublish = '0000';
            client.sendMessage(msg.from, 'Beban 2 dimatikan');
            pesanStatus = '0000'; // Update status pesan
        } else {
            // Jika pesan sebelumnya sudah ditentukan dan statusnya adalah '0000'
            messageToPublish = '0100';
            client.sendMessage(msg.from, 'Beban 2 dinyalakan');
            pesanStatus = '0100'; // Update status pesan
        }

        // Mengonversi pesan menjadi bentuk biner
        console.log('Message to publish:', messageToPublish);
        
        clientmqtt.publish(topicToPublish, messageToPublish, (err) => {
            if (err) {
                console.error('Error publishing message:', err);
            } else {
                console.log('Message published successfully to topic:', topicToPublish);
            }
        });
    } else if (pesandarikakak.includes('b3') && userConfirmed[msg.from]) {
        // Proses pesan jika pengguna sudah terkonfirmasi
        await msg.react('⚡');
            
        // Ubah pesan yang akan dipublish
        if (pesanStatus === '') {
            // Jika belum ada pesan yang ditentukan sebelumnya
            messageToPublish = '0010';
            client.sendMessage(msg.from, 'Beban 3 dinyalakan');
            pesanStatus = '0010'; // Update status pesan
        } else if (pesanStatus === '0010') {
            // Jika pesan sebelumnya sudah ditentukan dan statusnya adalah '1000'
            messageToPublish = '0000';
            client.sendMessage(msg.from, 'Beban 3 dimatikan');
            pesanStatus = '0000'; // Update status pesan
        } else {
            // Jika pesan sebelumnya sudah ditentukan dan statusnya adalah '0000'
            messageToPublish = '0010';
            client.sendMessage(msg.from, 'Beban 3 dinyalakan');
            pesanStatus = '0010'; // Update status pesan
        }

        // Mengonversi pesan menjadi bentuk biner
        console.log('Message to publish:', messageToPublish);
        
        clientmqtt.publish(topicToPublish, messageToPublish, (err) => {
            if (err) {
                console.error('Error publishing message:', err);
            } else {
                console.log('Message published successfully to topic:', topicToPublish);
            }
        });
    } else if (pesandarikakak.includes('b4') && userConfirmed[msg.from]) {
        // Proses pesan jika pengguna sudah terkonfirmasi
        await msg.react('⚡');
            
        // Ubah pesan yang akan dipublish
        if (pesanStatus === '') {
            // Jika belum ada pesan yang ditentukan sebelumnya
            messageToPublish = '0001';
            client.sendMessage(msg.from, 'Beban 4 dinyalakan');
            pesanStatus = '0001'; // Update status pesan
        } else if (pesanStatus === '0001') {
            // Jika pesan sebelumnya sudah ditentukan dan statusnya adalah '1000'
            messageToPublish = '0000';
            client.sendMessage(msg.from, 'Beban 4 dimatikan');
            pesanStatus = '0000'; // Update status pesan
        } else {
            // Jika pesan sebelumnya sudah ditentukan dan statusnya adalah '0000'
            messageToPublish = '0001';
            client.sendMessage(msg.from, 'Beban 4 dinyalakan');
            pesanStatus = '0001'; // Update status pesan
        }

        // Mengonversi pesan menjadi bentuk biner
        console.log('Message to publish:', messageToPublish);
        
        clientmqtt.publish(topicToPublish, messageToPublish, (err) => {
            if (err) {
                console.error('Error publishing message:', err);
            } else {
                console.log('Message published successfully to topic:', topicToPublish);
            }
        });

    } else if (pesandarikakak.includes('rl')) {
    let statusMessage = "> *Status dan Informasi Beban*\n";

    // Menambahkan tanggal dan waktu ke pesan
    statusMessage += `> *${formattedDate}*\n`;

    // Menambahkan garis sebagai pemisah
    statusMessage += "> *---*\n";

    // Mendefinisikan status beban
    const statusBeban = {
        "Beban 1": (messageToPublish === '1000') ? "ON" : "OFF",
        "Beban 2": (messageToPublish === '0100') ? "ON" : "OFF", // Ganti pesanStatusBeban2 dengan variabel yang menyimpan status Beban 2
        "Beban 3": (messageToPublish === '0010') ? "ON" : "OFF", // Ganti pesanStatusBeban3 dengan variabel yang menyimpan status Beban 3
        "Beban 4": (messageToPublish === '0001') ? "ON" : "OFF"  // Ganti pesanStatusBeban4 dengan variabel yang menyimpan status Beban 4
    };

    // Menambahkan informasi beban
    const beban = ["Beban 1", "Beban 2", "Beban 3", "Beban 4"];
    beban.forEach((item, index) => {
        statusMessage += `> \`${item}: ${statusBeban[item]}\`\n`;
    });

    // Mengirim pesan
    client.sendMessage(msg.from, statusMessage);
    msg.react('⚡');


    

       
// }else if (msg && userConfirmed[msg.from]) { ngecek tipe pesan
    //     await console.log(msg);
    } else if (msg.type =='ptt' && userConfirmed[msg.from]) { 
        const audio = await msg.downloadMedia();
        const fs = require('fs');
        const path = require('path');

        // Mengonversi data audio dari base64 ke Buffer
        const audioBuffer = Buffer.from(audio.data, 'base64');

        // Menyimpan audio ke dalam file
        const filePath = path.join('C:', 'Users', 'satria', 'Desktop', 'Fuyu', 'database', 'sound', 'audio_temp.opus');
        fs.writeFileSync(filePath, audioBuffer);

        //console.log('Audio tersimpan dengan sukses.');
        const { spawn } = require('child_process');

        const pythonProcess = spawn('python', ['suara.py']);

        pythonProcess.stdout.on('data', (data) => {
        console.log(`Output: ${data}`);
        });

        pythonProcess.stderr.on('data', (data) => {
        console.error(`Error: ${data}`);
        });

        pythonProcess.on('close', (code) => {
        // console.log(`Python script exited with code ${code}`);
        });

    } else if (pesandarikakak.includes('cal')) {
            const {spawn} = require ('child_process');
            const childPython = spawn ('python', ['autocal.py']);
    
    // } else if (msg) {
    //     console.log(msg);
    } else if (pesandarikakak.includes('rep')) { 
        let combinedMessage = `> *Laporan Data*\n`;
        
        // Menambahkan tanggal dan waktu ke pesan
        combinedMessage += `> *${formattedDate}*\n`;
        
        // Menambahkan garis sebagai pemisah
        combinedMessage += "> *---*\n";
        
        // Menentukan urutan topik yang diinginkan
        const desiredOrder = ['satria/humi', 'satria/suhuc', 'satria/v', 'satria/i', 'satria/w', 'satria/rssi'];
        
        // Menggabungkan pesan dari setiap topik ke dalam satu pesan dengan nama topik dan satuan yang disesuaikan
        desiredOrder.forEach(topic => {
            const topicName = topicNames[topic] || topic;
            let valueFormatted = parseFloat(messagemqtt[topic]); // Memformat nilai dengan dua angka desimal
            
            // Menambahkan pengecualian untuk topik Rssi agar nilai negatif tetap terformat dengan benar
            if (topic === 'satria/rssi') {
                valueFormatted = parseInt(messagemqtt[topic]); // Konversi nilai ke integer agar tanda titik tidak muncul
            } else {
                valueFormatted = parseFloat(messagemqtt[topic]).toFixed(2); // Memformat nilai dengan dua angka desimal
            }
            
            const topicUnit = topicUnits[topic] || '';
            // Menghapus spasi di belakang nilai Rssi sebelum menambahkan ke pesan
            if (topic === 'satria/rssi') {
                combinedMessage += `> \`${topicName}: ${valueFormatted}${topicUnit}\`\n`;
            } else {
                combinedMessage += `> \`${topicName}: ${valueFormatted} ${topicUnit}\`\n`;
            }
        });
        await msg.react('📋');
        client.sendMessage(msg.from, combinedMessage);
    }




      

});


client.initialize();



//mqtt
const mqtt = require('mqtt');
const { ChildProcess } = require('child_process');
const { Console } = require('console');
const clientmqtt = mqtt.connect('mqtt://broker.hivemq.com:1883');
clientmqtt.on('connect', () => {
	console.log('connected')
	  // Lakukan subscribe pada topik
    clientmqtt.subscribe(topic, (err) => {
    if (err) {
      console.error('Error subscribing:', err);
    } else {
      console.log('oke');
    }
  });
})

clientmqtt.on('disconnect', () => {
	console.log('disconnected')
})

clientmqtt.on('offline', () => {
	console.log('offline')
})

clientmqtt.on('reconnect', () => {
    console.log('recondekkk')
})
let isOkePrinted = false;
const topic = ['satria/humi', 'satria/suhuc', 'satria/v', 'satria/i', 'satria/w', 'satria/rssi'];
clientmqtt.on('message', (receivedTopic, message) => {
    messagemqtt[receivedTopic] = message.toString();
    if (receivedTopic === 'satria/i') {
        // Mengambil nilai dari 'satria/i'
        const nilaiSatriaI = parseFloat(messagemqtt['satria/i']);
        const nilaiSatriaV = parseFloat(messagemqtt['satria/v']);
        console.log('Nilai satria/i:', nilaiSatriaI);
        console.log(messageToPublish);
        if (nilaiSatriaI === 0 && messageToPublish === '1000' && !isOkePrinted && nilaiSatriaV === 0) {
            // Eksekusi tambahan di sini
        

            const {spawn} = require ('child_process');
            const childPython = spawn ('python', ['autocal.py']);
            isOkePrinted = true; // Menandai bahwa pesan "oke" sudah dicetak
        }
    }

    // Reset isOkePrinted jika messageToPublish sama dengan "0000"
    if (messageToPublish === '0000') {
        isOkePrinted = false;
    }

    // if (receivedTopic === 'satria/i' && messagemqtt[receivedTopic] === '0') {
    //     // Memeriksa apakah nilai pesan yang ingin dipublish adalah '1000'
    //     if (messageToPublish === '1000') {
    //         console.log('oke');
    //     }
    // }
        // Lakukan apa pun yang perlu dilakukan dengan data di sini
    // }
    // if (parseFloat(messagemqtt.message)>30 && !isDangerous) {
    // const {spawn} = require ('child_process');
    // const childPython = spawn ('python', ['autocal.py']);}
    //     isDangerous = true;
    // } else if (parseFloat(messagemqtt.message) <= 30 && isDangerous) { // Jika suhu kembali ke nilai nominal dan kondisi bahaya telah terdeteksi
    //     isDangerous = false; // Set kondisi bahaya kembali ke false
    // }
    
    

});



function prosesdatafull(data){
    return `waktu sholat hari ini\n\nsubuh  : ${prosestime(data.fajr)}\ndzuhur : ${prosestime(data.dhuhr)}\nasr        : ${prosestime(data.asr)}\nmagrib : ${prosestime(data.maghrib)}\nisha      : ${prosestime(data.isha)}`
}
function prosesdatabuka(data){
    return `${prosestime(data.maghrib)}`
}

function prosestime(time) {
    return moment(time)
    .tz('Asia/Jakarta')
    .format('HH:mm') //+ ' WIB'
}
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
