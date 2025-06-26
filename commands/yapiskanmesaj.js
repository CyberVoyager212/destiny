exports.execute = async (client, message, args) => {
    // Kullanıcının ADMINISTRATOR yetkisini kontrol et
    if (!message.member.permissions.has('ADMINISTRATOR')) {
        return message.reply("❌ **Bu komutu kullanmak için `Yönetici` yetkiniz yok.**");
    }

    // Alt komut kontrolü: ekle, sil, list
    const subcommand = args[0];
    if (!subcommand) {
        return message.reply("⚠️ **Lütfen bir alt komut belirtin: ekle, sil veya list.**");
    }

    if (subcommand.toLowerCase() === "ekle") {
        // Kullanım: yapiskanmesaj ekle <#kanal> <mesaj>
        const channel = message.mentions.channels.first();
        if (!channel) {
            return message.reply("⚠️ **Lütfen mesajın gönderileceği kanalı etiketleyin!**");
        }
        // Kanal etiketinden sonra gönderilecek mesajı alıyoruz (args[2] ve sonrası)
        const stickyMessage = args.slice(2).join(" ");
        if (!stickyMessage) {
            return message.reply("⚠️ **Lütfen gönderilecek yapışkan mesajı yazın!**");
        }
        try {
            // Mesajı belirlenen kanala gönder
            const sentMessage = await channel.send(`${stickyMessage}`);
            
            // Veritabanına kaydet (kanal ID'si ve mesaj ID'si)
            client.db.set(`stickyMessage_${channel.id}`, {
                messageId: sentMessage.id,
                content: stickyMessage
            });

            return message.reply(`✅ **Yapışkan mesaj başarıyla ${channel} kanalına ayarlandı!**`);
        } catch (error) {
            console.error("Yapışkan mesaj gönderilirken hata oluştu:", error);
            return message.reply("❌ **Yapışkan mesaj ayarlanırken bir hata oluştu. Lütfen tekrar deneyin.**");
        }
    } else if (subcommand.toLowerCase() === "sil") {
        // Kullanım: yapiskanmesaj sil <#kanal>
        const channel = message.mentions.channels.first();
        if (!channel) {
            return message.reply("⚠️ **Lütfen silinecek yapışkan mesajın bulunduğu kanalı etiketleyin!**");
        }
        // Kanal için veritabanında kayıtlı yapışkan mesaj var mı?
        const stickyData = client.db.get(`stickyMessage_${channel.id}`);
        if (!stickyData) {
            return message.reply("⚠️ **Bu kanalda ayarlanmış bir yapışkan mesaj bulunamadı.**");
        }
        try {
            // Opsiyonel: Gerçek mesajı da silmek isterseniz, fetch edip silmeyi deneyebilirsiniz.
            // Şimdilik sadece veritabanı kaydını kaldırıyoruz.
            client.db.delete(`stickyMessage_${channel.id}`);
            return message.reply(`✅ **${channel} kanalındaki yapışkan mesaj başarıyla kaldırıldı!**`);
        } catch (error) {
            console.error("Yapışkan mesaj silinirken hata oluştu:", error);
            return message.reply("❌ **Yapışkan mesaj silinirken bir hata oluştu. Lütfen tekrar deneyin.**");
        }
    } else if (subcommand.toLowerCase() === "list") {
        // Kullanım: yapiskanmesaj list
        // Veritabanındaki tüm sticky mesaj kayıtlarını alıyoruz.
        let allEntries = client.db.all();
        // Sadece "stickyMessage_" ile başlayan anahtarları filtrele
        let stickyEntries = allEntries.filter(entry => entry.ID.startsWith("stickyMessage_"));
        if (!stickyEntries.length) {
            return message.reply("⚠️ **Ayarlanmış yapışkan mesaj bulunamadı.**");
        }
        let listMessage = "📌 **Ayarlanmış Yapışkan Mesajlar:**\n";
        for (let entry of stickyEntries) {
            let channelId = entry.ID.split("_")[1];
            let data = entry.data;
            listMessage += `<#${channelId}>: ${data.content}\n`;
        }
        return message.reply(listMessage);
    } else {
        return message.reply("⚠️ **Geçersiz alt komut! Lütfen 'ekle', 'sil' veya 'list' kullanın.**");
    }
};

exports.help = {
    name: "yapiskanmesaj",
    aliases: ["sticky", "sabit"],
    usage: "yapiskanmesaj <ekle|sil|list> [kanal] [mesaj]",
    description: "Belirtilen kanala yapışkan mesaj gönderir, kaldırır veya ayarlanmış yapışkan mesajları listeler."
};
