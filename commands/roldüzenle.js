const { MessageActionRow, MessageButton } = require('discord.js');

exports.execute = async (client, message, args) => {
    try {
        if (args[0] && args[0].toLowerCase() === 'help') {
            // Yardım mesajı
            const permissionHelp = `
**Rol Düzenlerken Kullanabileceğiniz İzinler ve Renk Kodları:**

**İzinler:**
- \`ADMINISTRATOR\`: Yönetici, tüm yetkilere sahip olur.
- \`MANAGE_CHANNELS\`: Kanalları yönetme izni.
- \`MANAGE_ROLES\`: Rolleri yönetme izni.
- \`KICK_MEMBERS\`: Üyeleri atma izni.
- \`BAN_MEMBERS\`: Üyeleri yasaklama izni.
- \`MANAGE_MESSAGES\`: Mesajları yönetme izni.
- \`VIEW_AUDIT_LOG\`: Denetim kaydını görüntüleme izni.
- \`MUTE_MEMBERS\`: Üyeleri susturma izni.
- \`MOVE_MEMBERS\`: Üyeleri ses kanalları arasında taşıma izni.

**Renk Kodları:**
- Renkler Hexadecimal kod formatında olmalıdır. Örneğin:
  - \`#FFFFFF\` (Beyaz)
  - \`#060606\` (Siyah)
  - \`#FF5733\` (Turuncu)

**Kullanım Örneği:**
\`editrole @Rol; yeniRolAdı; yeniİzinler; #RRGGBB\`

Örnek: \`editrole @Moderatör; YeniAd; MANAGE_MESSAGES,KICK_MEMBERS; #FF5733\`
            `;

            return message.channel.send(permissionHelp);
        }

        // Yetki kontrolü
        if (!message.member.permissions.has("MANAGE_ROLES")) {
            return message.reply("⚠️ Bu komutu kullanmak için yeterli izniniz yok.");
        }

        // Argümanları böl ve trim yap
        const [roleMention, newRoleName, newRolePermissions, newRoleColor] = args.join(" ").split(";").map(arg => arg.trim());
        if (!roleMention) {
            return message.reply("❌ Lütfen geçerli bir rol belirtin. Örnek: `editrole @Rol; yeniRolAdı; yeniİzinler; #FFFFFF`");
        }

        // Rolü al
        const role = message.mentions.roles.first();
        if (!role) {
            return message.reply("❌ Geçerli bir rol belirtmelisiniz.");
        }

        // Yeni ad ve renk ayarları
        const roleUpdateOptions = {};
        if (newRoleName) roleUpdateOptions.name = newRoleName; // Eğer ad girildiyse değiştir
        if (newRoleColor) roleUpdateOptions.color = newRoleColor; // Eğer renk girildiyse değiştir

        // Yeni izinler ayarları
        if (newRolePermissions) {
            const permissionsArray = newRolePermissions.split(",").map(permission => permission.trim().toUpperCase());
            roleUpdateOptions.permissions = permissionsArray;
        }

        // Boş bırakılan alanlar değiştirilmez
        await role.edit(roleUpdateOptions);

        // Başarılı işlem mesajı
        return message.channel.send(`✅ **${role.name}** rolü başarıyla düzenlendi! Yeni ad: ${newRoleName || role.name}, Yeni izinler: ${newRolePermissions || "Değişmedi"}, Yeni renk: ${newRoleColor || "Değişmedi"}.`);
    } catch (error) {
        console.error("Rol düzenlenirken bir hata oluştu:", error);
        return message.reply("⚠️ Rol düzenlenirken bir hata oluştu. Lütfen tekrar deneyin.");
    }
};

exports.help = {
        "name": "editrole",
        "aliases": [
            "roleedit",
            "rolguncelle"
        ],
        "usage": "editrole <@Rol; yeniRolAdı; yeniİzinler; #RRGGBB> | editrole help",
        "description": "Bir rolün adını, izinlerini ve rengini düzenler."
};
