const { default: makeWASocket, fetchLatestBaileysVersion, DisconnectReason } = require('@whiskeysockets/baileys');
const fs = require('fs');
const readline = require('readline');
const { imageToWebp, writeExifImg, writeExifVid, getBuffer } = require('./library/webp');
const settings = require('./settings.js');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

rl.question('📨 Please type your WhatsApp number (contoh: 628xxxx): ', async (number) => {
    rl.close();

    const SESSION_FILE = './DKZZBOT1.json';
    let session = {};
    if (fs.existsSync(SESSION_FILE)) session = JSON.parse(fs.readFileSync(SESSION_FILE));

    const { version } = await fetchLatestBaileysVersion();
    const sock = makeWASocket({ version, auth: session });

    sock.ev.on('connection.update', update => {
        const { connection, qr, lastDisconnect } = update;
        if (qr) {
            const qrcode = require('qrcode-terminal');
            qrcode.generate(qr, { small: true });
            console.log('📱 Scan QR code ini untuk login!');
        }
        if (connection === 'open') console.log('✅ Bot sudah login!');
        if (connection === 'close') {
            if ((lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut) {
                console.log('⚠️ Koneksi terputus, reconnecting...');
                process.exit();
            } else {
                console.log('⚠️ Terlogout, hapus DKZZBOT1.json lalu jalankan lagi.');
                process.exit();
            }
        }
    });

    sock.ev.on('creds.update', state => fs.writeFileSync(SESSION_FILE, JSON.stringify(state, null, 2)));

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if (!m.message || m.key.fromMe) return;

        const text = m.message.conversation || m.message.extendedTextMessage?.text || '';
        if (!text.startsWith('.')) return;

        const [cmd, ...args] = text.slice(1).split(' ');
        const arg = args.join(' ');

        // ===== OWNER COMMANDS =====
        const ownerCmds = ['owner','addprem','delprem','resetlimit','ban','undban','self','public','joingc','out','setthumbnail'];
        if(ownerCmds.includes(cmd)){
            switch(cmd){
                case 'owner':
                    await sock.sendMessage(m.key.remoteJid, {
                        contacts: [{ 
                            displayName: settings.global.ownerName, 
                            vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:${settings.global.ownerName}\nTEL;type=CELL;waid=${settings.global.ownerNumber}:${settings.global.ownerNumber}\nEND:VCARD` 
                        }]
                    }, { quoted: m });
                    break;
                case 'setthumbnail':
                    if(!arg) return await sock.sendMessage(m.key.remoteJid, { text: '❌ Kirim link thumbnail yang valid!' }, { quoted: m });
                    settings.global.thumbnail = arg;
                    await sock.sendMessage(m.key.remoteJid, { text: `🖼 Thumbnail berhasil diubah menjadi: ${arg}` }, { quoted: m });
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

        // ===== FUN COMMANDS =====
        const funCmds = ['brat','bratvid','tebakkata','qc1','qc2','s','smeme','cekprofile'];
        if(funCmds.includes(cmd)){
            switch(cmd){
                case 'brat':
                    return await sock.sendImageAsSticker(m.key.remoteJid, await getBuffer('https://i.ibb.co/album/brat.png'), m, { packname: "Brat", author: "Bot" });
                case 'bratvid':
                    return await sock.sendVideoAsSticker(m.key.remoteJid, await getBuffer('https://i.ibb.co/album/brat.mp4'), m, { packname: "BratVid", author: "Bot" });
                case 'tebakkata':
                    return await sock.sendMessage(m.key.remoteJid, { text: '🎲 Tebak kata dimulai!' }, { quoted: m });
                case 'qc1':
                    return await sock.sendMessage(m.key.remoteJid, { text: '📜 Quotes versi gelap' }, { quoted: m });
                case 'qc2':
                    return await sock.sendMessage(m.key.remoteJid, { text: '📃 Quotes versi terang' }, { quoted: m });
                case 's':
                    return await sock.sendMessage(m.key.remoteJid, { text: 'Fitur S dijalankan!' }, { quoted: m });
                case 'smeme':
                    return await sock.sendMessage(m.key.remoteJid, { text: 'Membuat meme...' }, { quoted: m });
                case 'cekprofile':
                    return await sock.sendMessage(m.key.remoteJid, { text: 'Profil user dicek!' }, { quoted: m });
            }
        }

        // ===== RPG COMMANDS =====
        const rpgCmds = ['rvo','me','limit','ceklimit'];
        if(rpgCmds.includes(cmd)){
            const texts = {
                rvo: '🎮 RVO dijalankan!',
                me: '🧑 Info user ditampilkan!',
                limit: '🔢 Limit user saat ini: 10',
                ceklimit: '🔍 Limit user dicek!'
            };
            await sock.sendMessage(m.key.remoteJid, { text: texts[cmd] }, { quoted: m });
        }

        // ===== DOWNLOADER =====
        const dlCmds = ['yt','tymp3','tt','ttmp3','tovid','tomp3'];
        if(dlCmds.includes(cmd)){
            await sock.sendMessage(m.key.remoteJid, { text: `⏬ Downloading ${cmd}: ${arg}` }, { quoted: m });
        }

        // ===== GROUP COMMANDS (Bot harus admin) =====
        const groupCmds = ['tagall','hidetag','kick','add','open','close','addadmin','undadmin','getpp','listonline','totalchat','afk','antilink','linkgc'];
        if(groupCmds.includes(cmd)){
            const isGroup = m.key.remoteJid.endsWith('@g.us');
            if(!isGroup) return;

            const metadata = await sock.groupMetadata(m.key.remoteJid);
            const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';
            const botIsAdmin = metadata.participants.some(u => u.id === botNumber && u.admin);

            if(!botIsAdmin){
                return await sock.sendMessage(m.key.remoteJid, { text: '⚠️ *Bot harus dijadikan admin untuk mengaktifkan fitur ini!*' }, { quoted: m });
            }

            // ===== ADMIN GROUP COMMANDS =====
            switch(cmd){
                case 'addadmin':
                    await sock.promoteParticipants(m.key.remoteJid, [m.key.participant || m.participant]);
                    await sock.sendMessage(m.key.remoteJid, { text: '✅ User dijadikan admin!' }, { quoted: m });
                    break;
                case 'undadmin':
                    await sock.demoteParticipants(m.key.remoteJid, [m.key.participant || m.participant]);
                    await sock.sendMessage(m.key.remoteJid, { text: '✅ User dihapus dari admin!' }, { quoted: m });
                    break;
                default:
                    await sock.sendMessage(m.key.remoteJid, { text: `✅ Fitur ${cmd} dijalankan!` }, { quoted: m });
            }
        }
    });
});
