exports.execute = async (client, message, args) => {
    try {
        // Yetki kontrolü
        if (!client.config.admins.includes(message.author.id)) {
            return message.reply("⛔ **Bu komutu kullanma iznin yok!**");
        }

        // Kullanıcıyı al
        let user = message.mentions.users.first();
        if (!user) {
            return message.reply("👤 **Lütfen bir kullanıcı etiketleyin!**\n\nÖrnek kullanım: `k!removeitem @kullanıcı Elmas` ");
        }

        // Eşya adı
        let itemName = args[1];
        if (!itemName) {
            return message.reply("📜 **Lütfen silmek istediğiniz eşyanın adını belirtin!**\n\nÖrnek: `k!removeitem @kullanıcı Elmas` ");
        }

        // Kullanıcının envanterini al
        let inventoryKey = `inventory_${user.id}`;
        let inventory = client.db.get(inventoryKey) || [];
        
        // Envanterde eşya var mı kontrol et
        let itemIndex = inventory.findIndex(item => item.name.toLowerCase() === itemName.toLowerCase());
        if (itemIndex === -1) {
            return message.reply(`❌ **${user.username} kullanıcısının envanterinde \\"${itemName}\\" bulunamadı!**`);
        }

        // Eşyayı envanterden kaldır
        let removedItem = inventory.splice(itemIndex, 1)[0];
        client.db.set(inventoryKey, inventory);

        // Başarı mesajı
        return message.channel.send(`✅ **${user.username} kullanıcısından eşya silindi!**\n\n🗑️ **Silinen Eşya:** ${removedItem.emoji} ${removedItem.name}`);
    
    } catch (error) {
        console.error(error);
        return message.reply("❌ **Bir hata oluştu, lütfen tekrar deneyin!**");
    }
};

exports.help = {
    "name": "removeitem",
    "aliases": [],
    "usage": "removeitem @user <item_name>",
    "description": "Kullanıcının envanterinden bir eşyayı siler."
};
