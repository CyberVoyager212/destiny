const { MessageActionRow, MessageButton } = require('discord.js');

exports.execute = async (client, message, args) => {
    try {
        // Yetki kontrolü
        if (!message.member.permissions.has('MANAGE_CHANNELS')) {
            return message.reply("⛔ **Bu komutu kullanmak için** `Kanalları Yönet` **iznine sahip olmalısın!**");
        }

        const channelId = args[0]; // Kullanıcıdan alınan kanal ID'si
        if (!channelId) {
            return message.reply("⚠️ **Lütfen silmek istediğiniz ses kanalının ID'sini girin.**");
        }

        // Kanalı ID ile al
        const channel = message.guild.channels.cache.get(channelId);

        if (!channel || channel.type !== 'GUILD_VOICE') {
            return message.reply("⚠️ **Geçersiz bir ses kanalı ID'si girdiniz veya böyle bir kanal bulunamadı.**");
        }

        try {
            // Kanali sil
            await channel.delete();
            return message.reply(`✅ **${channel.name}** adlı ses kanalı başarıyla silindi.`);
        } catch (error) {
            console.error(error);
            return message.reply("❌ **Ses kanalı silinirken bir hata oluştu. Lütfen tekrar deneyin.**");
        }

    } catch (error) {
        console.error("⚠️ Bir hata oluştu:", error);
        return message.reply("❌ **Bir hata oluştu, lütfen tekrar deneyin.**");
    }
};

exports.help = {
    name: "seskanalsil",
    aliases: [],
    usage: "seskanalsil <kanal_id>",
    description: "Belirtilen ID ile ses kanalını siler."
};
