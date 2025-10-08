const { default: makeWASocket, fetchLatestBaileysVersion, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const fs = require('fs');
const { getBuffer } = require('./library/webp');
const settings = require('./settings.js');

async function startBot() {
    // Gunakan multi-file auth state
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info_baileys');

    const { version } = await fetchLatestBaileysVersion();
    const sock = makeWASocket({ version, auth: state });

    // Connection update
    sock.ev.on('connection.update', update => {
        const { connection, lastDisconnect } = update;
        if(connection === 'open') console.log('✅ Bot sudah login!');
        if(connection === 'close'){
            if ((lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut){
                console.log('⚠️ Koneksi terputus, reconnecting...');
                process.exit();
            } else {
                console.log('⚠️ Terlogout, hapus folder auth_info_baileys lalu jalankan lagi.');
                process.exit();
            }
        }
    });

    // Simpan kredensial otomatis
    sock.ev.on('creds.update', saveCreds);

    // Contoh command simple
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if (!m.message || m.key.fromMe) return;
        const text = m.message.conversation || m.message.extendedTextMessage?.text || '';
        if (!text.startsWith('.')) return;

        const [cmd, ...args] = text.slice(1).split(' ');
        const arg = args.join(' ');

        if(cmd === 'menu'){
            await sock.sendMessage(m.key.remoteJid, { text: '📌 Daftar menu bot akan muncul disini...' });
        }
    });
}

startBot();
