const { MessageEmbed } = require("discord.js");
const ms = require("ms");

exports.help = {
  name: "cekilis",
  aliases: ["çekiliş", "giveaway"],
  usage:
    "k!cekilis başlat <süre> <kazanan sayısı> <ödül> | k!cekilis bitir <mesajId> | k!cekilis iptal <mesajId> | k!cekilis liste",
  description: "Çekiliş başlatır, bitirir, iptal eder veya liste gösterir.",
  category: "Moderasyon",
  cooldown: 5,
};

function formatDate(date) {
  return `<t:${Math.floor(date.getTime() / 1000)}:F>`;
}

exports.execute = async (client, message, args) => {
  if (!message.member.permissions.has("MANAGE_GUILD"))
    return message.reply(
      "❌ Bu komutu kullanmak için `Sunucuyu Yönet` yetkisine sahip olmalısın."
    );

  const db = client.db; // quick.db instance

  const subcommand = args[0]?.toLowerCase();

  if (
    !subcommand ||
    !["başlat", "bitir", "iptal", "liste"].includes(subcommand)
  ) {
    return message.reply(
      "Geçersiz alt komut! Kullanım:\n" +
        "`k!cekilis başlat <süre> <kazanan sayısı> <ödül>`\n" +
        "`k!cekilis bitir <mesajId>`\n" +
        "`k!cekilis iptal <mesajId>`\n" +
        "`k!cekilis liste`"
    );
  }

  if (subcommand === "başlat") {
    if (args.length < 4)
      return message.reply(
        "Eksik argüman! Kullanım: k!cekilis başlat <süre> <kazanan sayısı> <ödül>"
      );

    const duration = ms(args[1]);

    const winnerCount = parseInt(args[2]);
    if (isNaN(winnerCount) || winnerCount < 1)
      return message.reply("Geçerli bir kazanan sayısı gir!");

    const prize = args.slice(3).join(" ");

    const embed = new MessageEmbed()
      .setTitle("🎉 Yeni Çekiliş! 🎉")
      .setDescription(
        `Ödül: **${prize}**\nKazanan Sayısı: **${winnerCount}**\nSüre: **${args[1]}**`
      )
      .setFooter({ text: `Çekilişi başlatan: ${message.author.tag}` })
      .setTimestamp(Date.now() + duration)
      .setColor("GREEN");

    const sentMessage = await message.channel.send({ embeds: [embed] });
    await sentMessage.react("🎉");

    // Mevcut çekilişleri al ya da boş dizi
    const giveaways = (await db.get(`cekilisler_${message.guild.id}`)) || [];

    giveaways.push({
      messageId: sentMessage.id,
      channelId: message.channel.id,
      prize,
      winnerCount,
      endTime: Date.now() + duration,
      winners: [],
      ended: false,
    });

    await db.set(`cekilisler_${message.guild.id}`, giveaways);

    message.reply(`Çekiliş başladı! Mesaj ID: \`${sentMessage.id}\``);

    setTimeout(async () => {
      const storedGiveaways =
        (await db.get(`cekilisler_${message.guild.id}`)) || [];
      const giveaway = storedGiveaways.find(
        (g) => g.messageId === sentMessage.id
      );

      if (!giveaway || giveaway.ended) return;

      const channel = message.guild.channels.cache.get(giveaway.channelId);
      if (!channel) return;

      const giveawayMessage = await channel.messages
        .fetch(giveaway.messageId)
        .catch(() => null);
      if (!giveawayMessage) return;

      const reaction = giveawayMessage.reactions.cache.get("🎉");
      if (!reaction) {
        channel.send(
          `🎉 Çekiliş sona erdi ancak hiç katılım olmadı: **${giveaway.prize}**`
        );
        giveaway.ended = true;
        await db.set(`cekilisler_${message.guild.id}`, storedGiveaways);
        return;
      }

      const users = await reaction.users.fetch();
      const participants = users.filter((u) => !u.bot).map((u) => u.id);

      if (participants.length === 0) {
        channel.send(
          `🎉 Çekiliş sona erdi ancak katılım olmadı: **${giveaway.prize}**`
        );
        giveaway.ended = true;
        await db.set(`cekilisler_${message.guild.id}`, storedGiveaways);
        return;
      }

      const winners = [];
      while (winners.length < giveaway.winnerCount && participants.length > 0) {
        const randIndex = Math.floor(Math.random() * participants.length);
        winners.push(participants.splice(randIndex, 1)[0]);
      }

      giveaway.winners = winners;
      giveaway.ended = true;
      await db.set(`cekilisler_${message.guild.id}`, storedGiveaways);

      const winnerMentions = winners.map((id) => `<@${id}>`).join(", ");

      const endEmbed = new MessageEmbed()
        .setTitle("🎉 Çekiliş Sona Erdi!")
        .setDescription(
          `Ödül: **${giveaway.prize}**\nKazananlar: ${winnerMentions}`
        )
        .setColor("BLUE")
        .setTimestamp();

      channel.send({
        content: `Tebrikler ${winnerMentions}! 🎉`,
        embeds: [endEmbed],
      });
    }, duration);
  } else if (subcommand === "bitir") {
    const messageId = args[1];
    if (!messageId) return message.reply("Mesaj ID gir!");

    const giveaways = (await db.get(`cekilisler_${message.guild.id}`)) || [];
    const giveaway = giveaways.find((g) => g.messageId === messageId);

    if (!giveaway) return message.reply("Bu ID ile çekiliş bulunamadı.");
    if (giveaway.ended) return message.reply("Çekiliş zaten sona ermiş.");

    const channel = message.guild.channels.cache.get(giveaway.channelId);
    if (!channel) return message.reply("Çekiliş kanalı bulunamadı.");

    const giveawayMessage = await channel.messages
      .fetch(messageId)
      .catch(() => null);
    if (!giveawayMessage) return message.reply("Çekiliş mesajı bulunamadı.");

    const reaction = giveawayMessage.reactions.cache.get("🎉");
    if (!reaction) return message.reply("Çekilişe katılım yok.");

    const users = await reaction.users.fetch();
    const participants = users.filter((u) => !u.bot).map((u) => u.id);

    if (participants.length === 0)
      return message.reply("Çekilişe katılan yok.");

    const winners = [];
    while (winners.length < giveaway.winnerCount && participants.length > 0) {
      const randIndex = Math.floor(Math.random() * participants.length);
      winners.push(participants.splice(randIndex, 1)[0]);
    }

    giveaway.winners = winners;
    giveaway.ended = true;
    await db.set(`cekilisler_${message.guild.id}`, giveaways);

    const winnerMentions = winners.map((id) => `<@${id}>`).join(", ");

    const endEmbed = new MessageEmbed()
      .setTitle("🎉 Çekiliş Sona Erdi!")
      .setDescription(
        `Ödül: **${giveaway.prize}**\nKazananlar: ${winnerMentions}`
      )
      .setColor("BLUE")
      .setTimestamp();

    channel.send({
      content: `Tebrikler ${winnerMentions}! 🎉`,
      embeds: [endEmbed],
    });
    message.reply("Çekiliş başarılı şekilde sona erdirildi.");
  } else if (subcommand === "iptal") {
    const messageId = args[1];
    if (!messageId) return message.reply("Mesaj ID gir!");

    const giveaways = (await db.get(`cekilisler_${message.guild.id}`)) || [];
    const index = giveaways.findIndex((g) => g.messageId === messageId);

    if (index === -1) return message.reply("Bu ID ile çekiliş bulunamadı.");

    if (giveaways[index].ended)
      return message.reply("Çekiliş zaten sona ermiş, iptal edilemez.");

    // Mesajı ve çekilişi kaldır
    const channel = message.guild.channels.cache.get(
      giveaways[index].channelId
    );
    if (channel) {
      const msg = await channel.messages.fetch(messageId).catch(() => null);
      if (msg) await msg.delete().catch(() => {});
    }

    giveaways.splice(index, 1);
    await db.set(`cekilisler_${message.guild.id}`, giveaways);

    message.reply("Çekiliş iptal edildi.");
  } else if (subcommand === "liste") {
    const giveaways = (await db.get(`cekilisler_${message.guild.id}`)) || [];
    if (giveaways.length === 0)
      return message.reply("Sunucuda aktif çekiliş yok.");

    const embed = new MessageEmbed()
      .setTitle("🎉 Aktif Çekilişler")
      .setColor("YELLOW")
      .setDescription(
        giveaways
          .map(
            (g) =>
              `• Ödül: **${g.prize}**\n  Mesaj ID: \`${
                g.messageId
              }\`\n  Bitiş: ${formatDate(
                new Date(g.endTime)
              )}\n  Kazanan Sayısı: ${g.winnerCount}\n  Durum: ${
                g.ended ? "Bitti" : "Devam Ediyor"
              }`
          )
          .join("\n\n")
      );

    message.channel.send({ embeds: [embed] });
  }
};
