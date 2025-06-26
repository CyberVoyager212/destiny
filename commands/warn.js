const db = require("quick.db");

exports.execute = async (client, message, args) => {
    if (!message.member.permissions.has("MANAGE_MESSAGES")) {
        return message.reply("❌ **Bu komutu kullanmak için `Mesajları Yönet` yetkiniz yok.**");
    }

    const user = message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.guild.members.cache.find(m => m.user.username.toLowerCase() === args[0]?.toLowerCase());
    if (!user) {
        return message.reply("⚠️ **Lütfen uyarı vermek istediğiniz kullanıcıyı belirtin. (@kullanıcı / ID / isim)**");
    }

    if (user.user.bot) {
        return message.reply("🤖 **Botları uyaramazsınız!**");
    }

    const reason = args.slice(1).join(" ") || "Sebep belirtilmedi.";
    let warnings = db.get(`warnings_${message.guild.id}_${user.id}`) || [];

    warnings.push({ admin: message.author.id, reason });
    db.set(`warnings_${message.guild.id}_${user.id}`, warnings);

    await message.channel.send(`⚠️ **${user.user.tag}** kullanıcısına uyarı verildi. (Toplam uyarı sayısı: ${warnings.length})`);

    if (warnings.length >= 5) {
        try {
            let warnDetails = warnings.map((w, i) => `**${i + 1}.** <@${w.admin}>`).join("\n");
            await user.send(`🚨 **5 uyarı aldığın için sunucudan banlandın.**\n**Hata olduğunu düşünüyorsan sana uyarı veren adminlere danışabilirsin:**\n${warnDetails}`);
            await user.ban({ reason: "5 uyarıya ulaştı." });

            db.delete(`warnings_${message.guild.id}_${user.id}`);
            message.channel.send(`🔨 **${user.user.tag}** 5 uyarıya ulaştığı için sunucudan banlandı.`);
        } catch (error) {
            console.error(error);
            message.channel.send("❌ **Kullanıcıyı banlarken bir hata oluştu.**");
        }
    }
};

exports.help = {
    "name": "warn",
    "aliases": ["uyar"],
    "usage": "warn <@kullanıcı / ID / isim> [sebep]",
    "description": "Belirtilen kullanıcıya uyarı verir."
};
