const { makeWASocket, useSingleFileAuthState, fetchLatestBaileysVersion, downloadContentFromMessage } = require('@whiskeysockets/baileys');
const fs = require('fs');
const readline = require('readline');
const { imageToWebp, writeExifImg, writeExifVid, getBuffer } = require('./library/webp');
const ConfigBaileys = require('./library/utils.js');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

// ===== Pairing Manual =====
rl.question('📨 Please type your WhatsApp number (contoh: 628xxxx): ', async (number) => {
    rl.close();
    const { state, saveState } = useSingleFileAuthState('./session.json');
    const { version } = await fetchLatestBaileysVersion();
    const sock = makeWASocket({ version, auth: state });

    sock.ev.on('connection.update', update => {
        const { connection, qr } = update;
        if (qr) {
            const qrcode = require('qrcode-terminal');
            qrcode.generate(qr, { small: true });
            console.log('📱 Scan QR code ini untuk login!');
        }
        if (connection === 'open') {
            console.log('✅ Bot sudah login!');
        }
    });

    sock.ev.on('creds.update', saveState);

    // ===== Command Handler =====
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if (!m.message || m.key.fromMe) return;

        const text = m.message.conversation || m.message.extendedTextMessage?.text || '';
        if (!text.startsWith('.')) return;
        const [cmd, ...args] = text.slice(1).split(' ');
        const arg = args.join(' ');

        // ===== OWNER =====
        if (['addprem','delprem','resetlimit','ban','undban','self','public','joingc','out','setthumbnail'].includes(cmd)) {
            const responses = {
                addprem: '✅ Nomor berhasil ditambahkan ke premium!',
                delprem: '✅ Nomor berhasil dihapus dari premium!',
                resetlimit: '✅ Limit user berhasil di-reset!',
                ban: '⛔ User berhasil dibanned!',
                undban: '✅ User berhasil di-unban!',
                self: '🔒 Mode diubah ke Self!',
                public: '🌐 Mode diubah ke Public!',
                joingc: '✅ Berhasil join group!',
                out: '🚪 Keluar dari group!',
                setthumbnail: '🖼 Thumbnail berhasil diubah!'
            };
            await sock.sendMessage(m.key.remoteJid, { text: responses[cmd] }, { quoted: m });
        }

        // ===== FUN =====
        if (['brat','bratvid','tebakkata','qc1','qc2','s','smeme','cekprofile'].includes(cmd)) {
            switch(cmd){
                case 'brat':
                    await sock.sendImageAsSticker(m.key.remoteJid, await getBuffer('https://i.ibb.co/album/brat.png'), m, { packname: "Brat", author: "Bot" });
                    break;
                case 'bratvid':
                    await sock.sendVideoAsSticker(m.key.remoteJid, await getBuffer('https://i.ibb.co/album/brat.mp4'), m, { packname: "BratVid", author: "Bot" });
                    break;
                default:
                    await sock.sendMessage(m.key.remoteJid, { text: `🎲 Fitur ${cmd} dijalankan!` }, { quoted: m });
            }
        }

        // ===== RPG =====
        if (['rvo','me','limit','ceklimit'].includes(cmd)) {
            await sock.sendMessage(m.key.remoteJid, { text: `🎮 Fitur ${cmd} dijalankan!` }, { quoted: m });
        }

        // ===== DOWNLOADER =====
        if (['yt','tymp3','tt','ttmp3','tovid','tomp3'].includes(cmd)) {
            await sock.sendMessage(m.key.remoteJid, { text: `⏬ Downloading ${cmd}: ${arg}` }, { quoted: m });
        }

        // ===== GROUP (Perlu Bot Jadi Admin) =====
        const groupCmds = ['tagall','hidetag','kick','add','open','close','getpp','listonline','totalchat','afk','antilink','linkgc'];
        if(groupCmds.includes(cmd)){
            const isGroup = m.key.remoteJid.endsWith('@g.us');
            if(!isGroup) return;
            
            const metadata = await sock.groupMetadata(m.key.remoteJid);
            const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';
            const botIsAdmin = metadata.participants.some(u => u.id === botNumber && u.admin);
            
            if(!botIsAdmin){
                return await sock.sendMessage(m.key.remoteJid, { text: '⚠️ *Bot harus dijadikan admin untuk mengaktifkan fitur ini!*' }, { quoted: m });
            }

            await sock.sendMessage(m.key.remoteJid, { text: `✅ Fitur ${cmd} dijalankan!` }, { quoted: m });
        }
    });
});
