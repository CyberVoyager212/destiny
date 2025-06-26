exports.execute = async (client, message, args) => {
    try {
        const user = message.author;
        const inventoryKey = `inventory_${user.id}`;
        const items = client.db.get(inventoryKey);

        if (!items || items.length === 0) {
            return message.reply("🛍️ **Envanterin boş!** Toplamak için `k!huntbot` veya `k!topla` kullanabilirsin.");
        }

        // Eşyaları gruplandır ve miktarları hesapla
        const itemCounts = items.reduce((countMap, item) => {
            const key = `${item.emoji} ${item.name}`;
            countMap[key] = (countMap[key] || 0) + 1;
            return countMap;
        }, {});

        // Envanter mesajını oluştur
        let inventoryMessage = `📦 **${user.username}'in Envanteri** 📦\n\n`;
        Object.entries(itemCounts).forEach(([itemName, count]) => {
            inventoryMessage += `🔹 **${itemName}** - Miktar: **${count}**\n`;
        });

        // Kullanıcıya mesaj gönder
        return message.channel.send(inventoryMessage);
    } catch (error) {
        console.error(error);
        return message.reply("❌ **Envanterin görüntülenirken bir hata oluştu!** Lütfen tekrar dene.");
    }
};

exports.help = {
        "name": "inventory",
        "aliases": [
            "env"
        ],
        "usage": "env",
        "description": "Kullanıcının envanterindeki eşyaları gösterir."
};
