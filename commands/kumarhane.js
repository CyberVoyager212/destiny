const {
  MessageEmbed,
  MessageActionRow,
  MessageButton,
  Permissions,
} = require("discord.js");

exports.help = {
  name: "kumarhane",
  description: "Kumarhane oyunlarına katılmanızı sağlar.",
  usage: "k!kumarhane",
  category: "Ekonomi",
  cooldown: 5,
};

exports.execute = async (client, message, args) => {
  const userBalance = await client.eco.fetchMoney(message.author.id);
  const entryFee = 500 + Math.floor(userBalance * 0.007);

  let feeEmoji =
    entryFee >= 100000
      ? "<:cuvalDestinex:1390639605916762164>"
      : entryFee >= 10000
      ? "<:banknotDestinex:1390639121516462090>"
      : "<:Destinex:1390635909904339056>";

  if (userBalance < entryFee) {
    return message.reply(
      `❌ Kumarhaneye giriş için yeterli paranız yok. Giriş ücreti: **${entryFee}** ${feeEmoji}.`
    );
  }

  const confirmationEmbed = new MessageEmbed()
    .setTitle("🎰 Kumarhane Girişi")
    .setColor("#FFD700")
    .setThumbnail("https://cdn-icons-png.flaticon.com/512/2166/2166829.png")
    .setDescription(
      `Kumarhaneye giriş ücreti **${entryFee}** ${feeEmoji}.\n\n🎮 Giriş yapmak istiyor musun?`
    )
    .setFooter({
      text: "Destinex Casino™",
      iconURL: client.user.displayAvatarURL(),
    });

  const row = new MessageActionRow().addComponents(
    new MessageButton()
      .setCustomId("accept")
      .setLabel("✅ Giriş Yap")
      .setStyle("SUCCESS"),
    new MessageButton()
      .setCustomId("decline")
      .setLabel("❌ Vazgeç")
      .setStyle("DANGER")
  );

  const confirmMessage = await message.channel.send({
    embeds: [confirmationEmbed],
    components: [row],
  });

  const filter = (i) => i.user.id === message.author.id;
  const collector = confirmMessage.createMessageComponentCollector({
    filter,
    time: 30000,
  });

  collector.on("collect", async (interaction) => {
    if (interaction.customId === "accept") {
      await client.eco.removeMoney(message.author.id, entryFee);

      const gamesEmbed = new MessageEmbed()
        .setTitle("🎲 Kumarhane Oyunları Menüsü")
        .setColor("#32CD32")
        .setThumbnail("https://cdn-icons-png.flaticon.com/512/2884/2884564.png")
        .setDescription(
          "🃏 Bir oyun seçmek için aşağıdaki düğmelerden birine tıklayın."
        )
        .addFields(
          {
            name: "🃏 Poker",
            value: "`Texas Hold'em` oynayın.",
            inline: true,
          },
          {
            name: "🎡 Rulet",
            value: "`Bahis yaparak` rulet çevirin.",
            inline: true,
          },
          {
            name: "🎲 Craps",
            value: "`Zar atarak` kazanmaya çalışın.",
            inline: true,
          },
          {
            name: "🎴 Baccarat",
            value: "`Kartlarla` baccarat oynayın.",
            inline: true,
          },
          {
            name: "🔢 Keno",
            value: "`Sayı seçerek` ödül kazanın.",
            inline: true,
          },
          {
            name: "🎲 Sic Bo",
            value: "`Zar kombinasyonlarına` bahis yapın.",
            inline: true,
          },
          {
            name: "🤑 Big Six Wheel",
            value: "`Çarkı çevirin` ve kazanın.",
            inline: true,
          }
        );

      const row1 = new MessageActionRow().addComponents(
        new MessageButton()
          .setCustomId("poker")
          .setLabel("🃏 Poker")
          .setStyle("PRIMARY"),
        new MessageButton()
          .setCustomId("roulette")
          .setLabel("🎡 Rulet")
          .setStyle("PRIMARY"),
        new MessageButton()
          .setCustomId("craps")
          .setLabel("🎲 Craps")
          .setStyle("PRIMARY")
      );

      const row2 = new MessageActionRow().addComponents(
        new MessageButton()
          .setCustomId("baccarat")
          .setLabel("🎴 Baccarat")
          .setStyle("PRIMARY"),
        new MessageButton()
          .setCustomId("keno")
          .setLabel("🔢 Keno")
          .setStyle("PRIMARY"),
        new MessageButton()
          .setCustomId("sicbo")
          .setLabel("🎲 Sic Bo")
          .setStyle("PRIMARY"),
        new MessageButton()
          .setCustomId("bigsix")
          .setLabel("🤑 Big Six")
          .setStyle("PRIMARY")
      );

      await interaction.update({
        embeds: [gamesEmbed],
        components: [row1, row2],
      });

      const gameCollector = confirmMessage.createMessageComponentCollector({
        filter,
        time: 60000,
      });

      gameCollector.on("collect", async (gameInteraction) => {
        const selectedGame = gameInteraction.customId;

        const gameNames = {
          poker: "🃏 Poker",
          roulette: "🎡 Rulet",
          craps: "🎲 Craps",
          baccarat: "🎴 Baccarat",
          keno: "🔢 Keno",
          sicbo: "🎲 Sic Bo",
          bigsix: "🤑 Big Six Wheel",
        };

        await gameInteraction.update({
          content: `🎮 **${gameNames[selectedGame]}** oyununa katıldınız!`,
          embeds: [],
          components: [],
        });

        try {
          require(`../games/${selectedGame}.js`).execute(client, message);
        } catch (err) {
          message.channel.send(
            "❌ Oyun başlatılamadı. Lütfen yöneticilere bildirin."
          );
          console.error(err);
        }
      });
    } else if (interaction.customId === "decline") {
      await interaction.update({
        content: "Kumarhaneye giriş iptal edildi.",
        embeds: [],
        components: [],
      });
    }
  });
};
