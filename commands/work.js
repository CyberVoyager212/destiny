exports.execute = async (client, message, args) => {
  const db = client.db;
  const userId = message.author.id;

  // Rastgele kazanç (1000 - 2500 arası)
  const amount = Math.floor(Math.random() * 1500) + 1000;

  // Meslek listesi
  const jobs = [
    "Yazılımcı",
    "Kasiyer",
    "Kurye",
    "Grafiker",
    "Video Editörü",
    "Çaycı",
    "Web Tasarımcısı",
    "Animatör",
    "Stajyer",
    "Anketör",
    "Çevirmen",
  ];
  const job = jobs[Math.floor(Math.random() * jobs.length)];

  // Cooldown ayarları
  const cooldown = 5 * 60 * 1000; // 5 dk
  const cooldownKey = `workkCooldown_${userId}`;
  const lastUsed = await db.get(cooldownKey);

  if (lastUsed && Date.now() - lastUsed < cooldown) {
    const remaining = cooldown - (Date.now() - lastUsed);
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);

    return message.reply(
      `⏳ | Çok çalıştın, biraz dinlen.\nTekrar çalışabilmen için **${minutes} dakika ${seconds} saniye** beklemelisin.`
    );
  }

  try {
    // Para ekleme
    const balanceKey = `money_${userId}`;
    await db.add(balanceKey, amount);
    await db.set(cooldownKey, Date.now());

    const balance = await db.get(balanceKey);

    // Emoji belirleme
    function chooseEmoji(amount) {
      if (amount > 100000) return "<:cuvalDestinex:1390639605916762164>";
      if (amount > 10000) return "<:banknotDestinex:1390639121516462090>";
      return "<:Destinex:1390635909904339056>";
    }

    const emoji = chooseEmoji(balance);

    return message.reply(
      `💼 | **${job}** olarak çalıştın ve **${amount} ${emoji}** kazandın!\n💰 Şu an toplam paran: **${balance} ${emoji}**`
    );
  } catch (err) {
    console.error(err);
    return message.reply("❌ | Bir hata oluştu, lütfen tekrar dene.");
  }
};

exports.help = {
  name: "work",
  aliases: [],
  usage: "work",
  description: "Çalışarak para kazanırsınız.",
  category: "Ekonomi",
  cooldown: 5,
};
