// rolekle.js
const { MessageEmbed } = require("discord.js");

exports.help = {
  name: "rolekle",
  aliases: [],
  usage: "rolekle <@kullanıcı> <@rol|id|isim> [başka_rol...]",
  description: "Kullanıcıya bir veya birden fazla rol verir.",
  category: "Moderasyon",
  cooldown: 5,
};

exports.execute = async (client, message, args) => {
  if (!message.member.permissions.has("MANAGE_ROLES"))
    return message.reply(
      "Bu komutu kullanmak için `Rolleri Yönet` yetkisine sahip olmalısın."
    );

  const member = message.mentions.members.first();
  if (!member) return message.reply("Rol verilecek kullanıcıyı belirt.");

  const roles = args
    .slice(1)
    .map(
      (r) =>
        message.guild.roles.cache.get(r) ||
        message.guild.roles.cache.find((x) => x.name === r) ||
        message.mentions.roles.first()
    )
    .filter(Boolean);

  if (!roles.length) return message.reply("Verilecek rolleri belirtmelisin.");

  const added = [];
  for (const rol of roles) {
    try {
      if (!member.roles.cache.has(rol.id)) {
        await member.roles.add(rol);
        added.push(rol.name);
      }
    } catch (e) {
      console.error(e);
    }
  }

  if (!added.length) {
    return message.channel.send(
      `❌ ${member.user.tag} kullanıcısına eklenebilecek bir rol bulunamadı veya yetkim yetersiz.`
    );
  }

  const embed = new MessageEmbed()
    .setDescription(
      `✅ ${member.user.tag} kullanıcısına eklendi: ${added.join(", ")}`
    )
    .setColor("#00FF00");

  message.channel.send({ embeds: [embed] });
};
