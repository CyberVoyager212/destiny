const fs = require('fs');
const path = require('path');
const botConfigPath = path.resolve(__dirname, '../botConfig.js');

// Bot yapılandırmasını yükle
let botConfig = require(botConfigPath);

exports.execute = async (client, message, args) => {
    try {
        // Sadece adminler erişebilir
        if (!botConfig.admins.includes(message.author.id)) {
            return message.reply("⛔ **Bu komutu kullanmak için yetkiniz yok!**");
        }

        const [action, key, ...values] = args;

        if (!action) {
            return message.reply("⚙️ **Bir işlem belirtmelisiniz:** `view` veya `set`");
        }

        if (action === 'view') {
            let responseMessage = "📜 **Bot Ayarları** 📜\n\n";
            
            Object.keys(botConfig).forEach((key) => {
                let value = botConfig[key];

                if (key === 'token') {
                    value = maskValue(value);
                } else if (typeof value === 'string' && value.length > 15) {
                    value = maskValue(value);
                } else if (typeof value === 'string' && value.length <= 15) {
                    value = value.substring(0, value.length - 6) + '?'.repeat(6);
                }

                responseMessage += `🔹 **${key}:** ${Array.isArray(value) ? value.join(', ') : value.toString()}\n`;
            });

            return message.channel.send(responseMessage);
        }

        if (action === 'set') {
            if (!key) {
                return message.reply("🛠️ **Bir anahtar belirtmelisiniz!**");
            }

            if (key === 'token') {
                return message.reply("🚫 **Token değiştirilemez!**");
            }

            const newValue = values.join(' ');

            if (Array.isArray(botConfig[key])) {
                botConfig[key] = newValue.split(',').map(item => item.trim());
            } else if (typeof botConfig[key] === 'boolean') {
                botConfig[key] = newValue === 'true';
            } else {
                botConfig[key] = newValue;
            }

            // botConfig.js dosyasını güncelle
            const botConfigContent = `module.exports = ${JSON.stringify(botConfig, null, 4)};`;

            fs.writeFileSync(botConfigPath, botConfigContent, 'utf8');

            return message.reply(`✅ **Ayar güncellendi:** \`${key}\` = \`${newValue}\``);
        }

        return message.reply("❌ **Geçersiz işlem!** `view` veya `set` kullanın.");
    } catch (error) {
        console.error("⚠️ Hata:", error);
        return message.reply("❌ **Bir hata oluştu, lütfen tekrar deneyin!**");
    }
};

// Değerleri maskeleme fonksiyonu
function maskValue(value) {
    if (value.length > 15) {
        return value.substring(0, value.length - 12) + '?'.repeat(12);
    }
    return value.substring(0, value.length - 6) + '?'.repeat(6);
}

exports.help = {
    name: 'config',
    aliases: ['ayar', 'ayarlar'],
    usage: 'config <view|set> [anahtar] [değer]',
    description: "Bot yapılandırmasını görüntüler veya değiştirir."
};
