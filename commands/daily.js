const ms = require("ms");

function chooseEmoji(amount) {
  if (amount > 100000) return "<:cuvalDestinex:1390639605916762164>";
  if (amount > 10000) return "<:banknotDestinex:1390639121516462090>";
  return "<:Destinex:1390635909904339056>";
}

module.exports.execute = async (client, message, args) => {
  try {
    const userId = message.author.id;
    const cooldownKey = `dailyCooldown_${userId}`;
    const moneyKey = `money_${userId}`;
    const cooldownTime = ms("24h"); // 24 saat cooldown

    const lastClaim = (await client.db.get(cooldownKey)) || 0;
    const now = Date.now();

    if (now - lastClaim < cooldownTime) {
      const remaining = cooldownTime - (now - lastClaim);
      const hours = Math.floor(
        (remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

      return message.reply(
        `⏳ **Günlük ödülünü zaten aldın!**\n🕒 **Tekrar alabilmen için:** \`${hours} saat, ${minutes} dakika, ${seconds} saniye\` beklemelisin.`
      );
    }

    const amount = Math.floor(Math.random() * 500) + 100; // 100-599 arası
    const currentMoney = (await client.db.get(moneyKey)) || 0;
    const newBalance = currentMoney + amount;

    await client.db.set(moneyKey, newBalance);
    await client.db.set(cooldownKey, now);

    const emoji = chooseEmoji(newBalance);

    return message.reply(
      `💰 **Günlük ödülünü aldın!**\n${emoji} **Miktar:** \`${amount}\`\n📈 **Toplam paran:** \`${newBalance}\``
    );
  } catch (error) {
    console.error("⚠️ daily komutu hata:", error);
    return message.reply("❌ **Bir hata oluştu, lütfen tekrar deneyin!**");
  }
};

module.exports.help = {
  name: "daily",
  aliases: ["günlük"],
  usage: "daily",
  description: "Günlük para ödülü alırsınız.",
  category: "Ekonomi",
  cooldown: 5,
};
