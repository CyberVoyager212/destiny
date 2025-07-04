exports.help = {
  name: "kanal",
  aliases: [],
  usage: "k!kanal gizle | k!kanal aç",
  description: "Kanalı yönetici olmayanlar için gizler ya da görünür yapar.",
  category: "Moderasyon",
  cooldown: 5,
};

exports.execute = async (client, message, args) => {
  if (!message.member.permissions.has("MANAGE_CHANNELS")) {
    return message.reply(
      "❌ Bu komutu kullanmak için `Kanalları Yönet` yetkisine sahip olmalısın."
    );
  }

  const sub = args[0]?.toLowerCase();
  const channel = message.channel;

  if (!sub || !["gizle", "aç"].includes(sub)) {
    return message.reply(
      "Geçersiz kullanım! `k!kanal gizle` veya `k!kanal aç` kullan."
    );
  }

  const everyone = message.guild.roles.everyone;

  if (sub === "gizle") {
    await channel.permissionOverwrites.edit(everyone, {
      VIEW_CHANNEL: false,
    });
    return message.reply("🔒 Kanal, yönetici olmayanlar için gizlendi.");
  }

  if (sub === "aç") {
    await channel.permissionOverwrites.edit(everyone, {
      VIEW_CHANNEL: true,
    });
    return message.reply(
      "🔓 Kanal, yönetici olmayanlar için tekrar görünür hale getirildi."
    );
  }
};
