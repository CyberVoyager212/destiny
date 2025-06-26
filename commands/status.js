const { MessageActionRow, MessageButton } = require("discord.js");

exports.execute = async (client, message, args) => {
    try {
        // Botun admin listesini kontrol et
        if (!client.config.admins.includes(message.author.id)) {
            return message.reply("❌ **Bu komutu sadece yöneticiler kullanabilir.**");
        }

        // Kullanıcının argümanları kontrol et
        if (args.length < 2) {
            return message.reply("⚠️ **Lütfen bir durum türü (playing, streaming, listening, watching, online, idle, dnd, invisible) ve bir durum mesajı girin.**");
        }

        // Durum türünü ve mesajı ayır
        const activityType = args[0].toLowerCase();
        const statusMessage = args.slice(1).join(" ");

        // Geçerli durum türlerini kontrol et
        const validActivityTypes = ["playing", "streaming", "listening", "watching"];
        const validStatusTypes = ["online", "idle", "dnd", "invisible"];
        
        let activity;

        if (validActivityTypes.includes(activityType)) {
            switch (activityType) {
                case "playing":
                    activity = "PLAYING";
                    break;
                case "streaming":
                    activity = "STREAMING";
                    break;
                case "listening":
                    activity = "LISTENING";
                    break;
                case "watching":
                    activity = "WATCHING";
                    break;
                default:
                    throw new Error("Geçersiz aktivite türü");
            }

            // Botun aktivite durumunu güncelle
            await client.user.setActivity(statusMessage, { 
                type: activity, 
                url: activityType === "streaming" ? "https://twitch.tv/streamer" : undefined 
            });

            message.reply(`✅ **Durum başarıyla "${activityType}" olarak "${statusMessage}" mesajı ile güncellendi.**`);

        } else if (validStatusTypes.includes(activityType)) {
            // Botun çevrimiçi durumunu güncelle
            await client.user.setStatus(activityType);
            message.reply(`✅ **Botun çevrimiçi durumu başarıyla "${activityType}" olarak güncellendi.**`);
        } else {
            throw new Error(`Geçersiz durum türü. Geçerli türler: ${validActivityTypes.join(", ")} ve ${validStatusTypes.join(", ")}`);
        }

    } catch (error) {
        console.error(error);
        // Hata mesajını kullanıcıya göster
        return message.reply(`❌ **Hata:** ${error.message}`);
    }
};

exports.help = {
    name: "status",
    aliases: ["setstatus", "durum"],
    usage: "status <playing|streaming|listening|watching|online|idle|dnd|invisible> <mesaj>",
    description: "Botun durumunu veya çevrimiçi durumunu değiştirir. Sadece yöneticiler kullanabilir."
};
