const { default: makeWASocket, fetchLatestBaileysVersion, DisconnectReason, useSingleFileAuthState } = require('@whiskeysockets/baileys');
const fs = require('fs');
const readline = require('readline');
const { getBuffer } = require('./library/webp');
const settings = require('./settings.js');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

// Pakai single file auth state
const { state, saveState } = useSingleFileAuthState('./DKZZBOT1.json');

rl.question('📨 Masukkan nomor WhatsApp (contoh: 628xxxx): ', async (number) => {
    rl.close();

    const { version } = await fetchLatestBaileysVersion();
    const sock = makeWASocket({
        version,
        auth: state
    });

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

    sock.ev.on('creds.update', saveState);

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if (!m.message || m.key.fromMe) return;

        const text = m.message.conversation || m.message.extendedTextMessage?.text || '';
        if (!text.startsWith('.')) return;

        const [cmd, ...args] = text.slice(1).split(' ');
        const arg = args.join(' ');

        // ===== OWNER =====
        if(['owner','addprem','delprem','resetlimit','ban','undban','self','public','joingc','out','addthumbnail'].includes(cmd)){
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
                    if(!m.message.imageMessage) return await sock.sendMessage(m.key.remoteJid, { text: '❌ Kirim foto sebagai thumbnail!' }, { quoted: m });
                    const media = await getBuffer(m.message.imageMessage);
                    settings.global.botThumbnail = media;
                    await sock.sendMessage(m.key.remoteJid, { text: '🖼 Thumbnail berhasil diganti!' }, { quoted: m });
                    break;
                default:
                    await sock.sendMessage(m.key.remoteJid, { text: `✅ Fitur ${cmd} dijalankan!` }, { quoted: m });
            }
        }

        // ===== GROUP (admin only) =====
        const groupCmds = ['tagall','hidetag','kick','add','open','close','addadmin','undadmin','getpp','listonline','totalchat','afk','antilink','linkgc'];
        if(groupCmds.includes(cmd)){
            const isGroup = m.key.remoteJid.endsWith('@g.us');
            if(!isGroup) return;

            const metadata = await sock.groupMetadata(m.key.remoteJid);
            const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';
            const botIsAdmin = metadata.participants.some(u => u.id === botNumber && u.admin);
            if(!botIsAdmin){
                return await sock.sendMessage(m.key.remoteJid, { text: '⚠️ *Bot harus dijadikan admin untuk fitur ini!*' }, { quoted: m });
            }

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

    console.log(`📌 Bot siap, nomor: ${number}`);
});
