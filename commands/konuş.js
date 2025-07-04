const { Client, Message, MessageEmbed } = require("discord.js");
const botConfig = require("../botConfig"); // botConfig dosyasını içe aktarın

exports.execute = async (client, message, args) => {
  try {
    // Yetki kontrolü
    if (!botConfig.admins.includes(message.author.id)) {
      return message.reply("🚫 | Bu komutu kullanmak için yetkiniz yok.");
    }

    // Hedef kullanıcıyı almak
    const targetUser = message.mentions.members.first();
    if (!targetUser) {
      return message.reply(
        "❌ | Lütfen taklit edilecek kullanıcıyı etiketleyin."
      );
    }

    // Mesaj içeriğini almak
    const text = args.slice(1).join(" ");
    if (!text) {
      return message.reply("⚠️ | Lütfen gönderilecek mesajı yazın.");
    }

    // Kullanıcının mesajını silme
    try {
      await message.delete();
    } catch (error) {
      console.error("❗ | Mesaj silinirken bir hata oluştu:", error);
    }

    // Webhook oluştur veya var olanı kullan
    const webhooks = await message.channel.fetchWebhooks();
    let webhook = webhooks.find((wh) => wh.name === "Webhook");

    if (!webhook) {
      webhook = await message.channel.createWebhook("Webhook", {
        avatar: client.user.displayAvatarURL(),
      });
    }

    // Kullanıcının takma adı veya kullanıcı adını al
    const displayName = targetUser.nickname || targetUser.user.username;

    // Mesajı gönderme
    const options = {
      content: `${text}`,
      username: displayName,
      avatarURL: targetUser.user.displayAvatarURL({ dynamic: true }),
    };

    // Eğer bir geçerli referans mesajı varsa, onu ekle
    if (message.reference) {
      options.messageReference = message.reference.messageId;
    }

    // Webhook üzerinden mesaj gönderme
    await webhook.send(options);
  } catch (error) {
    console.error("⚠️ | Komut çalıştırılırken bir hata oluştu:", error);
    return message.reply(
      "❌ | Komut çalıştırılırken bir hata oluştu, lütfen tekrar deneyin."
    );
  }
};

exports.help = {
  name: "konuş",
  aliases: ["konustur"],
  usage: "konuş @kullanıcı mesaj",
  description:
    "Belirtilen kullanıcıya mesaj gönderir ve o kullanıcıya mesajı iletir.",
  category: "Moderasyon",
  cooldown: 5,
};
