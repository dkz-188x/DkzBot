const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason } = require('@whiskeysockets/baileys');
const fs = require('fs');
const settings = require('./settings.js');

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info_baileys');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: true // ✅ QR akan tampil di Termux
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) console.log('🔗 Scan QR di WhatsApp kamu!');
        if (connection === 'open') console.log('✅ Bot sudah login!');
        if (connection === 'close') {
            const reason = lastDisconnect?.error?.output?.statusCode;
            if (reason !== DisconnectReason.loggedOut) {
                console.log('⚠️ Koneksi terputus, restart bot...');
                startBot();
            } else {
                console.log('⚠️ Terlogout, hapus folder auth_info_baileys lalu jalankan lagi.');
            }
        }
    });

    sock.ev.on('creds.update', saveCreds);
}

startBot();
