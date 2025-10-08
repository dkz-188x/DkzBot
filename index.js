import {
  makeWASocket,
  useMultiFileAuthState
} from "@whiskeysockets/baileys";
import pino from "pino";
import readline from "readline";
import chalk from "chalk";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
const question = (text) => new Promise((resolve) => rl.question(text, resolve));

async function pairingCode() {
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
}

pairingCode();
