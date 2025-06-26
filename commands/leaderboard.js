const { Client, Message } = require("discord.js");

exports.execute = async (client, message, args) => {
    try {
        // Ekonomi liderlik tablosunu al
        let leaderboard = client.eco.leaderboard({ limit: 50, raw: false });

        // Eğer tablo boşsa mesaj gönder
        if (!leaderboard || leaderboard.length < 1) {
            return message.channel.send("❌ | Liderlik tablosu boş!");
        }

        // Sunucudaki kullanıcıları filtrele ve ilk 5 kişiyi al
        const guildMembers = message.guild.members.cache;
        leaderboard = leaderboard.filter(u => guildMembers.has(u.id)).slice(0, 5);

        // Eğer sunucuda geçerli bir liderlik tablosu yoksa mesaj gönder
        if (leaderboard.length < 1) {
            return message.channel.send("❌ | Sunucuda geçerli bir liderlik tablosu bulunamadı!");
        }

        // Liderlik tablosu mesajını oluştur
        let leaderboardMessage = `🏆 **${message.guild.name} Liderlik Tablosu** 🏆\n\n`;
        leaderboard.forEach((u, index) => {
            const user = client.users.cache.get(u.id);
            const username = user ? user.tag : "Bilinmeyen Kullanıcı";
            leaderboardMessage += `**${index + 1}.** ${username} — **${u.money}** <:Destinex:1347644229333028864>\n`;
        });

        // Mesajı gönder
        return message.channel.send(leaderboardMessage);
    } catch (error) {
        console.error("⚠️ | Liderlik tablosu alınırken hata oluştu:", error);
        return message.channel.send("❌ | Liderlik tablosu alınırken bir hata oluştu, lütfen tekrar deneyin.");
    }
};

exports.help = {
        "name": "lb",
        "aliases": [
            "liderliktablosu"
        ],
        "usage": "lb",
        "description": "Liderlik tablosunu gösterir, en yüksek puanı elde edenleri sıralar."
};
