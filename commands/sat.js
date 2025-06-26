const { Permissions } = require('discord.js');

exports.execute = async (client, message, args) => {
    try {
        let user = message.author;

        // Kullanıcı envanteri
        let inventory = client.db.get(`inventory_${user.id}`) || [];
        if (inventory.length === 0) {
            return message.reply("🛒 **Envanterinizde satacak bir şey yok.**");
        }

        // Eşyaları id'sine göre gruplandır
        let groupedItems = inventory.reduce((acc, item) => {
            acc[item.id] = (acc[item.id] || 0) + 1;
            return acc;
        }, {});

        // Toplam kazanç
        let totalEarnings = 0;

        // Eşya bilgilerini topla
        let itemMessage = "🛍️ **Envanterinizdeki Eşyalar ve Fiyatları:**\n";
        for (let itemId in groupedItems) {
            let item = inventory.find(i => i.id === parseInt(itemId));
            
            if (!item) {
                console.error(`Item with ID ${itemId} not found in inventory`);
                continue; // Bu item bulunamadığında atla
            }

            let itemCount = groupedItems[itemId];
            let itemValue = item.value * itemCount;
            totalEarnings += itemValue;
            itemMessage += `\n${item.emoji} **${item.name}** - Miktar: ${itemCount}, Toplam Değer: ${itemValue} <:Destinex:1347644229333028864>`;
        }

        if (itemMessage === "🛍️ **Envanterinizdeki Eşyalar ve Fiyatları:**\n") {
            return message.reply("🛒 **Envanterinizde satacak bir şey yok.**");
        }

        // Eşyaları sat ve bakiyeyi güncelle
        client.eco.addMoney(user.id, totalEarnings);
        client.db.set(`inventory_${user.id}`, []); // Envanteri temizle

        // Toplam kazancı gösteren mesaj
        itemMessage += `\n\n**Toplam Kazanç: ${totalEarnings} <:Destinex:1347644229333028864>**`;

        return message.channel.send(itemMessage);

    } catch (error) {
        console.error('Error occurred while processing the "sat" command:', error);
        return message.reply("⚠️ **Bir hata oluştu, lütfen tekrar deneyin.**");
    }
};

exports.help = {
        "name": "sat",
        "aliases": [],
        "usage": "sat",
        "description": "Ürün satış işlemi başlatır."
};
