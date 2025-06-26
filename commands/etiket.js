exports.execute = async (client, message, args) => {
    if (!message.member.permissions.has('MANAGE_MESSAGES')) {
        return message.reply("❌ | Bu komutu kullanmak için `Mesajları Yönet` yetkisine sahip olmalısınız!");
    }

    if (args.length < 3 || !['kullanıcı', 'rol'].includes(args[0].toLowerCase()) || !['kapat', 'aç'].includes(args[args.length - 1].toLowerCase())) {
        return message.reply("⚠️ | Geçersiz kullanım!\nÖrnekler:\n`k!etiket kullanıcı @kullanıcı kapat`\n`k!etiket rol @rol aç`");
    }

    const targetType = args[0].toLowerCase(); // "kullanıcı" veya "rol"
    const action = args[args.length - 1].toLowerCase(); // "kapat" veya "aç"

    let target = message.mentions.members.first() || 
                 message.guild.members.cache.get(args[1]) || 
                 message.guild.roles.cache.get(args[1]) ||
                 message.mentions.roles.first();

    if (!target) {
        return message.reply("❌ | Lütfen bir kullanıcı veya rol etiketleyin veya ID girin!");
    }

    try {
        const guildId = message.guild.id;
        const targetId = target.id;

        if (action === 'aç') {
            await client.db.delete(`etiketYasak_${guildId}_${targetId}`);
            return message.channel.send(`✅ | **Etiketleme açıldı!**\n📌 ${targetType === 'kullanıcı' ? target.toString() : target.name} artık etiketlenebilir.`);
        } else if (action === 'kapat') {
            await client.db.set(`etiketYasak_${guildId}_${targetId}`, true);
            return message.channel.send(`🚫 | **Etiketleme kapatıldı!**\n📌 ${targetType === 'kullanıcı' ? target.toString() : target.name} artık etiketlenemez.`);
        }
    } catch (error) {
        console.error("⚠️ | Etiketleme işleminde hata:", error);
        return message.reply("⚠️ | İşlem sırasında bir hata oluştu!");
    }
};

exports.help = {
    name: "etiket-yasakla",
    aliases: ["etiket"],
    usage: "etiket-yasakla kullanıcı/rol @kullanıcı/@rol kapat/aç",
    description: "Belirli kullanıcılar veya roller için etiket yasaklamayı açar veya kapatır."
};
