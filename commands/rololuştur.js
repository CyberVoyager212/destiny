const { Permissions } = require('discord.js');

exports.execute = async (client, message, args) => {
    try {
        // Yardım komutu
        if (args[0] && args[0].toLowerCase() === 'help') {
            const permissionHelp = `
**Role Verebileceğiniz İzinler:**

- \`ADMINISTRATOR\`: Yönetici, tüm yetkilere sahip olur.
- \`MANAGE_GUILD\`: Sunucuyu yönetme izni.
- \`VIEW_AUDIT_LOG\`: Denetim kaydını görüntüleme izni.
- \`MANAGE_CHANNELS\`: Kanalları yönetme izni.
- \`MANAGE_ROLES\`: Rolleri yönetme izni.
- \`MANAGE_MESSAGES\`: Mesajları yönetme izni.
- \`MANAGE_EMOJIS\`: Emojileri yönetme izni.
- \`MANAGE_NICKNAMES\`: Takma adları yönetme izni.
- \`KICK_MEMBERS\`: Üyeleri atma izni.
- \`BAN_MEMBERS\`: Üyeleri yasaklama izni.
- \`MUTE_MEMBERS\`: Üyeleri susturma izni.
- \`DEAFEN_MEMBERS\`: Üyeleri sağırlaştırma izni.
- \`MOVE_MEMBERS\`: Üyeleri sesli kanallarda taşıma izni.
- \`CREATE_INSTANT_INVITE\`: Davet bağlantısı oluşturma izni.
- \`SEND_MESSAGES\`: Mesaj gönderme izni.
- \`SEND_TTS_MESSAGES\`: TTS (Text-To-Speech) mesajları gönderme izni.
- \`ATTACH_FILES\`: Dosya ekleme izni.
- \`EMBED_LINKS\`: Bağlantı ile embed (gömülü) mesaj gönderme izni.
- \`MENTION_EVERYONE\`: Tüm üyeleri etiketleme izni.
- \`USE_EXTERNAL_EMOJIS\`: Dış emoji kullanma izni.
- \`USE_EXTERNAL_STICKERS\`: Dış sticker kullanma izni.
- \`READ_MESSAGE_HISTORY\`: Mesaj geçmişini okuma izni.
- \`CONNECT\`: Sesli kanallara bağlanma izni.
- \`SPEAK\`: Sesli kanallarda konuşma izni.
- \`STREAM\`: Sesli kanallarda yayın yapma izni.
- \`PRIORITY_SPEAKER\`: Sesli kanalda konuşan diğer kişilere göre öncelikli konuşma izni.
- \`USE_VAD\`: Sesli kanalda varlık algılama (aktivite algılama) izni.
- \`MANAGE_WEBHOOKS\`: Webhookları yönetme izni.
- \`MANAGE_SERVER\`: Sunucunun genel ayarlarını yönetme izni.

**Kullanım:** 
\`!createrole <rol adı> <izin1> <izin2> ...\`

Örnek: \`!createrole Moderatör MANAGE_MESSAGES KICK_MEMBERS\`
            `;

            return message.channel.send(permissionHelp);
        }

        // Yetki kontrolü
        if (!message.member.permissions.has(Permissions.FLAGS.MANAGE_ROLES)) {
            return message.reply("❌ Bu komutu kullanmak için yeterli izniniz yok.");
        }

        const roleName = args[0]; // İlk argüman rol adı olacak
        const rolePermissions = args.slice(1); // Sonraki argümanlar izinler olacak

        if (!roleName) {
            return message.reply("❌ Lütfen eklemek istediğiniz rolün adını yazın.");
        }

        // Geçerli izinler
        const validPermissions = rolePermissions.map(perm => perm.toUpperCase());
        const permissions = validPermissions.filter(perm => Permissions.FLAGS[perm]);

        if (permissions.length === 0) {
            return message.reply("❌ Geçerli izinler girin. (Örnek: `MANAGE_MESSAGES`, `KICK_MEMBERS`)");
        }

        // Rol oluşturma işlemi
        const role = await message.guild.roles.create({
            name: roleName,
            color: 'BLUE', // Varsayılan renk
            permissions: permissions
        });

        return message.channel.send(`✅ ${role.name} rolü başarıyla eklendi. İzinler: ${permissions.join(', ')}`);
    } catch (error) {
        console.error("Rol oluşturulurken hata oluştu:", error);
        return message.reply("⚠️ Rol oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.");
    }
};

exports.help = {
    name: "createrole",
    aliases: [],
    usage: `createrole <rol adı> <izin1> <izin2> ... | createrole help`,
    description: "Sunucuda yeni bir rol oluşturur ve belirtilen izinleri atar."
};
