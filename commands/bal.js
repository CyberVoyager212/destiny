// commands/bal.js
// 3 basamakta bir nokta ekleyen fonksiyon
function formatNumber(number) {
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

exports.help = {
  name: "bal",
  aliases: ["para", "bakiye"],
  usage: "bal [@kullanıcı]",
  description: "Kullanıcının bakiyesini gösterir ve sıralamadaki yerini verir.",
  category: "Ekonomi",
  cooldown: 5,
};

exports.execute = async (client, message, args) => {
  const db = client.db;
  const user = message.mentions.users.first() || message.author;

  try {
    const balance = await client.eco.fetchMoney(user.id);

    // Emoji seçim fonksiyonu bakiye üzerinden
    let balanceEmoji;
    if (balance > 100000) {
      balanceEmoji = "<:cuvalDestinex:1390639605916762164>";
    } else if (balance > 10000) {
      balanceEmoji = "<:banknotDestinex:1390639121516462090>";
    } else {
      balanceEmoji = "<:Destinex:1390635909904339056>";
    }

    const allEntries = await db.all();
    const moneyEntries = allEntries
      .filter((e) => e.id.startsWith("money_"))
      .map((e) => ({
        id: e.id.split("_")[1],
        bal: Number(e.value),
      }));

    moneyEntries.sort((a, b) => b.bal - a.bal);
    const position = moneyEntries.findIndex((e) => e.id === user.id) + 1 || "?";

    const formattedBalance = formatNumber(balance);

    return message.channel.send(
      `💰 **Bakiye Bilgisi**` +
        `\n📌 **Kullanıcı:** <@${user.id}>` +
        `\n💳 **Bakiye:** \`${formattedBalance}\` ${balanceEmoji}` +
        `\n🏆 **Sıralama:** \`${position}\``
    );
  } catch (error) {
    console.error(error);
    return message.reply(
      "❌ **Bakiye alınırken bir hata oluştu. Lütfen tekrar deneyin.**"
    );
  }
};
