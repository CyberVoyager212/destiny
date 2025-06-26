const muteTimers = new Map(); // muteTimers değişkenini ekledik

exports.execute = async (client, message, args) => {
    if (!message.member.permissions.has('MANAGE_ROLES')) {
        return message.reply("🚫 | Bu komutu kullanmak için `MANAGE_ROLES` yetkiniz yok.");
    }

    const member = message.mentions.members.first() ||
                   message.guild.members.cache.get(args[0]) ||
                   message.guild.members.cache.find(m => m.user.username.toLowerCase() === args[0]?.toLowerCase());

    if (!member) {
        return message.reply("⚠️ | Lütfen susturması kaldırılacak kullanıcıyı belirtin.");
    }

    const muteRole = message.guild.roles.cache.find(role => role.name === "Muted");
    if (!muteRole) {
        return message.reply("❌ | `Muted` rolü bulunamadı, lütfen oluşturun.");
    }

    try {
        const muteData = client.db.get(`mute_${message.guild.id}_${member.id}`);

        if (!muteData) {
            return message.reply("🔊 | Bu kullanıcı zaten susturulmamış.");
        }

        clearTimeout(muteTimers.get(member.id)); // Zamanlayıcıyı iptal et
        muteTimers.delete(member.id); // Map'ten kaldır

        const roles = muteData.roles.map(roleId => message.guild.roles.cache.get(roleId));

        await member.roles.remove(muteRole);
        await member.roles.add(roles);

        client.db.delete(`mute_${message.guild.id}_${member.id}`); // Veritabanından mute kaydını sil

        return message.channel.send(`🔊 | **${member.user.tag}** kullanıcısının susturması kaldırıldı.`);
    } catch (error) {
        console.error("⚠️ | Susturma kaldırılırken hata oluştu:", error);
        return message.reply("❌ | Kullanıcının susturması kaldırılırken bir hata oluştu, lütfen tekrar deneyin.");
    }
};

exports.help = {
    name: "unmute",
    aliases: [],
    usage: "unmute <@kullanıcı / ID / isim>",
    description: "Belirtilen kullanıcının susturmasını kaldırır."
};
