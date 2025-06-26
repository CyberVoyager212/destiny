const { Permissions } = require("discord.js");

exports.execute = async (client, message, args) => {
    // Yetki kontrolü
    if (!message.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) {
        return message.reply("🚫 Bu komutu kullanmak için **yönetici** yetkisine sahip olmalısınız!");
    }

    // Duyuru mesajının olup olmadığını kontrol et
    const announcement = args.join(' ');
    if (!announcement) {
        return message.reply("ℹ️ **Lütfen göndermek istediğiniz duyuru mesajını belirtin!**");
    }

    try {
        // Sunucudaki tüm üyeleri getir
        const members = await message.guild.members.fetch();
        let successCount = 0;
        let failCount = 0;

        // Üyelere özel mesaj gönderme
        for (const member of members.values()) {
            if (!member.user.bot) {
                try {
                    await member.send(`📢 **DUYURU**\n\n${announcement}`);
                    successCount++;
                } catch {
                    failCount++;
                }
            }
        }

        // Sonuç mesajı
        message.channel.send(`✅ **Duyuru gönderildi!**\n📬 **Başarıyla gönderilen:** ${successCount}\n⚠️ **Gönderilemeyen:** ${failCount}`);
    } catch (error) {
        console.error("Duyuru gönderme hatası:", error);
        message.reply("❌ **Duyuru mesajı gönderilirken bir hata oluştu!**");
    }
};

exports.help = {
        "name": "duyuru",
        "aliases": [
            "duyur"
        ],
        "usage": "duyuru <mesaj>",
        "description": "Sunucuda bir duyuru mesajı gönderir."
};
