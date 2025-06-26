const { MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");
const fs = require("fs");
const botConfig = require("../botConfig.js");

exports.execute = async (client, message, args) => {
  try {
    const prefix = botConfig.prefix;
    // Toplam komut sayısını belirle
    const commandFiles = fs.readdirSync("./commands").filter(file => file.endsWith(".js"));
    const totalCommands = commandFiles.length;

    // ARAMA ÖZELLİĞİ: Eğer "ara" komutu kullanılmışsa
    if (args[0] && args[0].toLowerCase() === "ara") {
      const searchTerm = args.slice(1).join(" ").toLowerCase();
      if (!searchTerm) {
        return message.channel.send(
          `Aranacak komut adını belirtmelisiniz. Örneğin: \`${prefix}help ara moderasyon\``
        );
      }
      // Tüm komutları client.commands üzerinden çekiyoruz (her komutun help bilgisine erişiliyor)
      const allCommands = Array.from(client.commands.values()).map(cmd => cmd.help);
      const matchedCommands = allCommands.filter(
        cmd =>
          cmd.name.toLowerCase().includes(searchTerm) ||
          (cmd.description && cmd.description.toLowerCase().includes(searchTerm))
      );
      if (matchedCommands.length === 0) {
        return message.channel.send("Aradığınız kritere uyan komut bulunamadı.");
      }
      // Komutları alfabetik olarak sırala
      matchedCommands.sort((a, b) => a.name.localeCompare(b.name));
      const searchEmbed = new MessageEmbed()
        .setTitle("🔍 Komut Arama Sonuçları")
        .setDescription(
          matchedCommands
            .map(cmd => `\`${prefix}${cmd.name}\` - ${cmd.description || "Açıklama yok"}`)
            .join("\n")
        )
        .setColor("#7289DA")
        .setFooter({ text: message.author.tag, iconURL: message.author.displayAvatarURL() });
      return message.channel.send({ embeds: [searchEmbed] });
    }

    // DİNAMİK ÖNERİ: Kullanıcının geçmiş verilerine dayalı olarak önerilen komut hesaplanıyor
    const userId = message.author.id;
    let userUsage = (await client.db.get(`user_usage_${userId}`)) || [];
    let aggregatedCoUsage = {};
    for (let cmd of userUsage) {
      let coUsage = (await client.db.get(`cousage_${cmd}`)) || {};
      for (let [otherCmd, count] of Object.entries(coUsage)) {
        if (!userUsage.includes(otherCmd)) {
          aggregatedCoUsage[otherCmd] = (aggregatedCoUsage[otherCmd] || 0) + count;
        }
      }
    }
    let recommendedCommand = null;
    if (Object.keys(aggregatedCoUsage).length > 0) {
      recommendedCommand = Object.entries(aggregatedCoUsage)
        .sort((a, b) => b[1] - a[1])[0][0];
    }
    if (!recommendedCommand) {
      // Öneri bulunamazsa rastgele bir komut seç
      const allCommandNames = Array.from(client.commands.keys());
      recommendedCommand = allCommandNames[Math.floor(Math.random() * allCommandNames.length)];
    }

    // Ana yardım embed'ini oluştur
    const botOwnerId = "707269247532793858"; // Bot kurucusu ID'sini güncelleyin
    const adminMentions = botConfig.admins.map(id => `<@${id}>`).join(", ") || "Yok";

    const helpEmbed = new MessageEmbed()
      .setAuthor({ name: "📜 Komutlar Listesi" })
      .setTitle("🤝 DESTEK SUNUCUSU")
      .setURL("https://discord.gg/SgjcdEuuy4")
      .setDescription(
        `**Toplam Komutlar:** ${totalCommands}\n**Önerilen Komut:** \`${prefix}${recommendedCommand}\`\n**Prefix:** \`${prefix}\``
      )
      .addField("👑 Bot Kurucusu", `<@${botOwnerId}>`, true)
      .addField("🔧 Bot Yöneticileri", adminMentions, true)
      .setColor("#7289DA")
      .setThumbnail(client.user.displayAvatarURL())
      .setTimestamp()
      .setFooter({ text: message.author.tag, iconURL: message.author.displayAvatarURL() });

    // Ana menü: Kategori butonları (Örneğin; Moderasyon ve Eğlence)
    const mainRow = new MessageActionRow().addComponents(
      new MessageButton()
        .setCustomId("moderation")
        .setLabel("🛠 Moderasyon")
        .setStyle("PRIMARY"),
      new MessageButton()
        .setCustomId("fun")
        .setLabel("🎉 Eğlence")
        .setStyle("PRIMARY")
    );

    const msg = await message.channel.send({
      embeds: [helpEmbed],
      components: [mainRow]
    });

    // Etkileşim filtresi
    const filter = interaction => interaction.user.id === message.author.id;
    const collector = msg.createMessageComponentCollector({ filter, time: 60000 });

    collector.on("collect", async interaction => {
      // Kategoriye göre help verisi alıyoruz. (Örneğin; helpData.txt içinde "moderation_commands" ve "fun_commands" dizileri mevcut)
      let category = interaction.customId === "moderation" ? "moderation_commands" : "fun_commands";
      const helpData = JSON.parse(fs.readFileSync("helpData.txt", "utf-8"));
      let commandsArray = helpData[category];
      const commandsPerPage = 10;
      let currentPage = 0;
      const maxPages = Math.ceil(commandsArray.length / commandsPerPage);

      // Ana menü mesajını kaldır ve sayfalı embed göster
      await msg.delete();

      const generatePageEmbed = (page) => {
        const start = page * commandsPerPage;
        const end = start + commandsPerPage;
        const pageCommands = commandsArray.slice(start, end);
        const embed = new MessageEmbed()
          .setTitle(`📂 ${interaction.customId === "moderation" ? "Moderasyon" : "Eğlence"} Komutları`)
          .setURL("https://discord.gg/SgjcdEuuy4")
          .setDescription(`**Bu kategoride toplam ${commandsArray.length} komut bulunuyor.**`)
          .setColor("#99AAB5")
          .setFooter({ text: `Sayfa ${page + 1} / ${maxPages}`, iconURL: message.author.displayAvatarURL() });

        pageCommands.forEach(cmd => {
          try {
            const commandFile = require(`../commands/${cmd}`);
            embed.addField(`🔹 ${commandFile.help.name}`, commandFile.help.description || "❗ Açıklama yok");
          } catch (err) {
            console.error(`Komut yüklenirken hata: ${cmd}`, err);
          }
        });
        return embed;
      };

      // Sayfalama butonları
      const navRow = new MessageActionRow().addComponents(
        new MessageButton()
          .setCustomId("prev")
          .setLabel("⬅️ Önceki")
          .setStyle("PRIMARY")
          .setDisabled(true),
        new MessageButton()
          .setCustomId("next")
          .setLabel("Sonraki ➡️")
          .setStyle("PRIMARY")
          .setDisabled(maxPages <= 1),
        new MessageButton()
          .setCustomId("main_menu")
          .setLabel("🏠 Ana Menü")
          .setStyle("DANGER")
      );

      const pageMsg = await message.channel.send({
        embeds: [generatePageEmbed(currentPage)],
        components: [navRow]
      });

      const navCollector = pageMsg.createMessageComponentCollector({ filter, time: 60000 });
      navCollector.on("collect", async navInteraction => {
        if (navInteraction.customId === "next" && currentPage < maxPages - 1) {
          currentPage++;
        } else if (navInteraction.customId === "prev" && currentPage > 0) {
          currentPage--;
        } else if (navInteraction.customId === "main_menu") {
          await pageMsg.delete();
          return exports.execute(client, message, args);
        }
        await navInteraction.update({
          embeds: [generatePageEmbed(currentPage)],
          components: [
            new MessageActionRow().addComponents(
              new MessageButton()
                .setCustomId("prev")
                .setLabel("⬅️ Önceki")
                .setStyle("PRIMARY")
                .setDisabled(currentPage === 0),
              new MessageButton()
                .setCustomId("next")
                .setLabel("Sonraki ➡️")
                .setStyle("PRIMARY")
                .setDisabled(currentPage === maxPages - 1),
              new MessageButton()
                .setCustomId("main_menu")
                .setLabel("🏠 Ana Menü")
                .setStyle("DANGER")
            )
          ]
        });
      });

      navCollector.on("end", async () => {
        try {
          await pageMsg.edit({ components: [] });
        } catch (err) {
          console.error("Tepkiler kaldırılırken hata oluştu:", err);
        }
      });
    });

    collector.on("end", async () => {
      try {
        await msg.edit({ components: [] });
      } catch (err) {
        console.error("Ana menü tepkileri kaldırılırken hata oluştu:", err);
      }
    });

  } catch (error) {
    console.error("Komut çalıştırılırken hata oluştu:", error);
    message.channel.send("🚨 Bir hata oluştu. Lütfen tekrar deneyin veya yetkililere bildirin.");
  }
};

exports.help = {
  name: "help",
  aliases: ["h"],
  usage: "help [ara <kelime>]",
  description: "Mevcut tüm komutların listesini gösterir ve komut araması yapmanızı sağlar.",
};
