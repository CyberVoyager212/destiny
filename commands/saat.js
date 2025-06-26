const { Permissions } = require('discord.js');

exports.execute = async (client, message, args) => {
    try {
        // Kullanıcının mesajını silme
        await message.delete();
    } catch (error) {
        console.error('Mesaj silinirken bir hata oluştu:', error);
        return message.reply("❌ Mesaj silinirken bir hata oluştu.");
    }

    // Türkiye saat dilimine göre geçerli saat bilgisini al
    const currentDate = new Date();
    const options = { timeZone: 'Europe/Istanbul', hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' };
    const timeString = currentDate.toLocaleString('tr-TR', options);

    // Saat bilgisini kanal üzerinden metin olarak gönder
    try {
        return message.channel.send(`🕓 Şu anki saat (Türkiye): **${timeString}**`);
    } catch (error) {
        console.error('Mesaj gönderilirken bir hata oluştu:', error);
        return message.reply("⚠️ Mesaj gönderilirken bir hata oluştu.");
    }
};

exports.help = {
       "name": "saat",
        "aliases": [],
        "usage": "saat",
        "description": "Türkiyedeki saati gösterir."
};
