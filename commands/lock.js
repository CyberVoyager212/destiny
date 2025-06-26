const { Client, Message } = require("discord.js");

exports.execute = async (client, message, args) => {
    try {
        // Yetki kontrolü
        if (!message.member.permissions.has('ADMINISTRATOR')) {
            return message.reply("🚫 | Bu komutu kullanmak için yetkiniz yok.");
        }

        // Kanal belirleme (Varsayılan olarak komutun yazıldığı kanal)
        const channel = message.mentions.channels.first() || message.channel;

        // Rolleri ve kullanıcıları alma
        const roles = message.mentions.roles;
        const users = message.mentions.users;

        if (!roles.size && !users.size) {
            return message.reply("⚠️ | Lütfen mesaj göndermesini engellemek istediğiniz **rolleri veya kullanıcıları** belirtin.");
        }

        // Mesaj gönderme yetkisini kapatma işlemi
        let lockedItems = [];

        // Rollerin mesaj gönderme yetkisini kapatma
        for (const role of roles.values()) {
            await channel.permissionOverwrites.edit(role, { SEND_MESSAGES: false }).catch(err => console.error(err));
            lockedItems.push(`🔒 Rol: ${role.toString()}`);
        }

        // Kullanıcıların mesaj gönderme yetkisini kapatma
        for (const user of users.values()) {
            await channel.permissionOverwrites.edit(user, { SEND_MESSAGES: false }).catch(err => console.error(err));
            lockedItems.push(`🔒 Kullanıcı: ${user.toString()}`);
        }

        // Başarı mesajı
        return message.channel.send(`🔒 **Kanal Kilitlendi!**\n📢 **Kanal:** ${channel.toString()}\n\n${lockedItems.join("\n")}`);
    } catch (error) {
        console.error("❌ | Kanal kilitleme sırasında hata oluştu:", error);
        return message.reply("❌ | Kanal kilitleme sırasında bir hata oluştu, lütfen tekrar deneyin.");
    }
};

exports.help = {
        "name": "lock",
        "aliases": [
            "kanalkilitle"
        ],
        "usage": "lock <#kanal> <@rol1> <@kullanıcı1> <@rol2> ...",
        "description": "Belirtilen kanal ve kullanıcıları için erişim kısıtlamaları oluşturur."
};
