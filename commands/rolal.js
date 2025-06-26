const { MessageEmbed, MessageButton, MessageActionRow } = require('discord.js');

module.exports = {
  name: "rolal",
  aliases: [],
  usage: "k!rolal @rol1 emoji1 @rol2 emoji2",
  description: "Embed mesajı oluşturur, butonlar ile rol alımını yönetir. Kullanıcılar butonlara basarak rollerini alabilir veya geri alabilirler.",
  async execute(client, message, args) {
    // Yetki kontrolü (isteğe bağlı)
    if (!message.member.permissions.has("ADMINISTRATOR")) {
      return message.reply("❌ Bu komutu kullanmak için yetkiniz yok.");
    }

    // Argüman kontrolü: çift sayıda argüman (rol ve emoji) beklenir
    if (args.length < 2 || args.length % 2 !== 0) {
      return message.reply("⚠️ Lütfen doğru formatta giriniz. Örnek: `k!rolal @rol1 emoji1 @rol2 emoji2`");
    }

    // Argümanları işleme: mesajdaki rol mention'larını sırayla alıyoruz
    const mentionedRoles = message.mentions.roles;
    let roleEmojiPairs = [];
    let roleIndex = 0;

    for (let i = 0; i < args.length; i += 2) {
      // İlk argüman rol mention'ı olmalı
      const role = mentionedRoles.at(roleIndex);
      if (!role) {
        return message.reply("⚠️ Belirtilen role ulaşamadım.");
      }
      roleIndex++;

      // İkinci argüman emoji; custom emoji ise sunucudan alınır
      let emojiArg = args[i + 1];
      const customEmojiRegex = /<a?:\w+:(\d+)>/;
      const match = customEmojiRegex.exec(emojiArg);
      if (match) {
        const emojiId = match[1];
        const guildEmoji = message.guild.emojis.cache.get(emojiId);
        if (guildEmoji) {
          emojiArg = guildEmoji.toString();
        }
      }

      roleEmojiPairs.push({ roleId: role.id, emoji: emojiArg });
    }

    // Embed mesajı oluşturma
    const embed = new MessageEmbed()
      .setTitle("Rol Alım")
      .setDescription("Aşağıdaki butonlara basarak ilgili rolleri alabilirsiniz.\nButona basınca, rol verilir; eğer rol zaten varsa geri alınır.")
      .setColor("BLUE")
      .setTimestamp();

    // Butonları oluşturma (5 butondan fazla ise yeni satıra ekler)
    let buttons = roleEmojiPairs.map(pair => {
      return new MessageButton()
        .setCustomId(`rolal_${pair.roleId}`)
        .setStyle("PRIMARY")
        .setEmoji(pair.emoji);
    });

    const actionRows = [];
    while (buttons.length) {
      actionRows.push(new MessageActionRow().addComponents(buttons.splice(0, 5)));
    }

    // Embed mesajını gönderme
    const sentMessage = await message.channel.send({ embeds: [embed], components: actionRows });

    // Oluşturulan mesajı ve rol–emoji eşleştirmesini veritabanına kaydetme
    const data = {
      channelId: message.channel.id,
      messageId: sentMessage.id,
      roles: roleEmojiPairs // [{ roleId, emoji }]
    };
    await client.db.set(`rolal_${message.guild.id}_${sentMessage.id}`, data);

    message.reply("✅ Rol alım mesajı başarıyla oluşturuldu.");
  },

  help: {
    name: "rolalsistemi",
    aliases: ["ras"],
    usage: "k!rolalsistemi @rol1 emoji1 @rol2 emoji2",
    description: "Embed mesajı oluşturur, butonlar ile rol alımını yönetir. Kullanıcılar butonlara basarak rollerini alabilir veya geri alabilirler."
  }
};
