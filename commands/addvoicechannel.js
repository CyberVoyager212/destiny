exports.execute = async (client, message, args) => {
    // Kullanıcının 'MANAGE_CHANNELS' yetkisi olup olmadığını kontrol et
    if (!message.member.permissions.has('MANAGE_CHANNELS')) {
        return message.reply("❌ **Bu komutu kullanmak için `Kanal Yönet` yetkiniz yok.**");
    }

    // Kanal adı belirtilip belirtilmediğini kontrol et
    const channelName = args.join(" ");
    if (!channelName) {
        return message.reply("⚠️ **Lütfen eklenecek ses kanalının adını yazın.**");
    }

    try {
        // Yeni ses kanalı oluşturma
        const channel = await message.guild.channels.create(channelName, { type: 'GUILD_VOICE' });

        return message.channel.send(`✅ **${channel.name}** ses kanalı başarıyla eklendi!`);
    } catch (error) {
        console.error(error);

        // Hata durumunda mesaj
        if (error.code === 50013) {
            return message.reply("🚫 **Bu kanal eklenirken yeterli yetkim yok.**");
        }

        return message.reply("❌ **Ses kanalı eklenirken bir hata oluştu. Lütfen tekrar deneyin.**");
    }
};

exports.help = {
        "name": "addvoicechannel",
        "aliases": [
            "seskanalıoluştur",
            "sko"
        ],
        "usage": "addvoicechannel <kanal adı>",
        "description": "Yeni bir sesli kanal oluşturur."
};
