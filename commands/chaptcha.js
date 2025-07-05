const { MessageAttachment } = require("discord.js");
const fetch = require("node-fetch");

module.exports.help = {
  name: "chaptcha",
  aliases: ["captcha"],
  description:
    "Belirtilen kullanıcının profil fotoğrafı ile sahte bir captcha oluşturur.",
  usage: "chaptcha [kullanıcı]",
  category: "Eğlence",
  cooldown: 3,
};

module.exports.execute = async (client, message, args) => {
  let user =
    message.mentions.members.first() ||
    message.guild.members.cache.get(args[0]) ||
    message.guild.members.cache.find(
      (m) => m.user.username.toLowerCase() === args.join(" ").toLowerCase()
    ) ||
    message.guild.members.cache.find(
      (m) => m.displayName.toLowerCase() === args.join(" ").toLowerCase()
    ) ||
    message.member;

  const waitMsg = await message.channel.send(
    "🕓 Lütfen bekleyin, captcha oluşturuluyor..."
  );

  try {
    const apiUrl = `https://nekobot.xyz/api/imagegen?type=captcha&username=${encodeURIComponent(
      user.user.username
    )}&url=${user.user.displayAvatarURL({ format: "png", size: 512 })}`;
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (!data.message) {
      return waitMsg.edit(
        "❌ Captcha resmi oluşturulamadı. Lütfen tekrar deneyin."
      );
    }

    const attachment = new MessageAttachment(data.message, "captcha.png");
    await message.channel.send({ files: [attachment] });

    waitMsg.delete();
  } catch (err) {
    console.error("Captcha API hatası:", err);
    waitMsg.edit("❌ Bir hata oluştu. Lütfen tekrar deneyin.");
  }
};
