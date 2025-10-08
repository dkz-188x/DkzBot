import {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} from "@whiskeysockets/baileys";
import pino from "pino";
import readline from "readline";
import chalk from "chalk";
import fs from "fs";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
const question = (text) => new Promise((resolve) => rl.question(text, resolve));

const menu = (user) => `
─Hai, ${user || "User"}👋

╭──── 「 *👤USER INFO* 」
│
│└❑ Status : Aktif
│└❑ Limit : ∞
│└❑ Level : Pro
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
`;

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("./session");
  const conn = makeWASocket({
    logger: pino({ level: "silent" }),
    printQRInTerminal: false,
    browser: ["Linux", "Chrome", "20.0.00"],
    auth: state,
  });

  if (!conn.authState.creds.registered) {
    console.log(chalk.cyan("╭──────────────────────────────────────···"));
    console.log(`📨 ${chalk.redBright("Please type your WhatsApp number")}:`);
    console.log(chalk.cyan("├──────────────────────────────────────···"));
    let phoneNumber = await question(`   ${chalk.cyan("- Number")}: `);
    console.log(chalk.cyan("╰──────────────────────────────────────···"));
    phoneNumber = phoneNumber.replace(/[^0-9]/g, "");

    setTimeout(async () => {
      let code = await conn.requestPairingCode(phoneNumber);
      code = code?.match(/.{1,4}/g)?.join("-") || code;
      console.log(chalk.cyan("╭──────────────────────────────────────···"));
      console.log(` 💻 ${chalk.redBright("Your Pairing Code")}:`);
      console.log(chalk.cyan("├──────────────────────────────────────···"));
      console.log(`   ${chalk.cyan("- Code")}: ${code}`);
      console.log(chalk.cyan("╰──────────────────────────────────────···"));
    }, 3000);
  }

  conn.ev.on("creds.update", saveCreds);

  conn.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "open") {
      console.log(chalk.greenBright("✅ Bot berhasil terhubung!"));
    } else if (connection === "close") {
      const reason = lastDisconnect?.error?.output?.statusCode;
      if (reason === DisconnectReason.loggedOut) {
        console.log(chalk.red("❌ Sesi invalid, hapus folder session dan login ulang"));
        process.exit();
      } else startBot();
    }
  });

  conn.ev.on("messages.upsert", async (chatUpdate) => {
    try {
      const msg = chatUpdate.messages[0];
      if (!msg.message) return;
      const sender = msg.pushName || "User";
      const textMsg = msg.message.conversation || msg.message.extendedTextMessage?.text || "";

      if (textMsg === ".menu") {
        await conn.sendMessage(msg.key.remoteJid, { text: menu(sender) });
      }
    } catch (e) {
      console.log("Error:", e);
    }
  });
}

startBot();
