exports.execute = async (client, message, args) => {
    try {
        // Yetki kontrolü
        if (!client.config.admins.includes(message.author.id)) {
            return message.reply("⛔ **Bu komutu kullanma iznin yok!**");
        }

        // Kullanıcıyı al
        let user = message.mentions.users.first();
        if (!user) {
            return message.reply("👤 **Lütfen bir kullanıcı etiketleyin!**\n\nÖrnek kullanım: `k!additem @kullanıcı Elmas 💎 1000`");
        }

        // Eşya adı
        let itemName = args[1];
        if (!itemName) {
            return message.reply("📜 **Lütfen eklemek istediğiniz eşyanın adını belirtin!**\n\nÖrnek: `k!additem @kullanıcı Elmas 💎 1000`");
        }

        // Emoji
        let itemEmoji = args[2];
        if (!itemEmoji) {
            return message.reply("😊 **Lütfen eşyanın bir emojisini belirtin!**\n\nÖrnek: `k!additem @kullanıcı Elmas 💎 1000`");
        }

        // Değer kontrolü
        let itemValue = args[3];
        if (!itemValue || isNaN(itemValue)) {
            return message.reply("💰 **Lütfen geçerli bir değer girin!**\n\nÖrnek: `k!additem @kullanıcı Elmas 💎 1000`");
        }

        // Yeni eşya oluştur
        let newItem = {
            name: itemName,
            emoji: itemEmoji,
            value: parseInt(itemValue)
        };

        // Kullanıcının envanterine eşyayı ekle
        let inventoryKey = `inventory_${user.id}`;
        let inventory = client.db.get(inventoryKey) || [];
        inventory.push(newItem);
        client.db.set(inventoryKey, inventory);

        // Başarı mesajı
        return message.channel.send(`✅ **${user.username} kullanıcısına yeni eşya eklendi!**\n\n🆕 **Eşya:** ${newItem.emoji} ${newItem.name}\n💰 **Değer:** ${newItem.value}`);
    
    } catch (error) {
        console.error(error);
        return message.reply("❌ **Bir hata oluştu, lütfen tekrar deneyin!**");
    }
};

exports.help = {
        "name": "additem",
        "aliases": [],
        "usage": "additem @user <item_name> <item_emoji> <item_value>",
        "description": "Kullanıcıya envanterine yeni bir eşya ekler."
};
