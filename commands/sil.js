const { MessageActionRow, MessageButton, Permissions } = require("discord.js");

exports.help = {
  name: "sil",
  aliases: ["delete", "del"],
  usage: "sil <sayı>",
  description: "Belirtilen miktarda mesajı siler. 100+ için onay alır.",
  category: "Moderasyon",
  cooldown: 5,
};

exports.execute = async (client, message, args) => {
  if (!message.member.permissions.has(Permissions.FLAGS.MANAGE_MESSAGES)) {
    return message.reply(
      "❌ Bu komutu kullanmak için `Mesajları Yönet` yetkisine sahip olmalısın."
    );
  }

  const amount = parseInt(args[0]);
  if (!amount || amount < 1) {
    return message.reply("❌ Lütfen silinecek mesaj sayısını belirt.");
  }

  const now = Date.now();
  const fourteenDays = 14 * 24 * 60 * 60 * 1000;

  // Eğer 100'den azsa direkt sil
  if (amount <= 100) {
    const fetched = await message.channel.messages
      .fetch({ limit: amount })
      .catch(() => null);
    if (!fetched) return message.reply("❌ Mesajlar alınamadı.");
    const deletable = fetched.filter(
      (msg) => now - msg.createdTimestamp < fourteenDays
    );

    await message.channel.bulkDelete(deletable, true).catch(() => {});
    return message.channel
      .send(`✅ ${deletable.size} mesaj silindi.`)
      .then((m) => setTimeout(() => m.delete().catch(() => {}), 3000))
      .catch(() => {});
  }

  // 100+ mesaj için önce 100'lük kısım silinir
  const fullBatches = Math.floor(amount / 100) * 100;
  const remaining = amount - fullBatches;

  const fetchedBatches = await message.channel.messages
    .fetch({ limit: fullBatches })
    .catch(() => null);
  if (!fetchedBatches) return message.reply("❌ Mesajlar alınamadı.");

  const deletableBatches = fetchedBatches.filter(
    (msg) => now - msg.createdTimestamp < fourteenDays
  );
  await message.channel.bulkDelete(deletableBatches, true).catch(() => {});

  let notice;
  if (remaining > 0) {
    const row = new MessageActionRow().addComponents(
      new MessageButton()
        .setCustomId("sil_accept")
        .setLabel(`Kalan ${remaining} mesajı sil`)
        .setStyle("DANGER")
    );

    notice = await message.channel
      .send({
        content: `✅ İlk ${deletableBatches.size} mesaj silindi. Kalan ${remaining} mesaj için onay gerekiyor.`,
        components: [row],
      })
      .catch(() => null);

    if (!notice) return;

    const filter = (i) => i.user.id === message.author.id;
    const collector = notice.createMessageComponentCollector({
      filter,
      time: 30000,
      max: 1,
    });

    collector.on("collect", async (i) => {
      await i.deferUpdate().catch(() => {});
      const fetchedRest = await message.channel.messages
        .fetch({ limit: remaining })
        .catch(() => null);
      if (!fetchedRest) return;

      const deletableRest = fetchedRest.filter(
        (msg) => now - msg.createdTimestamp < fourteenDays
      );
      for (const msg of deletableRest.values()) {
        await msg.delete().catch(() => {});
        await new Promise((r) => setTimeout(r, 200)); // Rate limit için
      }

      if (!notice.deleted) {
        await notice
          .edit({
            content: `✅ Kalan ${deletableRest.size} mesaj silindi.`,
            components: [],
          })
          .catch(() => {});
      }
    });

    collector.on("end", async () => {
      if (!notice.deleted) {
        await notice.edit({ components: [] }).catch(() => {});
      }
    });
  } else {
    message.channel
      .send(`✅ ${deletableBatches.size} mesaj silindi.`)
      .then((m) => setTimeout(() => m.delete().catch(() => {}), 3000))
      .catch(() => {});
  }
};
