exports.execute = async (client, message, args) => {
    if (!message.member.permissions.has('MANAGE_CHANNELS')) {
        return message.reply("❌ **Bu komutu kullanmak için `Kanalları Yönet` yetkiniz olmalıdır.**");
    }

    // Kanalı belirle (eğer belirtilmediyse komutun çalıştırıldığı kanalı kullan)
    const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[0]) || message.channel;

    // Belirtilen roller veya kullanıcıları al
    const mentionedRoles = message.mentions.roles.map(role => role.id);
    const mentionedUsers = message.mentions.members.map(member => member.id);

    try {
        if (mentionedRoles.length > 0 || mentionedUsers.length > 0) {
            // Belirtilen roller veya kullanıcılar için kilidi aç
            mentionedRoles.forEach(async roleID => {
                await channel.permissionOverwrites.edit(roleID, { SEND_MESSAGES: true });
            });

            mentionedUsers.forEach(async userID => {
                await channel.permissionOverwrites.edit(userID, { SEND_MESSAGES: true });
            });

            return message.channel.send(`✅ **${channel}** kanalının kilidi açıldı! İzin verilenler: ${[...message.mentions.roles.map(r => r.name), ...message.mentions.members.map(m => m.user.tag)].join(", ")}`);
        } else {
            // Herkese kilidi aç
            await channel.permissionOverwrites.edit(message.guild.roles.everyone, { SEND_MESSAGES: true });
            return message.channel.send(`✅ **${channel}** kanalı herkes için açıldı!`);
        }
    } catch (error) {
        console.error(error);
        return message.reply("❌ **Kanalın kilidi açılırken bir hata oluştu.**");
    }
};

exports.help = {
    name: "unlock",
    aliases: ["kanal-aç"],
    usage: "unlock [#kanal] [@rol/@kullanıcı]",
    description: "Belirtilen kanalın kilidini açar. Belirli roller veya kullanıcılar etiketlenirse sadece onların mesaj atmasına izin verir."
};
