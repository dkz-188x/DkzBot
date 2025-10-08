const chalk = require("chalk");
const fs = require("fs");

// ===== Global Bot Configuration =====
const pairingCode = "DKZZBOT1"; // hanya internal, tidak bisa diubah dari luar
global.owner = "6283119404224";
global.versiBot = "1.0";
global.namaBot = "DkzBot";
global.namaOwner = "Dkz";
global.footer = "github.com/Dkz";

// ===== Thumbnail / Logo =====
global.thumbnail = './library/image/shanny.jpg';

// ===== Default Messages =====
global.mess = {
    owner: "Maaf hanya untuk owners bot",
    admin: "Maaf hanya untuk admin groups",
    botAdmin: "Maaf bot harus dijadikan admin",
    group: "Maaf hanya dapat digunakan di dalam group",
    private: "Silahkan gunakan fitur di private chat",
};

// ===== Fungsi untuk akses pairing code =====
global.getPairingCode = () => pairingCode;

// ===== Watch file untuk auto-reload =====
const file = require.resolve(__filename);
fs.watchFile(file, () => {
    fs.unwatchFile(file);
    console.log(chalk.blue(">> Update File :"), chalk.black.bgWhite(`${__filename}`));
    delete require.cache[file];
    require(file);
});
