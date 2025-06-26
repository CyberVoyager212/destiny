const { Client, Message } = require("discord.js");

exports.execute = async (client, message, args) => {
    try {
        // Yetki kontrolü
        if (!message.member.permissions.has('MANAGE_CHANNELS')) {
            return message.reply("🚫 | Bu komutu kullanmak için yetkiniz yok.");
        }

        // Hedef kullanıcıyı alma
        const member = message.mentions.members.first();
        if (!member) {
            return message.reply("⚠️ | Lütfen mesaj göndermek istediğiniz kullanıcıyı etiketleyin.");
        }

        // Mesaj içeriğini alma
        const messageContent = args.slice(1).join(" ");
        if (!messageContent) {
            return message.reply("✍️ | Lütfen göndermek istediğiniz mesajı yazın.");
        }

        // Kullanıcıya özel mesaj gönderme
        await member.send(`📩 | **Özel Mesaj:**\n${messageContent}`)
            .then(() => message.channel.send(`✅ | Mesaj başarıyla **${member.user.tag}** kullanıcısına gönderildi.`))
            .catch(error => {
                console.error("❌ | Mesaj gönderme hatası:", error);
                message.reply("❌ | Kullanıcıya özel mesaj gönderilemedi. Kullanıcının DM kutusu kapalı olabilir.");
            });

    } catch (error) {
        console.error("⚠️ | Komut çalıştırılırken bir hata oluştu:", error);
        return message.reply("❌ | Komut çalıştırılırken bir hata oluştu, lütfen tekrar deneyin.");
    }
};

exports.help = {
        "name": "sendmessage",
        "aliases": [
            "sms"
        ],
        "usage": "sendmessage <@kullanıcı> <mesaj>",
        "description": "Bir kullanıcıya özel mesaj gönderir."
};
