exports.execute = async (client, message, args) => {
    try {
        // Botun uptime bilgisini al
        const uptime = client.uptime;
        const days = Math.floor(uptime / 86400000);
        const hours = Math.floor(uptime / 3600000) % 24;
        const minutes = Math.floor(uptime / 60000) % 60;
        const seconds = Math.floor(uptime / 1000) % 60;

        // Botun uptime bilgisini mesajla gönder
        return message.channel.send(`🕒 **Bot Aktiflik Bilgisi**:
        Bot ${days} gün, ${hours} saat, ${minutes} dakika, ${seconds} saniye süredir aktif.`);
    } catch (error) {
        console.error(error);
        // Hata durumunda mesaj gönder
        return message.reply("❌ **Botun aktiflik bilgisi alınırken bir hata oluştu. Lütfen tekrar deneyin.**");
    }
};

exports.help = {
        "name": "bot-aktiflik",
        "aliases": [
            "ba"
        ],
        "usage": "bot-aktiflik",
        "description": "Botun aktiflik durumunu gösterir."
};
