const { Permissions } = require("discord.js");

exports.execute = async (client, message, args) => {
    try {
        // ✅ Yetki kontrolü
        if (!message.member.permissions.has(Permissions.FLAGS.KICK_MEMBERS)) {
            return message.reply("❌ **Bu komutu kullanmak için `Üyeleri At` yetkisine sahip olmalısınız!**");
        }

        // ✅ Kullanıcıyı bul
        let target = message.mentions.users.first() || await client.users.fetch(args[0]).catch(() => null);
        if (!target) {
            return message.reply("🚨 **Lütfen atmak istediğiniz kullanıcıyı etiketleyin veya geçerli bir ID girin!**");
        }

        // ✅ Kullanıcı sunucuda mı?
        let member = message.guild.members.cache.get(target.id);
        if (!member) {
            return message.reply("🔍 **Belirtilen kullanıcı bu sunucuda bulunmuyor!**");
        }

        // ✅ Yetki karşılaştırması
        if (member.roles.highest.position >= message.member.roles.highest.position) {
            return message.reply("⚠ **Bu kullanıcıyı atamazsınız çünkü rolü sizden yüksek veya eşit!**");
        }

        // ✅ Bot atabiliyor mu?
        if (!member.kickable) {
            return message.reply("⛔ **Bu kullanıcıyı atamıyorum, yeterli yetkim yok!**");
        }

        // ✅ Sebep belirleme
        let reason = args.slice(1).join(" ") || "Belirtilmemiş";

        // ✅ Kullanıcıyı at
        await member.kick(reason);

        // ✅ Başarı mesajı gönder
        return message.channel.send(`✅ **${target.tag} adlı kullanıcı başarıyla atıldı!**\n📌 **Sebep:** ${reason}\n👮‍♂️ **Atan yetkili:** ${message.author.tag}`);
        
    } catch (error) {
        console.error("Kick Komutu Hatası:", error);
        
        // ✅ Özel hata mesajları
        if (error.message.includes("Missing Permissions")) {
            return message.reply("🚫 **Bu işlemi gerçekleştirmek için yeterli yetkim yok!**");
        }

        return message.reply("⚠ **Bir hata oluştu, lütfen tekrar deneyin!**");
    }
};

exports.help = {
        "name": "at",
        "aliases": [
            "kick"
        ],
        "usage": "at <@kullanıcı> [sebep]",
        "description": "Bir kullanıcıyı sunucudan atar, isteğe bağlı olarak sebep belirtilebilir."
};
