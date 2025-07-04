exports.help = {
  name: "delmoney",
  aliases: ["delbal", "silpara"],
  usage: "delmoney @kullanıcı <miktar>",
  description: "Bir kullanıcının bakiyesinden belirli miktarda para siler.",
  category: "Ekonomi",
  cooldown: 5,
};

exports.execute = async (client, message, args) => {
  // Yetki kontrolü
  if (!client.config.admins.includes(message.author.id)) {
    return message.reply("❌ **Bu komutu kullanmak için yetkiniz yok.**");
  }

  // Kullanıcı kontrolü
  const user = message.mentions.users.first();
  if (!user) {
    return message.reply("⚠️ **Lütfen bir kullanıcı etiketleyin.**");
  }

  // Miktar kontrolü
  let amount = args[1];
  if (!amount || isNaN(amount)) {
    return message.reply("⚠️ **Lütfen geçerli bir miktar belirtin.**");
  }

  amount = parseInt(amount);
  if (amount <= 0) {
    return message.reply("⚠️ **Miktar sıfır veya negatif olamaz.**");
  }

  // Emoji seçimi
  let feeEmoji;
  if (amount > 100000) {
    feeEmoji = "<:cuvalDestinex:1390639605916762164>";
  } else if (amount > 10000) {
    feeEmoji = "<:banknotDestinex:1390639121516462090>";
  } else {
    feeEmoji = "<:Destinex:1390635909904339056>";
  }

  try {
    // Para silme işlemi
    const data = await client.eco.removeMoney(user.id, amount);

    return message.channel.send(
      `🗑️ **${user.tag}** kullanıcısından **${amount}** ${feeEmoji} başarıyla silindi!**`
    );
  } catch (error) {
    console.error(error);
    return message.reply(
      "❌ **Para silinirken bir hata oluştu. Lütfen tekrar deneyin.**"
    );
  }
};
