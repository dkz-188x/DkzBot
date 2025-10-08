const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason,
  makeCacheableSignalKeyStore,
  Browsers
} = require('@whiskeysockets/baileys');
const fs = require('fs');
const settings = require('./settings.js');

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth_info_baileys');
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, fs.promises)
    },
    browser: Browsers.macOS('Safari')
  });

  // Pairing jika belum login
  if (!sock.authState.creds.registered) {
    const code = await sock.requestPairingCode(settings.global.ownerNumber);
    console.log(`🔗 Kode Pairing: ${DKZZBOT1}`);
    console.log('👉 Buka WhatsApp > Perangkat Tertaut > Tautkan perangkat > Masukkan kode di atas.');
  }

  sock.ev.on('connection.update', ({ connection, lastDisconnect }) => {
    if (connection === 'open') console.log('✅ Bot sudah login!');
    if (connection === 'close') {
      const reason = lastDisconnect?.error?.output?.statusCode;
      if (reason !== DisconnectReason.loggedOut) {
        console.log('⚠️ Terputus, mencoba lagi...');
        startBot();
      } else {
        console.log('❌ Terlogout, hapus folder auth_info_baileys lalu jalankan ulang.');
      }
    }
  });

  sock.ev.on('creds.update', saveCreds);
}

startBot();
