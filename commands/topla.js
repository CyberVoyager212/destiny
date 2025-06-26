const { MessageEmbed } = require("discord.js"); // EmbedBuilder yerine MessageEmbed kullanıyoruz
const { items } = require("../index.js"); // index.js dosyasından eşyalar alındı

exports.execute = async (client, message, args) => {
    try {
        const user = message.author;
        const cooldownKey = `cooldown_${user.id}`;
        const inventoryKey = `inventory_${user.id}`;
        const currentTime = Date.now();

        // Check cooldown time
        const cooldown = client.db.get(cooldownKey) || 0;

        if (cooldown > currentTime) {
            const timeLeft = Math.ceil((cooldown - currentTime) / 1000);
            return message.reply(`⏳ Bir dahaki toplama işlemi için ${timeLeft} saniye beklemelisin.`);
        }

        // Check if 'items' is properly defined and not empty
        if (!Array.isArray(items) || items.length === 0) {
            return message.reply("⚠️ Eşyalar listesi şu anda boş! Lütfen yöneticinizle iletişime geçin.");
        }

        // Randomly select items
        const item = items[Math.floor(Math.random() * items.length)];
        const quantity = Math.floor(Math.random() * 5) + 1; // Random quantity between 1 and 5

        // Add items to user's inventory
        const inventory = client.db.get(inventoryKey) || [];
        for (let i = 0; i < quantity; i++) {
            inventory.push(item);
        }
        client.db.set(inventoryKey, inventory);

        // Set new cooldown time
        let cooldownTime = 20000; // 20 seconds
        client.db.set(cooldownKey, currentTime + cooldownTime);

        // Display result to user with emojis
        const embed = new MessageEmbed() // MessageEmbed kullanıyoruz
            .setTitle("🎉 Eşya Toplama")
            .setDescription(`Topladığın eşyalar: ${quantity}x ${item.emoji} **${item.name}**`)
            .setColor("GREEN")
            .setTimestamp();

        return message.channel.send({ embeds: [embed] });
    } catch (error) {
        console.error("Hata:", error);
        return message.reply("❌ Bir hata oluştu, lütfen tekrar deneyin.");
    }
};

exports.help = {
    name: "topla",
    aliases: [],
    usage: "topla",
    description: "Rastgele bir eşya toplar ve envanterinize ekler."
};