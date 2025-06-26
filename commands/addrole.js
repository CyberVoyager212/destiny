exports.execute = async (client, message, args) => {
    // Kullanıcının 'MANAGE_ROLES' yetkisi olup olmadığını kontrol et
    if (!message.member.permissions.has('MANAGE_ROLES')) {
        return message.reply("❌ **Bu komutu kullanmak için `Rolleri Yönet` yetkiniz yok.**");
    }

    // Etiketlenen üye kontrolü
    const member = message.mentions.members.first();
    if (!member) {
        return message.reply("⚠️ **Lütfen rol verilecek kullanıcıyı etiketleyin.**");
    }

    // Etiketlenen rol kontrolü
    const role = message.mentions.roles.first();
    if (!role) {
        return message.reply("⚠️ **Lütfen verilecek rolü etiketleyin.**");
    }

    // Sunucu sahibine rol verilemiyor
    if (member.user.id === message.guild.ownerId) {
        return message.reply("🚫 **Sunucu sahibine rol verilemez.**");
    }

    // Kullanıcıya rol verilirken hata olursa
    try {
        await member.roles.add(role);
        return message.channel.send(`✅ **${member.user.tag}** kullanıcısına **${role.name}** rolü başarıyla verildi.`);
    } catch (error) {
        console.error(error);

        // Hata türüne göre mesaj gösterimi
        if (error.code === 50013) {
            return message.reply("🚫 **Bu kullanıcıyı tanımlayamadım veya yeterli yetkim yok.**");
        }

        return message.reply("❌ **Rol verilirken bir hata oluştu. Lütfen tekrar deneyin.**");
    }
};

exports.help = {
        "name": "addrole",
        "aliases": [
            "rolver"
        ],
        "usage": "addrole <@kullanıcı> <@rol>",
        "description": "Bir kullanıcıya belirtilen bir rol verir."
};
