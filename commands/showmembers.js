// showmembers.js
const { Permissions } = require("discord.js");

exports.execute = async (client, message, args) => {
  if (!message.member.permissions.has(Permissions.FLAGS.VIEW_AUDIT_LOG)) {
    return message.reply(
      "❌ **Bu komutu kullanmak için yeterli yetkiniz yok.**"
    );
  }

  const members = message.guild.members.cache.map(
    (m) => `${m.user.tag} (${m.id})`
  );
  if (!members.length) return message.reply("❌ Sunucuda hiç üye bulunamadı.");

  const chunk = (arr, size) => {
    const res = [];
    let temp = "";
    arr.forEach((item) => {
      if ((temp + item + "\n").length > size) {
        res.push(temp);
        temp = "";
      }
      temp += item + "\n";
    });
    if (temp) res.push(temp);
    return res;
  };

  for (const part of chunk(members, 1000)) {
    await message.channel.send(`\`\`\`${part}\`\`\``);
  }
};

exports.help = {
  name: "showmembers",
  aliases: ["üyeler"],
  usage: "showmembers",
  description: "Sunucudaki tüm üyelerin tag ve ID bilgilerini listeler.",
  category: "Araçlar",
  cooldown: 10,
};
