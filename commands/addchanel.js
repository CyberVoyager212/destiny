const { MessageActionRow, MessageButton } = require('discord.js');

exports.execute = async (client, message, args) => {
    // Kullanıcının 'MANAGE_CHANNELS' yetkisini kontrol et
    if (!message.member.permissions.has('MANAGE_CHANNELS')) {
        return message.reply("❌ **Bu komutu kullanmak için `Kanal Yönet` yetkiniz yok.**");
    }

    // Kanal adı olup olmadığını kontrol et
    const channelName = args.join(" ");
    if (!channelName) {
        return message.reply("⚠️ **Lütfen eklenecek kanalın adını yazın.**");
    }

    try {
        // Kanal oluşturuluyor
        const channel = await message.guild.channels.create(channelName, { type: 'GUILD_TEXT' });

        // Başarı mesajı
        return message.channel.send(`✅ **${channel.name}** adlı kanal başarıyla eklendi!`);

    } catch (error) {
        console.error(error);

        // Hata durumuna göre cevap
        if (error.code === 50013) {
            return message.reply("🚫 **Botun kanal oluşturma izni yok. Lütfen gerekli izinleri kontrol edin.**");
        } else if (error.code === 10003) {
            return message.reply("🚫 **Sunucu hatası nedeniyle kanal oluşturulamadı. Lütfen tekrar deneyin.**");
        } else {
            return message.reply("❌ **Kanal eklenirken beklenmedik bir hata oluştu. Lütfen tekrar deneyin.**");
        }
    }
};

exports.help = {
        "name": "addchannel",
        "aliases": [
            "createchannel"
        ],
        "usage": "addchannel <kanal adı>",
        "description": "Yeni bir kanal oluşturur."
};
