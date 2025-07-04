const { MessageEmbed } = require("discord.js");

exports.help = {
  name: "purge",
  aliases: ["temizle"],
  usage: "purge <@kullanıcı|kelime>",
  description:
    "Belirtilen kullanıcının veya kelime içeren mesajları toplu siler.",
  category: "Moderasyon",
  cooldown: 5,
};

exports.execute = async (client, message, args) => {
  if (!message.member.permissions.has("MANAGE_MESSAGES"))
    return message.reply(
      "Bu komutu kullanmak için `Mesajları Yönet` yetkisine sahip olmalısın."
    );

  const target = args[0];
  if (!target) return message.reply("Kullanıcı veya kelime belirtmelisin.");

  const fetched = await message.channel.messages.fetch({ limit: 100 });
  let toDelete = [];

  // Kullanıcı ID/mention/isim
  const user =
    message.mentions.users.first() ||
    client.users.cache.get(target) ||
    message.guild.members.cache.find((m) => m.user.username === target)?.user;

  if (user) {
    toDelete = fetched.filter((m) => m.author.id === user.id);
  } else {
    const term = args.join(" ").toLowerCase();
    toDelete = fetched.filter((m) => m.content.toLowerCase().includes(term));
  }

  if (!toDelete.size)
    return message.channel.send("Silinecek mesaj bulunamadı.");

  await message.channel.bulkDelete(toDelete, true);
  message.channel
    .send(`✅ ${toDelete.size} mesaj silindi.`)
    .then((m) => setTimeout(() => m.delete().catch(() => {}), 2000)) // .catch ile bastır
    .catch(() => {}); // ilk gönderme başarısızsa
};
