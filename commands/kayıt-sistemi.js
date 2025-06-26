exports.execute = async (client, message, args) => {
    try {
        if (!message.member.permissions.has('ADMINISTRATOR')) {
            return message.reply("⛔ **Bu komutu kullanmak için yönetici iznine sahip olmalısınız!**");
        }

        const subCommand = args[0];

        if (!subCommand || !["kur", "sil", "otoisim"].includes(subCommand)) {
            return message.reply("⚠ **Geçerli bir alt komut belirtmelisiniz:** `kur`, `sil` veya `otoisim`.\n\n📝 **Örnek:** `k!kayıtsistemi kur`");
        }

        if (subCommand === "kur") {
            let kayitsizRolName = "Kayıtsız";
            let kayitsizKanalName = "kayıtsızlar";
            let yetkiliRolName = "Yetkili";

            if (args.length >= 4) {
                kayitsizRolName = args[1];
                kayitsizKanalName = args[2];
                yetkiliRolName = args[3];
            }

            const startTime = Date.now();

            let kayitsizRol = message.guild.roles.cache.find(r => r.name === kayitsizRolName);
            if (!kayitsizRol) {
                kayitsizRol = await message.guild.roles.create({
                    name: kayitsizRolName,
                    color: '#808080', // Gri renk
                    permissions: []
                });
            } // **Eksik kapanan if bloğunu düzelttim.**

            let yetkiliRol = message.guild.roles.cache.find(r => r.name === yetkiliRolName);
            if (!yetkiliRol) {
                yetkiliRol = await message.guild.roles.create({
                    name: yetkiliRolName,
                    color: '#0000FF', // Mavi renk
                    permissions: ['MANAGE_ROLES', 'MANAGE_CHANNELS', 'KICK_MEMBERS', 'BAN_MEMBERS']
                });
            } // **Eksik kapanan if bloğunu düzelttim.**

            let kayitsizKanal = message.guild.channels.cache.find(c => c.name === kayitsizKanalName);
            if (!kayitsizKanal) {
                kayitsizKanal = await message.guild.channels.create(kayitsizKanalName, {
                    type: 'GUILD_TEXT',
                    permissionOverwrites: [
                        { id: message.guild.id, deny: ['VIEW_CHANNEL'] },
                        { id: kayitsizRol.id, allow: ['VIEW_CHANNEL'] },
                        ...(yetkiliRol ? [{ id: yetkiliRol.id, allow: ['VIEW_CHANNEL'] }] : [])
                    ]
                });
            }

            const feedbackMessage = await message.channel.send("⏳ **Kayıtsız rolünün izinleri güncelleniyor, lütfen bekleyin...**");

            const channels = Array.from(message.guild.channels.cache.values());
            for (let i = 0; i < channels.length; i++) {
                if (channels[i].id !== kayitsizKanal.id) {
                    await channels[i].permissionOverwrites.edit(kayitsizRol, { VIEW_CHANNEL: false });
                }
            }

            client.db.set(`kayitsizRol_${message.guild.id}`, kayitsizRol.id);
            client.db.set(`kayitsizKanal_${message.guild.id}`, kayitsizKanal.id);
            client.db.set(`yetkiliRol_${message.guild.id}`, yetkiliRol ? yetkiliRol.id : null);

            const endTime = Date.now();
            const duration = ((endTime - startTime) / 1000).toFixed(2);
            const timeString = `${duration} saniye`;

            return feedbackMessage.edit(`✅ **Kayıt Sistemi Başarıyla Kuruldu!** 🎉\n\n📌 **Komutu kullanan:** ${message.author.tag}\n🕒 **İşlem süresi:** ${timeString}\n👥 **Kayıtsız Rolü:** ${kayitsizRol.name}\n📢 **Kayıtsız Kanalı:** ${kayitsizKanal.name}\n🔧 **Yetkili Rolü:** ${yetkiliRol ? yetkiliRol.name : "Yok"}`);
        } 
        
        else if (subCommand === "sil") {
            const kayitsizRolID = client.db.get(`kayitsizRol_${message.guild.id}`);
            const kayitsizKanalID = client.db.get(`kayitsizKanal_${message.guild.id}`);
            const yetkiliRolID = client.db.get(`yetkiliRol_${message.guild.id}`);

            let kayitsizRolName = "Kayıtsız";
            let kayitsizKanalName = "kayıtsızlar";
            let yetkiliRolName = "Yetkili";

            if (kayitsizRolID) {
                const kayitsizRol = message.guild.roles.cache.get(kayitsizRolID);
                if (kayitsizRol) {
                    kayitsizRolName = kayitsizRol.name;
                    await kayitsizRol.delete();
                }
                client.db.delete(`kayitsizRol_${message.guild.id}`);
            }

            if (kayitsizKanalID) {
                const kayitsizKanal = message.guild.channels.cache.get(kayitsizKanalID);
                if (kayitsizKanal) {
                    kayitsizKanalName = kayitsizKanal.name;
                    await kayitsizKanal.delete();
                }
                client.db.delete(`kayitsizKanal_${message.guild.id}`);
            }

            if (yetkiliRolID) {
                const yetkiliRol = message.guild.roles.cache.get(yetkiliRolID);
                if (yetkiliRol) yetkiliRolName = yetkiliRol.name;
                client.db.delete(`yetkiliRol_${message.guild.id}`);
            }

            return message.channel.send(`❌ **Kayıt Sistemi Başarıyla Silindi!** 🗑️\n\n📌 **Komutu kullanan:** ${message.author.tag}\n👥 **Silinen Rol:** ${kayitsizRolName}\n📢 **Silinen Kanal:** ${kayitsizKanalName}\n🔧 **Yetkili Rolü:** ${yetkiliRolName}`);
        } 
        
        else if (subCommand === "otoisim") {
            const defaultName = args.slice(1).join(" ");
            if (!defaultName) {
                return message.reply("⚠ **Geçerli bir varsayılan isim belirtmelisiniz!**\n\n📝 **Örnek:** `k!kayıtsistemi otoisim YeniÜye`");
            }

            client.db.set(`autoName_${message.guild.id}`, defaultName);

            return message.channel.send(`✅ **Otomatik İsim Ayarlandı!** 🎭\n\n📌 **Komutu kullanan:** ${message.author.tag}\n👤 **Yeni Varsayılan İsim:** ${defaultName}`);
        }
    } catch (error) {
        console.error(error);
        if (error.message.includes('Missing Permissions')) {
            return message.reply("❌ **Botun gerekli izinleri yok!** Lütfen sunucu yöneticinize danışın.");
        }
        return message.reply("❌ **Kayıt sistemi işlemi sırasında bir hata oluştu.** Lütfen tekrar deneyin!");
    }
};

exports.help = {
        "name": "kayıtsistemi",
        "aliases": [
            "ks"
        ],
        "usage": "kayıtsistemi kur <rol adı> <kanal adı> <yetkili rol adı> / kayıtsistemi sil / kayıtsistemi otoisim <varsayılan isim>",
        "description": "Kayıt sistemi ayarlarını yönetir, rol ve kanal ayarlarını yapılandırır."
};
