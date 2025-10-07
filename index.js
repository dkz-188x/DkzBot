// index.js
import { WAConnection, MessageType } from '@adiwajshing/baileys';
import { evaluate } from 'mathjs';
import fs from 'fs';
import fetch from 'node-fetch'; // untuk downloader

const bot = new WAConnection();
const OWNER_NUMBER = '6283119404224';
let userXP = {}; // key=sender, value=XP

const commands = {
    owner:['.addprem','.delprem','.resetlimit','.ban','.undban','.self','.public','.joingc','.out','.setthumbnail'],
    fun:['.brat','.bratvid','.tebakkata','.qc1','.qc2','.s','.smeme','.cekprofile'],
    rpg:['.rvo','.me','.limit','.ceklimit'],
    downloader:['.yt','.tymp3','.tt','.ttmp3','.tomp3'],
    group:['.tagall','.hidetag','.kick','.add','.open','.close','.getpp','.listonline','.totalchat','.afk','.antilink','.antilink off','.linkgc']
};

function isOwner(sender){ return sender.includes(OWNER_NUMBER);}
async function isAdmin(jid,sender){try{const gm=await bot.groupMetadata(jid);return gm.participants.some(p=>p.jid===sender && p.isAdmin);}catch{return false;}}
function delay(ms){ return new Promise(resolve=>setTimeout(resolve,ms));}

// --- Math otomatis ---
function generateMath(level){
    const easyOps=['+','-']; const mediumOps=['+','-','*','/']; 
    const hardOps=['+','-','*','/','^'];
    let ops = level==='easy'?easyOps:level==='normal'?mediumOps:level==='medium'?mediumOps:level==='hard'?hardOps:['+','-','*','/','^'];
    const a=Math.floor(Math.random()*10)+1;
    const b=Math.floor(Math.random()*10)+1;
    const op=ops[Math.floor(Math.random()*ops.length)];
    return `${a} ${op} ${b}`;
}

// --- Kuis otomatis ---
const quizQuestions=[
    {q:'Ibukota Indonesia?', a:'jakarta'},
    {q:'2+2?', a:'4'},
    {q:'Bentuk air padat?', a:'es'}
];

async function handleMath(message,text){
    const args=text.split(' ').slice(1);
    await bot.sendMessage(message.key.remoteJid,'⏱️ ───「 Tunggu wok… 」───',MessageType.text);

    let level=args[0]?.toLowerCase() || '';
    const levels=['easy','normal','medium','hard','impossible1','impossible2'];
    if(!levels.includes(level)){
        const mathMenu = `
╭───「 🧮 MATH LEVEL 」───
│ Pilih level:
│ • easy
│ • normal
│ • medium
│ • hard
│ • impossible1 💀
│ • impossible2 ☠️
╰─────────────────────`;
        await bot.sendMessage(message.key.remoteJid,mathMenu,MessageType.text);
        return;
    }

    // generate soal otomatis
    const expression = generateMath(level);
    const timeouts={easy:15000,normal:30000,medium:40000,hard:60000,impossible1:70000,impossible2:60000};
    const xpValues={easy:10,normal:20,medium:40,hard:60,impossible1:80,impossible2:100};

    await delay(timeouts[level]);
    try{
        const result=evaluate(expression);
        const sender=message.key.participant||message.key.remoteJid;
        if(!userXP[sender]) userXP[sender]=0;
        userXP[sender]+=xpValues[level]||10;
        await bot.sendMessage(message.key.remoteJid,
            `✅ ───「 Hasil Benar 」───\nLevel: ${level}\nSoal: ${expression}\nHasil: ${result}\n🎖️ XP: ${xpValues[level]}\nTotal XP: ${userXP[sender]}`,MessageType.text
        );
    }catch{
        await bot.sendMessage(message.key.remoteJid,'yah salah, coba lagi ya ❌',MessageType.text);
    }
}

async function handleQuiz(message){
    await bot.sendMessage(message.key.remoteJid,'⏱️ ───「 Tunggu wok… 」───',MessageType.text);
    await delay(60000); // 60 detik
    const q=quizQuestions[Math.floor(Math.random()*quizQuestions.length)];
    const sender=message.key.participant||message.key.remoteJid;
    if(!userXP[sender]) userXP[sender]=0;
    userXP[sender]+=50;
    await bot.sendMessage(message.key.remoteJid,
        `✅ ───「 Hasil Benar 」───\nPertanyaan: ${q.q}\nJawaban: ${q.a}\n🎖️ XP: 50\nTotal XP: ${userXP[sender]}`,
        MessageType.text
    );
}

// --- Downloader template ---
async function handleDownloader(message,text){
    await bot.sendMessage(message.key.remoteJid,'⏱️ ───「 Tunggu wok… 」───',MessageType.text);
    await delay(5000);
    await bot.sendMessage(message.key.remoteJid,`✅ Command ${text} diterima, logic download bisa diisi disini`,MessageType.text);
}

// --- Handle semua command ---
async function handleCommand(message){
    if(!message.message) return;
    const text=message.message.conversation||'';
    const sender=message.key.participant||message.key.remoteJid;

    // Math
    if(text.startsWith('.math')) return handleMath(message,text);
    if(text.startsWith('.kuis') || text.startsWith('.tebakkata')) return handleQuiz(message);
    if(['.yt','.tymp3','.tt','.ttmp3','.tomp3'].some(c=>text.startsWith(c))) return handleDownloader(message,text);

    // Cek command list
    for(const category in commands){
        for(const cmd of commands[category]){
            if(text.startsWith(cmd)){
                const adminOnly=['.tagall','.hidetag','.kick','.add','.open','.close','.antilink','.antilink off','.linkgc'];
                if(adminOnly.includes(cmd)){
                    const isSenderAdmin = await isAdmin(message.key.remoteJid,sender);
                    if(!isSenderAdmin){
                        await bot.sendMessage(message.key.remoteJid,'❌ Hanya admin yang bisa menggunakan fitur ini!',MessageType.text);
                        return;
                    }
                }
                if(commands.owner.includes(cmd) && !isOwner(sender)){
                    await bot.sendMessage(message.key.remoteJid,'❌ Hanya owner yang bisa menggunakan fitur ini!',MessageType.text);
                    return;
                }
                await bot.sendMessage(message.key.remoteJid,`✅ Command diterima: ${cmd}`,MessageType.text);
                console.log(`Command executed: ${cmd} by ${sender}`);
                return;
            }
        }
    }
}

// --- Start Bot ---
async function startBot(){
    bot.on('chat-update',async (chat)=>{
        if(!chat.hasNewMessage) return;
        const message = chat.messages.all()[0];
        await handleCommand(message);
    });
    await bot.connect();
    console.log('Bot is running...');
}

startBot().catch(console.error);
