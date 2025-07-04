// commands/vc.js
const { Permissions } = require("discord.js");
const { joinVoiceChannel, getVoiceConnection } = require("@discordjs/voice");

exports.execute = async (client, message, args) => {
  // Yalnızca Sunucuyu Yönet yetkisi olanlar
  if (!message.member.permissions.has(Permissions.FLAGS.MANAGE_GUILD)) {
    return message.reply(
      "❌ **Bu komutu kullanmak için `Sunucuyu Yönet` yetkisine sahip olmalısın!**"
    );
  }

  const sub = args[0]?.toLowerCase();
  if (!sub || !["join", "leave"].includes(sub)) {
    return message.reply(
      "⚠️ **Alt komut kullanın: `vc join` veya `vc leave`**"
    );
  }

  const dbKey = `autoVC_${message.guild.id}`;

  if (sub === "join") {
    const channel = message.member.voice.channel;
    if (!channel) {
      return message.reply("❌ **Önce bir ses kanalına katılmalısın!**");
    }

    try {
      // Botu ses kanalına bağla
      joinVoiceChannel({
        channelId: channel.id,
        guildId: channel.guild.id,
        adapterCreator: channel.guild.voiceAdapterCreator,
      });
      // Otomatik tekrar için kaydet
      await client.db.set(dbKey, channel.id);
      return message.channel.send(
        `✅ **${channel.name} kanalına katıldım ve otomatik tekrar aktif!**`
      );
    } catch (err) {
      console.error(err);
      return message.reply("❌ **Ses kanalına katılırken hata oluştu.**");
    }
  }

  if (sub === "leave") {
    try {
      // DB kaydını sil
      await client.db.delete(dbKey);
      // Bağlantıyı al ve yok et
      const conn = getVoiceConnection(message.guild.id);
      if (conn) conn.destroy();
      return message.channel.send(
        "✅ **Ses kanalından çıktım ve otomatik tekrar kapatıldı!**"
      );
    } catch (err) {
      console.error(err);
      return message.reply("❌ **Ses kanalından çıkarken hata oluştu.**");
    }
  }
};

exports.help = {
  name: "vc",
  aliases: ["ses"],
  usage: "vc <join|leave>",
  description:
    "Botu bulunduğunuz ses kanalına katılır ve otomatik tekrar katılmayı ayarlar veya çıkarır.",
  category: "Araçlar",
  cooldown: 5,
};
