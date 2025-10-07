import makeWASocket, { useMultiFileAuthState, DisconnectReason } from "@whiskeysockets/baileys"
import fetch from "node-fetch"
import P from "pino"
import fs from "fs"

const OWNER = "6283119404224" // ubah ke nomor kamu
const API_TT = "https://api.tiklydown.eu.org/api/download?url="
const API_YT = "https://api.vihangayt.me/download/ytmp4?url="
const FILES = {
  antilink: "./antilink.json",
  self: "./selfmode.json",
  premium: "./premium.json",
  limit: "./limit.json"
}

// --- INIT FILES ---
for (const f in FILES) if (!fs.existsSync(FILES[f])) fs.writeFileSync(FILES[f], f === "limit" ? JSON.stringify({ lastReset: Date.now(), users: {} }) : JSON.stringify(f === "self" ? { self: false } : {}))

// --- LOAD & SAVE ---
const load = (f) => JSON.parse(fs.readFileSync(FILES[f]))
const save = (f, d) => fs.writeFileSync(FILES[f], JSON.stringify(d, null, 2))

// --- RESET LIMIT SETIAP 24 JAM ---
setInterval(() => {
  const limitData = load("limit")
  if (Date.now() - limitData.lastReset > 86400000) {
    limitData.lastReset = Date.now()
    limitData.users = {}
    save("limit", limitData)
    console.log("🔁 Limit harian direset.")
  }
}, 60000)

// --- BATAS LIMIT ---
const getLimit = (id, isPremium) => {
  const limitData = load("limit")
  if (isPremium) return Infinity
  if (!limitData.users[id]) limitData.users[id] = 20
  save("limit", limitData)
  return limitData.users[id]
}

const reduceLimit = (id, isPremium) => {
  if (isPremium) return true
  const limitData = load("limit")
  if (!limitData.users[id]) limitData.users[id] = 20
  if (limitData.users[id] <= 0) return false
  limitData.users[id]--
  save("limit", limitData)
  return true
}

// --- START BOT ---
const startBot = async () => {
  const { state, saveCreds } = await useMultiFileAuthState('./session')
  const sock = makeWASocket({
    logger: P({ level: 'silent' }),
    printQRInTerminal: true,
    auth: state
  })

  sock.ev.on('creds.update', saveCreds)
  sock.ev.on('connection.update', ({ connection, lastDisconnect }) => {
    if (connection === 'close') {
      const reason = lastDisconnect?.error?.output?.statusCode
      if (reason !== DisconnectReason.loggedOut) startBot()
    } else if (connection === 'open') console.log('✅ DkzBot connected!')
  })

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0]
    if (!msg.message) return
    const from = msg.key.remoteJid
    const sender = msg.key.participant || msg.key.remoteJid
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text || ''
    const isGroup = from.endsWith('@g.us')
    const isOwner = sender.includes(OWNER)

    const antilinkData = load("antilink")
    const selfData = load("self")
    const premData = load("premium")

    const isSelf = selfData.self
    const isPremium = premData[sender] || isOwner

    // Self Mode
    if (isSelf && !isOwner && text.startsWith('.')) return

    // Antilink
    if (isGroup && antilinkData[from] && text.includes('https://')) {
      await sock.sendMessage(from, { delete: msg.key })
      await sock.sendMessage(from, { text: '🚫 Link dihapus (antilink aktif).' })
      return
    }

    if (!text.startsWith('.')) return
    const [cmd, ...args] = text.slice(1).trim().split(' ')
    const q = args.join(' ')
    const reply = async (t) => sock.sendMessage(from, { text: t }, { quoted: msg })

    // BATAS LIMIT CEK
    const limitUser = getLimit(sender, isPremium)
    if (["yt", "tt"].includes(cmd.toLowerCase()) && !reduceLimit(sender, isPremium))
      return reply("❌ Limit kamu habis. Tunggu reset harian.")

    switch (cmd.toLowerCase()) {
      case 'owner':
        await reply(`👑 Owner: wa.me/${OWNER}`)
        break

      case 'limit':
        await reply(`🔋 Limit kamu: ${isPremium ? '∞ (Premium)' : limitUser}`)
        break

      case 'brat':
        await reply('😈 Brat mode aktif!')
        break

      case 'grup':
        await reply(
          `👥 *Menu Grup*\n\n` +
          `.kick <nomor>\n.add <nomor>\n.close\n.open\n.antilink on/off\n.self on/off`
        )
        break

      case 'kick':
        if (!isGroup) return reply('❗Hanya di grup.')
        if (!args[0]) return reply('Ketik: .kick 628xxxx')
        await sock.groupParticipantsUpdate(from, [args[0] + "@s.whatsapp.net"], 'remove')
        await reply(`✅ ${args[0]} dikeluarkan.`)
        break

      case 'add':
        if (!isGroup) return reply('❗Hanya di grup.')
        if (!args[0]) return reply('Ketik: .add 628xxxx')
        await sock.groupParticipantsUpdate(from, [args[0] + "@s.whatsapp.net"], 'add')
        await reply(`✅ ${args[0]} ditambahkan.`)
        break

      case 'close':
        await sock.groupSettingUpdate(from, 'announcement')
        await reply('🔒 Grup ditutup.')
        break

      case 'open':
        await sock.groupSettingUpdate(from, 'not_announcement')
        await reply('🔓 Grup dibuka.')
        break

      case 'antilink':
        if (!['on', 'off'].includes(q)) return reply('Gunakan: .antilink on / off')
        antilinkData[from] = q === 'on'
        save("antilink", antilinkData)
        await reply(`🛡️ Antilink ${q === 'on' ? 'aktif' : 'nonaktif'}.`)
        break

      case 'self':
        if (!isOwner) return reply('❗Hanya owner.')
        if (!['on', 'off'].includes(q)) return reply('Gunakan: .self on / off')
        save("self", { self: q === 'on' })
        await reply(`🤖 Self mode ${q === 'on' ? 'aktif' : 'nonaktif'}.`)
        break

      // --- PREMIUM SYSTEM ---
      case 'addprem':
        if (!isOwner) return reply('❗Hanya owner.')
        if (!args[0]) return reply('Ketik: .addprem 628xxxx')
        premData[args[0] + "@s.whatsapp.net"] = true
        save("premium", premData)
        await reply(`⭐ ${args[0]} ditambahkan ke premium.`)
        break

      case 'delprem':
        if (!isOwner) return reply('❗Hanya owner.')
        if (!args[0]) return reply('Ketik: .delprem 628xxxx')
        delete premData[args[0] + "@s.whatsapp.net"]
        save("premium", premData)
        await reply(`🚫 ${args[0]} dihapus dari premium.`)
        break

      case 'listprem':
        const list = Object.keys(premData)
        await reply(list.length ? `⭐ *User Premium:*\n${list.join('\n')}` : 'Belum ada user premium.')
        break

      // --- DOWNLOADER ---
      case 'downloader':
        await reply(`📥 *Menu Downloader*\n\n.tt <link>\n.yt <link>`)
        break

      case 'tt':
        if (!q) return reply('Contoh: .tt https://vt.tiktok.com/xxxx')
        await reply('⏳ Mendownload TikTok...')
        try {
          const res = await fetch(API_TT + q)
          const data = await res.json()
          if (!data?.video) return reply('❌ Gagal ambil video.')
          await sock.sendMessage(from, { video: { url: data.video }, caption: '🎬 Video TikTok' }, { quoted: msg })
        } catch { reply('❌ Gagal download TikTok.') }
        break

      case 'yt':
        if (!q) return reply('Contoh: .yt https://youtu.be/xxxx')
        await reply('⏳ Mendownload YouTube...')
        try {
          const res = await fetch(API_YT + q)
          const data = await res.json()
          if (!data?.data?.download?.url) return reply('❌ Gagal ambil video.')
          await sock.sendMessage(from, { video: { url: data.data.download.url }, caption: '🎬 Video YouTube' }, { quoted: msg })
        } catch { reply('❌ Gagal download YouTube.') }
        break

      default:
        await reply('❓ Perintah tidak dikenal.')
    }
  })
}

startBot()
