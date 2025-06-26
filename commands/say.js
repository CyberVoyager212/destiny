const { Permissions } = require('discord.js');

exports.execute = async (client, message, args) => {
    try {
        // Admin kontrolü yap
        if (!client.config.admins.includes(message.author.id)) {
            return message.reply("❌ **Bu komutu kullanma yetkiniz yok.**");
        }

        // Mesaj içeriğini argümanlardan al
        let sayMessage = args.join(" ");
        if (!sayMessage) {
            return message.reply("⚠️ **Lütfen bir mesaj belirtin.**");
        }

        // Emojileri algıla ve değiştir
        sayMessage = sayMessage.replace(/\((\d+)\)/g, (match, emojiID) => {
            const emoji = message.guild.emojis.cache.get(emojiID);
            return emoji ? emoji.toString() : match; // Eğer emoji varsa, değiştir, yoksa olduğu gibi bırak
        });

        // Kullanıcının mesajını sil ve kanala mesaj gönder
        await message.delete();
        await message.channel.send(sayMessage);

    } catch (error) {
        console.error('Error occurred while executing the "say" command:', error);
        return message.reply("❌ **Mesaj gönderilirken bir hata oluştu.**");
    }
};

exports.help = {
    "name": "say",
    "aliases": [],
    "usage": "say <mesaj>",
    "description": "Belirtilen mesajı sunucuda yayınlar ve özel emoji formatını destekler. (Örn: `(emojiID)`)."
};
