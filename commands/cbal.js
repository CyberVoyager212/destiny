const { MessageEmbed } = require("discord.js");

exports.execute = async (client, message, args) => {
  let userId = message.author.id;

  // Kullanıcının para bakiyesini al
  let userMoney = client.db.get(`money_${userId}`) || 1000000;

  // Kullanıcının coin bakiyesini al
  let userBalance = client.db.get(`balance_${userId}`) || {};

  // Embed oluştur
  let embed = new MessageEmbed()
    .setTitle(`💰 ${message.author.username} - Coin Bakiyesi`)
    .setColor("GOLD")
    .setDescription(`Toplam Para: <:cuval_DNX:1347664200620572702> **${userMoney}**`);

  // Coin bakiyelerini listele
  if (Object.keys(userBalance).length === 0) {
    embed.addField("Bilgi", "Henüz herhangi bir coine sahip değilsiniz.");
  } else {
    Object.keys(userBalance).forEach((coin) => {
      let amount = userBalance[coin];
      embed.addField(coin, `**${amount}** adet`, true);
    });
  }

  // Mesajı gönder
  return message.channel.send({ embeds: [embed] });
};

exports.help = {
  name: "coinbalance",
  aliases: ["cbal"],
  description: "Kullanıcının coin bakiyesini gösterir.",
  usage: "coinbalance",
};
