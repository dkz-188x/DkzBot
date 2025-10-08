const { default: makeWASocket, fetchLatestBaileysVersion, DisconnectReason } = require('@whiskeysockets/baileys');
const fs = require('fs');
const readline = require('readline');
const { getBuffer } = require('./library/webp');
const settings = require('./settings.js');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

rl.question('📨 Masukkan kode pairing (DKZZBOT1): ', async (code) => {
    rl.close();

    // File session sesuai kode pairing
    const SESSION_FILE = './DKZZBOT1.json';
    let session = {};
    if (fs.existsSync(SESSION_FILE)) session = JSON.parse(fs.readFileSync(SESSION_FILE));

    const { version } = await fetchLatestBaileysVersion();
    const sock = makeWASocket({ version, auth: session });

    // Connection update
    sock.ev.on('connection.update', update => {
        const { connection, lastDisconnect } = update;
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

    // Simpan session
    sock.ev.on('creds.update', state => fs.writeFileSync(SESSION_FILE, JSON.stringify(state, null, 2)));

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if (!m.message || m.key.fromMe) return;

        const text = m.message.conversation || m.message.extendedTextMessage?.text || '';
        if (!text.startsWith('.')) return;

        const [cmd, ...args] = text.slice(1).split(' ');
        const arg = args.join(' ');

        // ===== OWNER =====
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

        // ===== FUN =====
        const funCmds = ['brat','bratvid','tebakkata','qc1','qc2','s','smeme','cekprofile'];
        if (funCmds.includes(cmd)) {
            switch(cmd){
                case 'brat':
                    await sock.sendImageAsSticker(m.key.remoteJid, await getBuffer('https://i.ibb.co/album/brat.png'), m, { packname: "Brat", author: "Bot" });
                    break;
                case 'bratvid':
                    await sock.sendVideoAsSticker(m.key.remoteJid, await getBuffer('https://i.ibb.co/album/brat.mp4'), m, { packname: "BratVid", author: "Bot" });
                    break;
                default:
                    await sock.sendMessage(m.key.remoteJid, { text: `Fitur ${cmd} dijalankan!` }, { quoted: m });
            }
        }

        // ===== RPG =====
        const rpgCmds = ['rvo','me','limit','ceklimit'];
        if(rpgCmds.includes(cmd)) await sock.sendMessage(m.key.remoteJid, { text: `Fitur ${cmd} dijalankan!` }, { quoted: m });

        // ===== DOWNLOADER =====
        const dlCmds = ['yt','tymp3','tt','ttmp3','tovid','tomp3'];
        if(dlCmds.includes(cmd)) await sock.sendMessage(m.key.remoteJid, { text: `⏬ Downloading ${cmd}: ${arg}` }, { quoted: m });

        // ===== GROUP =====
        const groupCmds = ['tagall','hidetag','kick','add','open','close','addadmin','undadmin','getpp','listonline','totalchat','afk','antilink','linkgc'];
        if(groupCmds.includes(cmd)) {
            const isGroup = m.key.remoteJid.endsWith('@g.us');
            if(!isGroup) return;

            const metadata = await sock.groupMetadata(m.key.remoteJid);
            const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';
            const botIsAdmin = metadata.participants.some(u => u.id === botNumber && u.admin);
            if(!botIsAdmin) return await sock.sendMessage(m.key.remoteJid, { text: '⚠️ Bot harus dijadikan admin!' }, { quoted: m });

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
                    await sock.sendMessage(m.key.remoteJid, { text: `Fitur ${cmd} dijalankan!` }, { quoted: m });
            }
        }
    });
});
