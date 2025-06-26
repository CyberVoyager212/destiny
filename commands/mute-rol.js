const { Client, Message } = require("discord.js");

exports.execute = async (client, message, args) => {
    try {
        // Yetki kontrolü
        if (!message.member.permissions.has('ADMINISTRATOR')) {
            return message.reply("🚫 | Bu komutu kullanmak için yetkiniz yok.");
        }

        const guild = message.guild;

        // **Mute rolünü kontrol et ve oluştur**
        let muteRole = guild.roles.cache.find(role => role.name === "Muted");
        if (!muteRole) {
            try {
                muteRole = await guild.roles.create({
                    name: 'Muted',
                    color: '#808080',  // Gri renk kodu
                    permissions: []
                });
                message.channel.send("✅ | **'Muted' rolü başarıyla oluşturuldu.**");
            } catch (error) {
                console.error("❌ | Mute rolü oluşturulurken hata oluştu:", error);
                return message.reply("❌ | Mute rolü oluşturulurken bir hata oluştu.");
            }
        } else {
            message.channel.send("ℹ️ | **'Muted' rolü zaten mevcut.**");
        }

        // **Kanallarda mute rolü için izinleri ayarla**
        guild.channels.cache.forEach(async (channel) => {
            try {
                await channel.permissionOverwrites.edit(muteRole, {
                    VIEW_CHANNEL: false,
                    SEND_MESSAGES: false,
                    ADD_REACTIONS: false,
                    SPEAK: false,
                    CONNECT: false
                });
            } catch (error) {
                console.error(`⚠️ | Kanal izinleri güncellenirken hata: ${channel.name}`, error);
            }
        });

        // **Mute kanalını kontrol et ve oluştur**
        let muteChannel = guild.channels.cache.find(channel => channel.name === "mute-channel");
        if (!muteChannel) {
            try {
                muteChannel = await guild.channels.create('mute-channel', {
                    type: 'GUILD_TEXT',
                    permissionOverwrites: [
                        {
                            id: guild.id,
                            deny: ['VIEW_CHANNEL'],
                        },
                        {
                            id: muteRole.id,
                            allow: ['VIEW_CHANNEL', 'READ_MESSAGE_HISTORY', 'SEND_MESSAGES'],
                        }
                    ]
                });
                message.channel.send(`✅ | **Mute kanalı oluşturuldu:** ${muteChannel.toString()}`);
            } catch (error) {
                console.error("❌ | Mute kanalı oluşturulurken hata oluştu:", error);
                return message.reply("❌ | Mute kanalı oluşturulurken bir hata oluştu.");
            }
        } else {
            message.channel.send(`ℹ️ | **Mute kanalı zaten mevcut:** ${muteChannel.toString()}`);
        }

    } catch (error) {
        console.error("⚠️ | Komut çalıştırılırken hata oluştu:", error);
        return message.reply("❌ | Komut çalıştırılırken bir hata oluştu, lütfen tekrar deneyin.");
    }
};

exports.help = {
    "name": "mute-rol-oluştur",
    "aliases": [
        "mr"
    ],
    "usage": "mute-rol-oluştur",
    "description": "Bir mute rolü oluşturur ve bu rolün yetkilerini ayarlar."
};
