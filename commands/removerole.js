exports.execute = async (client, message, args) => {
    try {
        if (!message.member.permissions.has('MANAGE_ROLES')) {
            return message.reply("Bu komutu kullanmak için yetkiniz yok. ⚠️");
        }

        const member = message.mentions.members.first();
        const role = message.mentions.roles.first();

        if (!member) {
            return message.reply("Lütfen rol alınacak kullanıcıyı etiketleyin. 👤");
        }

        if (!role) {
            return message.reply("Lütfen alınacak rolü etiketleyin. 🎭");
        }

        if (member.roles.cache.has(role.id)) {
            await member.roles.remove(role);
            message.reply(`${member.user.tag} kullanıcısından **${role.name}** rolü başarıyla alındı. ✔️`);
        } else {
            return message.reply(`${member.user.tag} kullanıcısında **${role.name}** rolü bulunmuyor. ❌`);
        }
    } catch (error) {
        console.error("Rol alınırken bir hata oluştu:", error);
        message.reply("⚠️ | Rol alınırken bir hata oluştu. Lütfen tekrar deneyin.");
    }
};

exports.help = {
        "name": "removerole",
        "aliases": [
            "rolal"
        ],
        "usage": "removerole <@kullanıcı> <@rol>",
        "description": "Belirtilen kullanıcıdan bir rolü kaldırır."
};
