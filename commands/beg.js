const ms = require("ms"); // cooldown hesaplamak için

function turkishDuration(msAmount) {
  // msAmount milisaniye
  let totalSeconds = Math.floor(msAmount / 1000);
  let minutes = Math.floor(totalSeconds / 60);
  let seconds = totalSeconds % 60;
  let result = [];
  if (minutes > 0) result.push(`${minutes} dakika`);
  if (seconds > 0) result.push(`${seconds} saniye`);
  return result.join(" ");
}

function chooseEmoji(amount) {
  if (amount > 100000) return "<:cuvalDestinex:1390639605916762164>";
  if (amount > 10000) return "<:banknotDestinex:1390639121516462090>";
  return "<:Destinex:1390635909904339056>";
}

exports.execute = async (client, message, args) => {
  try {
    const userId = message.author.id;
    const cooldownKey = `beggCooldown_${userId}`;
    const cooldownAmount = 5 * 60 * 1000; // 5 dakika

    const lastBeg = await client.db.get(cooldownKey);
    const now = Date.now();

    if (lastBeg && now - lastBeg < cooldownAmount) {
      const timeLeft = cooldownAmount - (now - lastBeg);
      return message.reply(
        `⏳ Lütfen ${turkishDuration(timeLeft)} sonra tekrar deneyin.`
      );
    }

    // Rastgele miktar (10-50)
    const amount = Math.floor(Math.random() * 41) + 10;

    // Kullanıcının parasını çek
    let money = (await client.db.get(`money_${userId}`)) || 0;

    // Para ekle
    money += amount;
    await client.db.set(`money_${userId}`, money);

    // Cooldown'u güncelle
    await client.db.set(cooldownKey, now);

    // Random bağışçı isimleri
    const users = [
      "PewDiePie",
      "T-Series",
      "Sans",
      "Zero",
      "Ninja",
      "Jacksepticeye",
      "Markiplier",
      "Dream",
      "Pokimane",
      "Ariana Grande",
    ];
    const randomUser = users[Math.floor(Math.random() * users.length)];

    // Emoji seçimi (burada toplam paraya göre)
    const emoji = chooseEmoji(money);

    return message.reply(
      `🎉 **${randomUser}** size **${amount}** ${emoji} bağışladı! Şu anda toplamda **${money}** ${emoji} paranız var.`
    );
  } catch (error) {
    console.error("beg komutu hata:", error);
    return message.reply("❌ Bir hata oluştu, lütfen tekrar deneyin.");
  }
};

exports.help = {
  name: "beg",
  aliases: [],
  usage: "beg",
  description: "Yardım dilenmek için kullanılır, cooldown süresi vardır.",
  category: "Ekonomi",
  cooldown: 300, // 5 dakika saniye cinsinden
};
