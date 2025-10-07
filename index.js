// index.js
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const client = new Client({ authStrategy: new LocalAuth() });

client.on('qr', qr => qrcode.generate(qr, { small: true }));
client.on('ready', () => console.log('Bot ready ✅'));

// ---------------- In-memory DB ----------------
const userXP = {};
const premium = new Set();
const banned = new Set();
// --------------------------------------------

// owner number
const ownerNumber = '6283119404224@s.whatsapp.net';

// delay helper
const delay = ms => new Promise(res => setTimeout(res, ms));

// check admin in group
async function isAdmin(chatId, userId) {
    try {
        const chat = await client.getChatById(chatId);
        if(!chat.isGroup) return false;
        const participant = chat.participants.find(p => p.id._serialized === userId);
        return !!participant && (participant.isAdmin || participant.isSuperAdmin);
    } catch {
        return false;
    }
}

// send with 2s delay
async function replyWithProcessing(msg, processingText, sendAfter) {
    await msg.reply(processingText);
    await delay(2000);
    await sendAfter();
}

// ================= MESSAGE HANDLER =================
client.on('message', async msg => {
    const text = msg.body || '';
    const ltext = text.toLowerCase();
    const userId = msg.author || msg.from;
    const chatId = msg.from;

    // ---------------- MENU ----------------
    if(ltext === '.menu') {
        return replyWithProcessing(msg, '⏱️ Tunggu sebentar wok...', async () => {
            const displayName = (await msg.getContact()).pushname || userId.split('@')[0];
            await msg.reply(`─Hai, ${displayName}👋

╭──── 「 👤USER INFO 」
│
│└❑ Status :
│└❑ Limit :
│└❑ Level :
╰────────────────

╭──「 OWNER 」
│    • .addprem <nomor>
│    • .delprem <nomor>
│    • .resetlimit
│    • .ban <nomor>
│    • .undban <nomor>
│    • .self
│    • .public
│    • .joingc <link>
│    • .out
│    • .setthumbnail <link>
│    • .setwelcome1
│    • .setwelcome2
╰────────────────

╭─「 FUN 」
│    • .brat
│    • .bratvid
│    • .qc1
│    • .qc2
│    • .s <reply>
│    • .smeme <reply>
╰────────────────

╭─「 FUN 」
│    • .tebakkata
│    • .math
│    • .kuis
╰────────────────

╭─「 RPG 」
│    • .rvo ®
│    • .me
╰────────────────

╭─「 DOWNLOADER 」
│    • .yt <link>
│    • .tymp3 <link>
│    • .tt <link>
│    • .ttmp3 <link>
╰────────────────

╭─「 GROUP 」
│    • .tagall ®
│    • .hidetag ®
│    • .kick <reply> ®
│    • .add <nomor> ®
│    • .open ®
│    • .close ®
│    • .getpp <reply>
│    • .afk
│    • .antilink ®
│    • .antilink off
│    • .linkgc
╰────────────────
® = perintah hanya untuk admin`);
        });
    }

    // ---------------- OWNER COMMANDS ----------------
    if(ltext.startsWith('.addprem') || ltext.startsWith('.delprem') || ltext.startsWith('.resetlimit') ||
       ltext.startsWith('.ban') || ltext.startsWith('.undban') || ltext.startsWith('.self') ||
       ltext.startsWith('.public') || ltext.startsWith('.joingc') || ltext.startsWith('.out') ||
       ltext.startsWith('.setthumbnail') || ltext.startsWith('.setwelcome1') || ltext.startsWith('.setwelcome2')) {
        if(userId !== ownerNumber) return msg.reply('❌ Hanya owner yang bisa menggunakan perintah ini!');
        // Tambahkan logika masing-masing perintah di sini
        return msg.reply('✅ Perintah owner dijalankan (placeholder)');
    }

    // ---------------- ADMIN COMMANDS (®) ----------------
    const adminOnlyPrefixes = ['.rvo', '.tagall', '.hidetag', '.kick', '.add ', '.open', '.close', '.antilink', '.linkgc'];
    if(adminOnlyPrefixes.some(p => ltext.startsWith(p))) {
        const admin = await isAdmin(chatId, userId);
        if(!admin) return msg.reply('❌ Hanya admin yang bisa menggunakan perintah ini!');
        return msg.reply('✅ Perintah admin dijalankan (placeholder)');
    }

    // ---------------- STICKER / WM / BRAT ----------------
    if(ltext.startsWith('.s') || ltext.startsWith('.smeme') || ltext.startsWith('.brat') || ltext.startsWith('.bratvid')) {
        await msg.reply('⏱️ Tunggu sebentar wok...');
        await delay(2000);
        return msg.reply('✅ Sticker/Media dibuat dengan watermark: Dkz | sigma mewing');
    }

    // ---------------- QC / FUN ----------------
    if(ltext === '.qc1' || ltext === '.qc2') return msg.reply('⏱️ Sedang menyiapkan QC...');

    // ---------------- MATH / QUIZ ----------------
    if(ltext === '.math') {
        return replyWithProcessing(msg, '⏱️ Tunggu sebentar wok...', async () => {
            await msg.reply(`🧮 Math Challenge
Pilih level kesulitan:
Easy | Normal | Hard | Impossible1☠️ | Impossible2☠️

Contoh: .math normal`);
        });
    }

    if(ltext === '.kuis' || ltext === '.tebakkata') {
        await msg.reply('⏱️ Tunggu sebentar wok...');
        await delay(2000);
        await msg.reply('❌ / ✅ Logic kuis/tebakkata (placeholder)');
    }

    // ---------------- DOWNLOADER ----------------
    if(ltext.startsWith('.yt') || ltext.startsWith('.tymp3') || ltext.startsWith('.tt') || ltext.startsWith('.ttmp3')) {
        return msg.reply('⏱️ Tunggu sebentar wok... \n✅ Downloader dijalankan (placeholder)');
    }

    // ---------------- RPG ----------------
    if(ltext === '.me') return msg.reply('✅ Info RPG (placeholder)');
    if(ltext.startsWith('.rvo')) return msg.reply('✅ RVO dijalankan (admin only placeholder)');
});

client.initialize();￼Enter
