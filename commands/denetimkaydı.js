const { MessageActionRow, MessageButton } = require("discord.js");

exports.execute = async (client, message, args) => {
  const guild = message.guild;

  try {
    const logs = await guild.fetchAuditLogs({ limit: 50 });
    const entries = logs.entries.map((entry) => {
      const user = entry.executor?.tag || "Bilinmiyor";
      const action = entry.action;
      const target =
        entry.target?.tag ||
        entry.target?.name ||
        entry.target?.id ||
        "Bilinmiyor";
      const reason = entry.reason || "Sebep belirtilmemiş";
      return `**Kullanıcı:** ${user}\n**Eylem:** ${action}\n**Hedef:** ${target}\n**Sebep:** ${reason}`;
    });

    if (entries.length === 0)
      return message.channel.send("📭 **Hiç denetim kaydı bulunamadı.**");

    let currentPage = 0;
    const perPage = 5;
    const maxPage = Math.ceil(entries.length / perPage) - 1;

    const createPage = (page) => {
      const start = page * perPage;
      const slice = entries.slice(start, start + perPage);
      return `📋 **${guild.name} Denetim Kayıtları**\n\n${slice
        .map((log, i) => `**${start + i + 1}.**\n${log}`)
        .join("\n\n")}\n\n📄 Sayfa ${page + 1}/${maxPage + 1}`;
    };

    const msg = await message.channel.send(createPage(currentPage));

    if (entries.length <= perPage) return;

    const row = new MessageActionRow().addComponents(
      new MessageButton()
        .setCustomId("back")
        .setLabel("⬅️ Geri")
        .setStyle("PRIMARY"),
      new MessageButton()
        .setCustomId("next")
        .setLabel("➡️ İleri")
        .setStyle("PRIMARY")
    );

    await msg.edit({ content: createPage(currentPage), components: [row] });

    const filter = (i) => i.user.id === message.author.id;
    const collector = msg.createMessageComponentCollector({
      filter,
      time: 60000,
    });

    collector.on("collect", async (interaction) => {
      if (interaction.customId === "next" && currentPage < maxPage)
        currentPage++;
      if (interaction.customId === "back" && currentPage > 0) currentPage--;

      await interaction.update({
        content: createPage(currentPage),
        components: [
          new MessageActionRow().addComponents(
            new MessageButton()
              .setCustomId("back")
              .setLabel("⬅️ Geri")
              .setStyle("PRIMARY")
              .setDisabled(currentPage === 0),
            new MessageButton()
              .setCustomId("next")
              .setLabel("➡️ İleri")
              .setStyle("PRIMARY")
              .setDisabled(currentPage === maxPage)
          ),
        ],
      });
    });

    collector.on("end", () => msg.edit({ components: [] }));
  } catch (err) {
    console.error(err);
    message.reply("❌ **Denetim kaydına erişilirken hata oluştu.**");
  }
};

exports.help = {
  name: "denetimkaydı",
  aliases: ["dk"],
  usage: "denetimkaydı",
  description: "Son 50 denetim kaydını listeler. Sayfalanabilir yapıdadır.",
  category: "Moderasyon",
  cooldown: 10,
};
