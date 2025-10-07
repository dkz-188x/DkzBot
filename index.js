import makeWASocket, { useMultiFileAuthState, DisconnectReason } from "@whiskeysockets/baileys"
import fetch from "node-fetch"
import P from "pino"

const OWNER = "6283119404224" // ubah ke nomor kamu
const API_TT = "https://api.tiklydown.eu.org/api/download?url="
const API_YT = "https://api.vihangayt.me/download/ytmp4?url="

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
    } else if (connection === 'open') {
      console.log('✅ DkzBot connected!')
    }
  })

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0]
    if (!msg.message) return
    const from = msg.key.remoteJid
    const isGroup = from.endsWith('@g.us')
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text || ''
    if (!text.startsWith('.')) return

    const [cmd, ...args] = text.slice(1).trim().split(' ')
    const q = args.join(' ')

    const reply = async (t) => sock.sendMessage(from, { text: t }, { quoted: msg })

    switch (cmd.toLowerCase()) {
      case 'owner':
        await reply(`👑 Owner: wa.me/${OWNER}`)
        break

      case 'limit':
        await reply('🔋 Limit kamu masih penuh!')
        break

      case 'brat':
        await reply('😈 Brat mode aktif!')
        break

      case 'grup':
        await reply(
          `👥 *Menu Grup*\n\n` +
          `.kick <nomor>\n.add <nomor>\n.close\n.open`
        )
        break

      case 'kick':
        if (!isGroup) return reply('❗Hanya bisa di grup.')
        if (!args[0]) return reply('Ketik: .kick 628xxxx')
        await sock.groupParticipantsUpdate(from, [args[0] + "@s.whatsapp.net"], 'remove')
        await reply(`✅ Berhasil keluarkan ${args[0]}`)
        break

      case 'add':
        if (!isGroup) return reply('❗Hanya bisa di grup.')
        if (!args[0]) return reply('Ketik: .add 628xxxx')
        await sock.groupParticipantsUpdate(from, [args[0] + "@s.whatsapp.net"], 'add')
        await reply(`✅ Berhasil menambah ${args[0]}`)
        break

      case 'close':
        if (!isGroup) return reply('❗Hanya bisa di grup.')
        await sock.groupSettingUpdate(from, 'announcement')
        await reply('🔒 Grup ditutup (hanya admin yang bisa kirim pesan).')
        break

      case 'open':
        if (!isGroup) return reply('❗Hanya bisa di￼Enter
