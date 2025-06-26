exports.execute = async (client, message, args) => {
    try {
        // Yetki kontrolü
        if (!message.member.permissions.has('MANAGE_CHANNELS')) {
            return message.reply("⛔ **Bu komutu kullanmak için** `Kanalları Yönet` **iznine sahip olmalısın!**");
        }

        // Etiketlenen kanal kontrolü
        const channel = message.mentions.channels.first();
        if (!channel) {
            return message.reply("⚠️ **Lütfen silmek istediğiniz kanalı etiketleyin!**");
        }

        const channelName = channel.name;

        // Kanalı silme işlemi
        await channel.delete();
        return message.channel.send(`🗑️ **Başarıyla \`${channelName}\` adlı kanal silindi!**`);
        
    } catch (error) {
        console.error("⚠️ Kanal silinirken bir hata oluştu:", error);
        return message.reply("❌ **Kanal silinirken bir hata meydana geldi, lütfen tekrar dene!**");
    }
};

exports.help = {
    name: "deletechannel",
    aliases: ["kanalsil"],
    usage: "deletechannel <#kanal>",
    description: "Belirtilen kanalı siler."
};
