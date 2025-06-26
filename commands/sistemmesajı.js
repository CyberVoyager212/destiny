const { WebhookClient } = require("discord.js");
const path = require("path");
const botConfigPath = path.resolve(__dirname, "../botConfig.js");

module.exports = {
  async execute(client, message, args) {
    let botConfig = require(botConfigPath);
    if (!botConfig.admins.includes(message.author.id)) {
      return message.reply("⛔ **Bu komutu kullanmak için yetkiniz yok!**");
    }

    // Mesaj içeriğini al
    const content = args.join(" ");
    if (!content) {
      return message.reply("❌ **Lütfen göndermek istediğiniz sistem mesajını yazın!**");
    }

    // Komut mesajını 0.5 saniye sonra sil
    setTimeout(() => {
      message.delete().catch(() => {});
    }, 500);

    // Webhook oluştur veya mevcut olanı kullan
    const webhooks = await message.channel.fetchWebhooks();
    let webhook = webhooks.find((wh) => wh.name === "SystemAlert");

    if (!webhook) {
      webhook = await message.channel.createWebhook("SystemAlert", {
        avatar: "https://cdn.glitch.global/5826ca9c-c099-4101-bc22-bb193de79a85/resim_2025-03-13_185546408.png?v=1741881347757",
      });
    }

    // 🔹 **Mesajı her 3 kelimede bir yeni satıra bölelim**
    const words = content.split(" ");
    let formattedMessage = "";
    for (let i = 0; i < words.length; i++) {
      formattedMessage += words[i] + " ";
      if ((i + 1) % 3 === 0) formattedMessage += "\n";
    }

    // **Sistem mesajını webhook üzerinden gönder**
    await webhook.send({
      content: `\`\`\`ml
███████████████████████████
 █ 🔹 SİSTEM BİLDİRİMİ 🔹█
███████████████████████████

${formattedMessage}

~Destiny bot iyi kullanımlar diler
\`\`\``,
      username: "🔹・SİSTEM DUYURUSU・🔹",
      avatarURL: "https://cdn.glitch.global/5826ca9c-c099-4101-bc22-bb193de79a85/resim_2025-03-13_185546408.png?v=1741881347757",
    });
  },

  help: {
    name: "sistem",
    aliases: ["sistemmesajı", "sm"],
    usage: "k!sistem <mesaj>",
    description: "Webhook kullanarak sistemden gelen bir mesaj gönderir.",
  },
};
