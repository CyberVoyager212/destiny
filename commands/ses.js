exports.execute = async (client, message, args) => {
    try {
        // Kullanıcı bir ses kanalında mı?
        if (!message.member.voice.channel) {
            return message.reply("❌ **Lütfen önce bir ses kanalına katılın!**");
        }

        // Ses kanalına katılma
        const voiceChannel = message.member.voice.channel;

        // Botu ses kanalına katma
        await voiceChannel.join();
        message.channel.send(`✅ **Başarıyla ${voiceChannel.name} kanalına katıldım!**`);
    } catch (error) {
        console.error(error);
        message.reply("❌ **Ses kanalına katılırken bir hata oluştu.**");
    }
};

exports.help = {
    name: "join",
    aliases: ["katıl"],
    usage: `join`,
    description: "Botun bulunduğunuz ses kanalına katılmasını sağlar."
};
