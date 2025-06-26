exports.execute = async (client, message, args) => {
    // Kullanıcının 'MANAGE_CHANNELS' yetkisini kontrol et
    if (!message.member.permissions.has('MANAGE_CHANNELS')) {
        return message.reply("❌ **Bu komutu kullanmak için `Kanalları Yönet` yetkiniz yok.**");
    }

    // Botun 'MANAGE_CHANNELS' yetkisi olup olmadığını kontrol et
    if (!message.guild.me.permissions.has('MANAGE_CHANNELS')) {
        return message.reply("❌ **Beni yetkilendirmeniz gerekiyor: `Kanalları Yönet` yetkisi yok.**");
    }

    // Süreyi kontrol et
    const time = parseInt(args[0]);

    if (isNaN(time) || time < 0 || time > 21600) {  
        return message.reply("⚠️ **Lütfen 0 ile 21600 saniye arasında geçerli bir sayı girin.**");
    }

    try {
        // Yavaş modu ayarla
        await message.channel.setRateLimitPerUser(time);

        // Mesaj gönder
        return message.channel.send(
            time === 0 
                ? "✅ **Yavaş mod devre dışı bırakıldı!**" 
                : `✅ **Bu kanal için yavaş mod **${time}** saniye olarak ayarlandı!**`
        );

    } catch (error) {
        console.error(error);
        return message.reply("❌ **Bir hata oluştu, yavaş mod ayarlanamadı.**");
    }
};

exports.help = {
    "name": "slowmode",
    "aliases": ["yavaşmod", "slow"],
    "usage": "slowmode <saniye>",
    "description": "Belirtilen kanal için yavaş modu ayarlar (0 saniye = kapatma)."
};
