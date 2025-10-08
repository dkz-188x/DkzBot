import chalk from "chalk";

export default async function handleMessage(conn, m, chatUpdate) {
  try {
    const body = (m.mtype === "conversation") ? m.message.conversation
      : (m.mtype === "extendedTextMessage") ? m.message.extendedTextMessage.text
      : "";

    const command = body.startsWith('.') ? body.slice(1).trim().split(/ +/).shift().toLowerCase() : '';
    const text = body.slice(command.length + 2).trim();

    switch (command) {
      case 'menu':
        const menu = `
─Hai, ${m.pushName || 'user'}👋

╭──── 「 *👤USER INFO* 」
│
│└❑ Status : -
│└❑ Limit : -
│└❑ Level : -
╰────────────────

╭──「 *OWNER* 」
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
╰────────────────

╭─「 *FUN* 」
│    • .brat
│    • .bratvid
│    • .tebakkata
│    • .qc1
│    • .qc2
│    • .s
│    • .smeme
│    • .cekprofile <@user>
╰────────────────

╭─「 *RPG* 」
│    • .rvo ®
│    • .me
│    • .limit
│    • .ceklimit <@user>
╰────────────────

╭─「 *DOWNLOADER* 」
│    • .yt <link>
│    • .tymp3 <link> 
│    • .tt <link>
│    • .ttmp3 <link>
│    • .tovid
│    • .tomp3
╰────────────────

╭─「 *GROUP* 」
│    • .tagall ®
│    • .hidetag ®
│    • .kick <reply> ®
│    • .add <nomor> ®
│    • .open ®
│    • .close ®
│    • .getpp <reply>
│    • .listonline 
│    • .totalchat
│    • .afk
│    • .antilink ®
│    • .antilink off ®
│    • .linkgc ®
╰────────────────
® = Hanya admin yg bisa menggunakan fitur ini!
        `.trim();

        await conn.sendText(m.chat, menu, m);
        break;

      default:
        // kalau bukan perintah menu, bisa diabaikan atau tambahkan logika lain
        break;
    }
  } catch (e) {
    console.error(chalk.red('[ERROR in message.js]'), e);
  }
}
