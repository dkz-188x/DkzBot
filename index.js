import {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} from "@whiskeysockets/baileys";
import pino from "pino";
import chalk from "chalk";
import fs from "fs";
import axios from "axios";
import readline from "readline";
import { Boom } from "@hapi/boom";
import { fileURLToPath } from "url";
import path from "path";
import { menuText } from "./menu.js";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
const question = (text) => new Promise((resolve) => rl.question(text, resolve));

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("./session");
  const conn = makeWASocket({
    logger: pino({ level: "silent" }),
    printQRInTerminal: false,
    browser: ["Linux", "Chrome", "20.0.00"],
    auth: state,
  });

  // === Pairing Code ===
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

  // === Simpan data login ===
  conn.ev.on("creds.update", saveCreds);

  // === Jika koneksi putus ===
  conn.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "close") {
      const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
      if (reason === DisconnectReason.loggedOut) {
        console.log(chalk.red("❌ Sesi invalid, hapus folder session dan login ulang"));
        process.exit();
      } else {
        console.log(chalk.yellow("♻️ Reconnecting..."));
        startBot();
      }
    } else if (connection === "open") {
      console.log(chalk.greenBright("✅ Bot berhasil terhubung ke WhatsApp"));
    }
  });

  // === Event pesan masuk ===
  conn.ev.on("messages.upsert", async (chatUpdate) => {
    try {
      const msg = chatUpdate.messages[0];
      if (!msg.message) return;

      const sender = msg.pushName || "User";
      const jid = msg.key.remoteJid;
      const text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";

      // === Command Handling ===
      const prefix = ".";
      if (!text.startsWith(prefix)) return;
      const command = text.slice(1).trim().split(" ")[0].toLowerCase();
      const args = text.trim().split(/ +/).slice(1);

      switch (command) {
        case "menu":
          await conn.sendMessage(jid, { text: menu(sender) });
          break;

        // ===== OWNER =====
        case "addprem":
        case "delprem":
        case "resetlimit":
        case "ban":
        case "unban":
        case "self":
        case "public":
        case "joingc":
        case "out":
        case "setthumbnail":
          await conn.sendMessage(jid, { text: `Fitur ${command} belum diaktifkan.` });
          break;

        // ===== FUN =====
        case "brat":
          await conn.sendMessage(jid, { text: "You are such a brat 💅" });
          break;

        case "tebakkata":
          await conn.sendMessage(jid, { text: "Fitur tebakkata dalam pengembangan." });
          break;

        // ===== RPG =====
        case "limit":
          await conn.sendMessage(jid, { text: "Limit kamu masih penuh ✨" });
          break;

        // ===== DOWNLOADER =====
        case "yt":
          if (!args[0]) return conn.sendMessage(jid, { text: "Masukkan link YouTube!" });
          await conn.sendMessage(jid, { text: `📥 Sedang mendownload: ${args[0]}` });
          break;

        // ===== GROUP =====
        case "tagall":
          await conn.sendMessage(jid, { text: "Fitur hanya untuk admin grup!" });
          break;

        default:
          await conn.sendMessage(jid, { text: `Perintah *${command}* tidak dikenal.` });
          break;
      }
    } catch (e) {
      console.log(chalk.red("Error message handler:"), e);
    }
  });
}

// === Auto reload index.js jika diubah ===
let file = fileURLToPath(import.meta.url);
fs.watchFile(file, () => {
  fs.unwatchFile(file);
  console.log(chalk.yellowBright(`File '${path.basename(file)}' diperbarui, restart...`));
  import(`${file}?update=${Date.now()}`);
});

startBot();
