const { Permissions } = require('discord.js');
const { DateTime } = require('luxon');

exports.execute = async (client, message, args) => {
    try {
        // Kullanıcının mesajını silme
        await message.delete();
    } catch (error) {
        console.error('Mesaj silinirken bir hata oluştu:', error);
        return message.reply("❌ Mesaj silinirken bir hata oluştu.");
    }

    // Türkiye'nin saati (Zaman dilimi: Europe/Istanbul)
    const turkeyTime = DateTime.now().setZone('Europe/Istanbul');

    // Rastgele 15 ülkenin saat bilgileri
    const countries = [
        { name: 'USA', zone: 'America/New_York' },
        { name: 'Germany', zone: 'Europe/Berlin' },
        { name: 'Japan', zone: 'Asia/Tokyo' },
        { name: 'India', zone: 'Asia/Kolkata' },
        { name: 'Australia', zone: 'Australia/Sydney' },
        { name: 'Russia', zone: 'Europe/Moscow' },
        { name: 'Brazil', zone: 'America/Sao_Paulo' },
        { name: 'China', zone: 'Asia/Shanghai' },
        { name: 'UK', zone: 'Europe/London' },
        { name: 'France', zone: 'Europe/Paris' },
        { name: 'South Korea', zone: 'Asia/Seoul' },
        { name: 'Mexico', zone: 'America/Mexico_City' },
        { name: 'Canada', zone: 'America/Toronto' },
        { name: 'Italy', zone: 'Europe/Rome' },
        { name: 'Spain', zone: 'Europe/Madrid' }
    ];

    let response = "🌍 **Dünya Saatleri ve Türkiye'ye Zaman Farkı**\n\n";

    countries.forEach((country) => {
        const countryTime = DateTime.now().setZone(country.zone);
        const timeDifference = turkeyTime.offset - countryTime.offset; // Zaman farkını doğru hesapla

        response += `**${country.name}**: ${countryTime.toFormat('HH:mm')} (Zaman farkı: ${timeDifference >= 0 ? `+${timeDifference / 60}` : timeDifference / 60} saat)\n`;
    });

    // Saat bilgisini kanal üzerinden metin olarak gönder
    try {
        return message.channel.send(response);
    } catch (error) {
        console.error('Mesaj gönderilirken bir hata oluştu:', error);
        return message.reply("⚠️ Mesaj gönderilirken bir hata oluştu.");
    }
};

exports.help = {
    "name": "dunya-saat",
    "aliases": ["dunya-zaman", "world-time","dünyasaatleri","dünyasa","dsaatleri","dsaat","düsa"],
    "usage": "k!dunya-saat",
    "description": "Dünyadaki rastgele 15 ülkenin saatlerini ve Türkiye'ye olan zaman farkını gösterir."
};
