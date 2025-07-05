const { Permissions, MessageEmbed } = require("discord.js");

function chooseEmoji(amount) {
  if (amount > 100000) return "<:cuvalDestinex:1390639605916762164>";
  if (amount > 10000) return "<:banknotDestinex:1390639121516462090>";
  return "<:Destinex:1390635909904339056>";
}

exports.execute = async (client, message, args) => {
  try {
    const user = message.author;
    const inventoryKey = `inventory_${user.id}`;

    // Envanter kontrol
    let inventory = await client.db.get(inventoryKey);
    if (!Array.isArray(inventory) || inventory.length === 0) {
      return message.reply("🛒 **Envanterinizde satacak bir şey yok.**");
    }

    // Eşyaları id'ye göre gruplama
    const groupedItems = inventory.reduce((acc, item) => {
      if (!item || typeof item.id === "undefined") return acc;
      acc[item.id] = (acc[item.id] || 0) + 1;
      return acc;
    }, {});

    let totalEarnings = 0;
    let itemDescriptions = [];

    for (const itemId in groupedItems) {
      const count = groupedItems[itemId];
      const item = inventory.find((i) => i.id === parseInt(itemId));

      if (!item) {
        console.warn(`⚠️ Item ID ${itemId} envanterde bulunamadı.`);
        continue;
      }

      if (!item.name || typeof item.value !== "number") {
        console.warn(`⚠️ Item ID ${itemId} geçersiz veri içeriyor.`);
        continue;
      }

      if (!item.emoji) {
        console.warn(`⚠️ "${item.name}" emojisi bulunamadı.`);
        continue;
      }

      const itemValue = item.value * count;
      totalEarnings += itemValue;

      itemDescriptions.push(
        `${item.emoji} **${item.name}** x${count} → ${itemValue} <:Destinex:1390635909904339056>`
      );
    }

    if (totalEarnings === 0) {
      return message.reply("🛒 **Satılabilir bir eşyanız yok.**");
    }

    // Para ekleme
    await client.eco.addMoney(user.id, totalEarnings);

    // Envanteri temizle
    await client.db.set(inventoryKey, []);

    // Kazanç emojisi seç
    const gainEmoji = chooseEmoji(totalEarnings);

    // Embed ile temiz gösterim
    const embed = new MessageEmbed()
      .setTitle(`${gainEmoji} Satış Tamamlandı!`)
      .setDescription(itemDescriptions.join("\n"))
      .addField(
        "💰 Toplam Kazanç",
        `${totalEarnings} <:Destinex:1390635909904339056>`,
        false
      )
      .setColor("GREEN")
      .setTimestamp();

    return message.channel.send({ embeds: [embed] });
  } catch (error) {
    console.error('🛑 "sat" komutu işlenirken hata oluştu:', error);
    return message.reply("⚠️ **Bir hata oluştu, lütfen tekrar deneyin.**");
  }
};

exports.help = {
  name: "sat",
  aliases: ["sell"],
  usage: "sat",
  description: "Envanterinizdeki eşyaları satarak para kazanırsınız.",
  category: "Ekonomi",
  cooldown: 10, // saniye
};
