// events/ready.js
const fetch = require("node-fetch");
const { Permissions } = require("discord.js");
const { QuickDB } = require("quick.db"); // QuickDB import edildi
const { joinVoiceChannel } = require("@discordjs/voice");

// QuickDB örneği (client üzerinden değil, direkt modül içinde kullanıyoruz)
const db = new QuickDB();

module.exports = async (client) => {
  // 1) Başlangıç logu
  console.log(`${client.user.tag} çevrimiçi.`);

  // 2) Otomatik VC katılma
  for (const guild of client.guilds.cache.values()) {
    // Yeni QuickDB ile autoVC verisini oku
    const channelId = await db.get(`autoVC_${guild.id}`);
    if (!channelId) continue;

    const channel = guild.channels.cache.get(channelId);
    if (
      !channel ||
      !channel.permissionsFor(client.user).has(Permissions.FLAGS.CONNECT)
    )
      continue;

    try {
      joinVoiceChannel({
        channelId: channel.id,
        guildId: guild.id,
        adapterCreator: channel.guild.voiceAdapterCreator,
      });
      console.log(
        `[AutoVC] ${guild.name} › ${channel.name} kanalına katıldım.`
      );
    } catch (err) {
      console.error(`[AutoVC] ${guild.name} kanalına katılamadı:`, err);
    }
  }

  // 3) Döngüsel durum metinleri
  const statuses = [
    { name: "k!help ile yardım alabilirsiniz", type: "LISTENING" },
    { name: "Bir sorun mu var? k!bildir kullan 🆘", type: "PLAYING" },
    { name: "Destiny v14 geliştiriliyor", type: "PLAYING" },
  ];
  let idx = 0;
  setInterval(() => {
    const s = statuses[idx];
    client.user.setActivity(s.name, { type: s.type });
    idx = (idx + 1) % statuses.length;
  }, 10 * 1000);
};
