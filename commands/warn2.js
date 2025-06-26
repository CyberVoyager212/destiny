const db = require("quick.db");

exports.execute = async (client, message, args) => {
    if (!message.member.permissions.has("MANAGE_MESSAGES")) {
        return message.reply("❌ **Bu komutu kullanmak için `Mesajları Yönet` yetkiniz yok.**");
    }

    const user = message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.guild.members.cache.find(m => m.user.username.toLowerCase() === args[0]?.toLowerCase());
    if (!user) {
        return message.reply("⚠️ **Lütfen uyarılarını görmek istediğiniz kullanıcıyı belirtin. (@kullanıcı / ID / isim)**");
    }

    let warnings = db.get(`warnings_${message.guild.id}_${user.id}`) || [];
    if (warnings.length === 0) {
        return message.reply("✅ **Bu kullanıcının hiçbir uyarısı yok.**");
    }

    let warnList = warnings.map((w, i) => `**${i + 1}.** <@${w.admin}> tarafından - ${w.reason}`).join("\n");

    message.channel.send(`⚠️ **${user.user.tag}** kullanıcısının uyarıları:\n${warnList}`);
};

exports.help = {
    "name": "warnings",
    "aliases": ["uyarılar"],
    "usage": "warnings <@kullanıcı / ID / isim>",
    "description": "Belirtilen kullanıcının uyarılarını listeler."
};
