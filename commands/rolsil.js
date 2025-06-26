const { Permissions } = require('discord.js');

exports.execute = async (client, message, args) => {
    try {
        // Yetki kontrolü
        if (!message.member.permissions.has(Permissions.FLAGS.MANAGE_ROLES)) {
            return message.reply("❌ Bu komutu kullanmak için yeterli izniniz yok.");
        }

        const roleName = args.join(" ");
        if (!roleName) {
            return message.reply("❌ Lütfen silinecek rolün adını yazın.");
        }

        // Rolü bulma
        const role = message.guild.roles.cache.find(role => role.name === roleName);
        if (!role) {
            return message.reply("❌ Bu isimde bir rol bulunamadı.");
        }

        // Rolü silme
        await role.delete();
        return message.channel.send(`✅ **${role.name}** rolü başarıyla silindi.`);

    } catch (error) {
        console.error("Rol silinirken hata oluştu:", error);
        return message.reply("⚠️ Rol silinirken bir hata oluştu. Lütfen tekrar deneyin.");
    }
};

exports.help = {
        "name": "deleterole",
        "aliases": [],
        "usage": "deleterole <rol adı>",
        "description": "Belirtilen rolü siler."
};
