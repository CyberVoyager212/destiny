// commands/help.js
const { MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");

exports.help = {
  name: "help",
  aliases: ["h", "yardım"],
  usage: "help [ara <kelime> | <kategori> <sayfa>]",
  category: "Bot",
  description:
    "Komutları kategorilere göre, sayfa sayfa gösterir; ayrıca arama imkanı sunar.",
};

exports.execute = async (client, message, args) => {
  try {
    const prefix = client.config?.prefix || "!";
    const ownerId = client.config?.ownerId || "707269247532793858";
    const admins = client.config?.admins || [];

    // Arama alt komutu
    if (args[0] && args[0].toLowerCase() === "ara") {
      const term = args.slice(1).join(" ").toLowerCase();
      if (!term)
        return message.channel.send(
          `Lütfen aranacak kelimeyi girin: \`${prefix}help ara moderasyon\``
        );
      const all = Array.from(client.commands.values());
      const found = all.filter(
        (cmd) =>
          cmd.help.name.toLowerCase().includes(term) ||
          (cmd.help.description &&
            cmd.help.description.toLowerCase().includes(term))
      );
      if (!found.length) return message.channel.send("Sonuç bulunamadı.");
      const embed = new MessageEmbed()
        .setTitle(`🔍 "${term}" arama sonuçları`)
        .setDescription(
          found
            .map(
              (c) =>
                `\`${prefix}${c.help.name}\` - ${
                  c.help.description || "-"
                }\nKullanım: \`${prefix}${c.help.usage}\``
            )
            .join("\n\n")
        )
        .setColor("#7289DA")
        .setFooter({
          text: message.author.tag,
          iconURL: message.author.displayAvatarURL(),
        })
        .setTimestamp();
      return message.channel.send({ embeds: [embed] });
    }

    // Komutları kategorilere ayır
    const categories = {};
    client.commands.forEach((cmd) => {
      const cat = cmd.help?.category || "Diğer";
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(cmd);
    });
    const categoryNames = Object.keys(categories);
    const totalCommands = client.commands.size;

    // Rastgele komut önerisi
    const randomCommand = client.commands.random()?.help;

    const mainEmbed = new MessageEmbed()
      .setTitle(`🤖 ${client.user.username} Yardım Menüsü`)
      .addField("Toplam Komut", `${totalCommands}`, true)
      .addField(
        "Rastgele Öneri",
        randomCommand
          ? `\`${prefix}${randomCommand.name}\` - ${randomCommand.description}`
          : "Yok",
        false
      )
      .addField(
        "Sunucu",
        `${message.guild.name} (${message.guild.memberCount} üye)`,
        true
      )
      .addField("Kurucu", `<@${ownerId}>`, true)
      .addField(
        "Yöneticiler",
        admins.length ? admins.map((id) => `<@${id}>`).join(", ") : "Yok",
        false
      )
      .setColor("#5865F2")
      .setFooter({
        text: message.author.tag,
        iconURL: message.author.displayAvatarURL(),
      })
      .setTimestamp();

    // Kategori sayfalama
    const perCatPage = 5;
    let catPage = 0;
    const totalCatPages = Math.ceil(categoryNames.length / perCatPage);

    const getCategoryRows = (page) => {
      const slice = categoryNames.slice(
        page * perCatPage,
        page * perCatPage + perCatPage
      );
      const row = new MessageActionRow();
      slice.forEach((cat) => {
        row.addComponents(
          new MessageButton()
            .setCustomId(`help_cat_${cat}_0`)
            .setLabel(cat)
            .setStyle("PRIMARY")
        );
      });
      const nav = new MessageActionRow();
      if (page > 0)
        nav.addComponents(
          new MessageButton()
            .setCustomId(`help_catPage_${page - 1}`)
            .setLabel("⬅️")
            .setStyle("SECONDARY")
        );
      nav.addComponents(
        new MessageButton()
          .setCustomId("help_home")
          .setLabel("🏠 Ana Sayfa")
          .setStyle("DANGER")
      );
      if (page < totalCatPages - 1)
        nav.addComponents(
          new MessageButton()
            .setCustomId(`help_catPage_${page + 1}`)
            .setLabel("➡️")
            .setStyle("SECONDARY")
        );
      return [row, nav];
    };

    // Gönder
    let components = getCategoryRows(catPage);
    const helpMsg = await message.channel.send({
      embeds: [mainEmbed],
      components,
    });

    const collector = helpMsg.createMessageComponentCollector({
      filter: (i) => i.user.id === message.author.id,
      time: 120_000,
    });

    collector.on("collect", async (i) => {
      await i.deferUpdate();
      const parts = i.customId.split("_");
      if (parts[1] === "home") {
        return i.editReply({
          embeds: [mainEmbed],
          components: getCategoryRows(0),
        });
      }
      if (parts[1] === "catPage") {
        catPage = parseInt(parts[2], 10);
        return i.editReply({
          embeds: [mainEmbed],
          components: getCategoryRows(catPage),
        });
      }
      if (parts[1] === "cat") {
        const category = parts[2];
        const pageNum = parseInt(parts[3], 10);
        const cmds = categories[category];
        if (!cmds) return; // Güvenlik
        const perPage = 5;
        const totalPages = Math.ceil(cmds.length / perPage) || 1;
        const slice = cmds.slice(
          pageNum * perPage,
          pageNum * perPage + perPage
        );
        const embed = new MessageEmbed()
          .setTitle(
            `📂 ${category} Kategorisi (${cmds.length} komut, ${totalPages} sayfa)`
          )
          .setColor("#5865F2")
          .setFooter({
            text: message.author.tag,
            iconURL: message.author.displayAvatarURL(),
          })
          .setTimestamp();
        slice.forEach((c) =>
          embed.addField(
            `\`${prefix}${c.help.name}\``,
            `${c.help.description || "-"}\nKullanım: \`${prefix}${
              c.help.usage
            }\``,
            false
          )
        );
        const navRow = new MessageActionRow();
        if (pageNum > 0)
          navRow.addComponents(
            new MessageButton()
              .setCustomId(`help_cat_${category}_${pageNum - 1}`)
              .setLabel("⬅️ Geri")
              .setStyle("SECONDARY")
          );
        navRow.addComponents(
          new MessageButton()
            .setCustomId("help_home")
            .setLabel("🏠 Ana sayfa")
            .setStyle("DANGER")
        );
        if (pageNum < totalPages - 1)
          navRow.addComponents(
            new MessageButton()
              .setCustomId(`help_cat_${category}_${pageNum + 1}`)
              .setLabel("İleri ➡️")
              .setStyle("SECONDARY")
          );
        return i.editReply({ embeds: [embed], components: [navRow] });
      }
    });

    collector.on("end", () => {
      helpMsg.edit({ components: [] }).catch(() => {});
    });
  } catch (err) {
    console.error(err);
    message.channel.send("Komut çalıştırılırken bir hata oluştu.");
  }
};
