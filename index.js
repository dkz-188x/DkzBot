import makeWASocket from "@whiskeysockets/baileys"

const startBot = async () => {
  const sock = makeWASocket({})
  console.log("✅ Bot WhatsApp aktif!")
}

startBot()
