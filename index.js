import { default: makeWASocket, useMultiFileAuthState } from "@adiwajshing/baileys"
import { create, all } from "mathjs"
import fetch from "node-fetch"

const math = create(all)

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info")
  const sock = makeWASocket({ auth: state })

  // Menu definitions
  const menus = {
    owner: [".addprem <nomor>", ".delprem <nomor>", ".resetlimit", ".ban <nomor>", ".undban <nomor>", ".self", ".public", ".joingc <link>", ".out", ".setthumbnail <link>"],
    fun: [".brat", ".bratvid", ".tebakkata", ".qc1", ".qc2", ".s", ".smeme", ".cekprofile <@user>"],
    rpg: [".rvo", ".me", ".limit", ".ceklimit <@user>"],
    downloader: [".yt <link>", ".tymp3 <link>", ".tt <link>", ".ttmp3 <link>", ".tovid", ".tomp3"],
    group: [".tagall", ".hidetag", ".kick <reply>", ".add <nomor>", ".open", ".close", ".getpp <reply>", ".listonline", ".totalchat", ".afk", ".antilink", ".antilink off", ".linkgc"]
  }

  // Helper function: delay
  const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0]
    if (!msg.message) return

    const text = msg.message.conversation || msg.message.extendedTextMessage?.text
    if (!text) return

    const sender = msg.key.remoteJid

    // Owner commands
    if (menus.owner.some(cmd => text.startsWith(cmd.split(" ")[0]))) {
      await sock.sendMessage(sender, { text: "Owner command detected ✅" })
    }

    // Fun commands
    if (menus.fun.some(cmd => text.startsWith(cmd.split(" ")[0]))) {
      await sock.sendMessage(sender, { text: "Fun command detected ✅" })
    }

    // RPG commands
    if (menus.rpg.some(cmd => text.startsWith(cmd.split(" ")[0]))) {
      await sock.sendMessage(sender, { text: "RPG command detected ✅" })
    }

    // Downloader commands
    if (menus.downloader.some(cmd => text.startsWith(cmd.split(" ")[0]))) {
      await sock.sendMessage(sender, { text: "Downloading... ⏱️ Tunggu wok..." })
      await delay(3000)
      await sock.sendMessage(sender, { text: "Download finished ✅" })
    }

    // Group commands
    if (menus.group.some(cmd => text.startsWith(cmd.split(" ")[0]))) {
      await sock.sendMessage(sender, { text: "Group command detected ✅" })
    }

    // Math feature
    if (text.startsWith(".math")) {
      const args = text.split(" ")
      let level = args[1]?.toLowerCase() || ""
      const levels = ["easy","normal","medium","hard","impossible1","impossible2"]
      if (!levels.includes(level)) {
        const mathMenu = `
╭─「 Math Menu 」
│ • easy
│ • normal
│ • medium
│ • hard
│ • impossible1
│ • impossible2
╰───────────`
        await sock.sendMessage(sender, { text: mathMenu })
        return
      }

      // Timer per level
      const times = {
        easy: 15000,
        normal: 30000,
        medium: 40000,
        hard: 60000,
        impossible1: 70000,
        impossible2: 60000
      }
      const expr = "2+2" // contoh, nanti bisa generate random
      await sock.sendMessage(sender, { text: `⏱️ Tunggu wok... Kamu punya ${times[level]/1000} detik untuk menjawab.` })
      await delay(times[level])
      await sock.sendMessage(sender, { text: `Yah salah, coba lagi ya❌` })
    }

    // Tebak Kata / Kuis
    if (text.startsWith(".tebakkata") || text.startsWith(".qc1") || text.startsWith(".qc2")) {
      await sock.sendMessage(sender, { text: "⏱️ Tunggu wok... Kamu punya 60 detik untuk menjawab." })
      await delay(60000)
      await sock.sendMessage(sender, { text: "Yah salah, coba lagi ya❌" })
    }

  })

  sock.ev.on("creds.update", saveCreds)
}

startBot()
