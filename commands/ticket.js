const {
  MessageActionRow,
  MessageButton,
  MessageEmbed,
  MessageSelectMenu,
} = require("discord.js");
const fs = require("fs");
const path = require("path");

exports.execute = async (client, message, args) => {
  const ticketEmbed = new MessageEmbed()
    .setTitle("📩 Destek Talebi Oluştur")
    .setDescription("Aşağıdaki butona basarak bir destek talebi açabilirsiniz.")
    .setColor("BLUE")
    .setFooter({ text: "V13 Advanced Ticket System" });

  const ticketButton = new MessageActionRow().addComponents(
    new MessageButton()
      .setCustomId("select_category")
      .setLabel("🎟️ Destek Talebi Oluştur")
      .setStyle("SUCCESS")
  );

  const ticketMessage = await message.channel.send({
    embeds: [ticketEmbed],
    components: [ticketButton],
  });

  // 10 saniye sonra embed mesajını sil
  setTimeout(() => {
    ticketMessage.delete().catch(() => {});
  }, 10000);

  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton() && !interaction.isSelectMenu()) return;
    const guild = interaction.guild;
    const user = interaction.user;

    if (interaction.customId === "select_category") {
      const categoryMenu = new MessageActionRow().addComponents(
        new MessageSelectMenu()
          .setCustomId("ticket_category")
          .setPlaceholder("📌 Lütfen bir kategori seçin")
          .addOptions([
            { label: "Şikayet", value: "Şikayet", emoji: "❕" },
            { label: "Bilgi", value: "Bilgi", emoji: "❓" },
          ])
      );

      await interaction.reply({
        content: "Lütfen bir kategori seçin:",
        components: [categoryMenu],
        ephemeral: true,
      });
    }

    if (interaction.customId === "ticket_category") {
      const category = interaction.values[0];
      const channelName = `ticket-${user.username}-${category}`;

      let existingChannel = guild.channels.cache.find(
        (c) => c.name === channelName
      );
      if (existingChannel) {
        return interaction.reply({
          content: "Zaten açık bir destek talebiniz var!",
          ephemeral: true,
        });
      }

      guild.channels
        .create(channelName, {
          type: "GUILD_TEXT",
          permissionOverwrites: [
            { id: guild.id, deny: ["VIEW_CHANNEL"] },
            {
              id: user.id,
              allow: ["VIEW_CHANNEL", "SEND_MESSAGES", "ATTACH_FILES"],
            },
          ],
        })
        .then((channel) => {
          interaction.reply({
            content: `Destek talebiniz açıldı: ${channel}`,
            ephemeral: true,
          });

          const ticketEmbed = new MessageEmbed()
            .setTitle("🎟️ Destek Talebi")
            .setDescription("Yetkililer sizinle en kısa sürede ilgilenecektir.")
            .setColor("GREEN");

          const closeButton = new MessageActionRow().addComponents(
            new MessageButton()
              .setCustomId("close_ticket")
              .setLabel("❌ Kapat")
              .setStyle("DANGER")
          );

          channel
            .send({ embeds: [ticketEmbed], components: [closeButton] })
            .then((embedMessage) => {
              // 10 dakika sonra embed mesajını sil
              setTimeout(() => {
                embedMessage.delete().catch(() => {});
              }, 600000);
            });
        });
    }

    if (interaction.customId === "close_ticket") {
      const channel = interaction.channel;
      if (!channel.name.startsWith("ticket-")) return;

      const logFolder = path.join(__dirname, "ticket_logs");
      if (!fs.existsSync(logFolder)) fs.mkdirSync(logFolder);

      const messages = await channel.messages.fetch({ limit: 100 });
      let chatLog = "";
      messages.reverse().forEach((msg) => {
        chatLog += `${msg.author.tag}: ${msg.content}\n`;
      });

      fs.writeFileSync(path.join(logFolder, `${channel.id}.txt`), chatLog);

      const member = guild.members.cache.get(user.id);
      if (member.permissions.has("MANAGE_CHANNELS")) {
        await channel.delete();
      } else {
        await channel.permissionOverwrites.edit(user.id, {
          VIEW_CHANNEL: false,
        });
        interaction.reply({
          content: "Biletiniz kapatıldı. Yetkililer tekrar açabilir.",
          ephemeral: true,
        });

        const reopenButton = new MessageActionRow().addComponents(
          new MessageButton()
            .setCustomId("reopen_ticket")
            .setLabel("🔓 Yeniden Aç")
            .setStyle("SUCCESS")
        );
        channel.send({
          content: "Bu bilet kapatıldı. Yetkililer tekrar açabilir.",
          components: [reopenButton],
        });
      }
    }

    if (interaction.customId === "reopen_ticket") {
      const channel = interaction.channel;

      // Kanal adını parçalayarak kullanıcı adını al
      const parts = channel.name.split("-");
      if (parts.length < 3) {
        return interaction.reply({
          content: "Bu biletin sahibi bulunamadı.",
          ephemeral: true,
        });
      }

      const username = parts[1]; // Kullanıcı adı ticket-USERNAME-KATEGORI şeklinde
      const member = guild.members.cache.find(
        (m) => m.user.username === username
      );

      if (member) {
        await channel.permissionOverwrites.edit(member.id, {
          VIEW_CHANNEL: true,
        });
        interaction.reply({ content: "Bilet tekrar açıldı!", ephemeral: true });
      } else {
        interaction.reply({
          content:
            "Bilet sahibi sunucuda bulunamadı veya adı değişmiş olabilir.",
          ephemeral: true,
        });
      }
    }
  });
};

exports.help = {
  name: "ticket",
  aliases: ["destek"],
  usage: "ticket",
  description: "Destek bileti oluşturma butonu gönderir.",
};
