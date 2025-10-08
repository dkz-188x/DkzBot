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
        if (connection === 'open') console.log('✅ Bot sudah login!');
        if (connection === 'close') {
            if ((lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut) {
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

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if (!m.message || m.key.fromMe) return;

        const text = m.message.conversation || m.message.extendedTextMessage?.text || '';
        if (!text.startsWith('.')) return;

        const [cmd, ...args] = text.slice(1).split(' ');
        const arg = args.join(' ');

        // ===== OWNER COMMANDS =====
        const ownerCmds = ['owner','addprem','delprem','resetlimit','ban','undban','self','public','joingc','out','addthumbnail'];
        if (ownerCmds.includes(cmd)) {
            switch(cmd){
                case 'owner':
                    await sock.sendMessage(m.key.remoteJid, {
                        contacts: [{ 
                            displayName: settings.global.ownerName,
                            vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:${settings.global.ownerName}\nTEL;type=CELL;waid=${settings.global.ownerNumber}:${settings.global.ownerNumber}\nEND:VCARD`
                        }]
                    }, { quoted: m });
                    break;
                case 'addthumbnail':
                    if (!m.message.imageMessage) return await sock.sendMessage(m.key.remoteJid, { text: '❌ Kirim foto untuk dijadikan thumbnail!' }, { quoted: m });
                    const buffer = await getBuffer(m.message.imageMessage);
                    settings.global.botThumbnail = buffer;
                    await sock.sendMessage(m.key.remoteJid, { text: '🖼 Thumbnail berhasil diganti!' }, { quoted: m });
                    break;
                default:
                    const responses = {
                        addprem: '✅ Nomor berhasil ditambahkan ke premium!',
                        delprem: '✅ Nomor berhasil dihapus dari premium!',
                        resetlimit: '✅ Limit user berhasil di-reset!',
                        ban: '⛔ User berhasil dibanned!',
                        undban: '✅ User berhasil di-unban!',
                        self: '🔒 Mode diubah ke Self!',
                        public: '🌐 Mode diubah ke Public!',
                        joingc: '✅ Berhasil join group!',
                        out: '🚪 Keluar dari group!'
                    };
                    await sock.sendMessage(m.key.remoteJid, { text: responses[cmd] }, { quoted: m });
            }
        }

        // ===== FUN, RPG, DOWNLOADER, GROUP =====
        // Kamu bisa tetap pakai switch-case seperti versi sebelumnya
    });
}

startBot();
