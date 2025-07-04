const { MessageEmbed } = require("discord.js");

module.exports = async (client, member) => {
  // GGS yapılandırmasını alıyoruz
  const config = await client.db.get(`welcomegoodbye_${member.guild.id}`);
  if (!config || !config.enabled) return;

  // Çıkış mesajını oluşturuyoruz
  let exitMessage = config.exitMessage;
  exitMessage = exitMessage.replace(/\$etiket/g, member.toString());
  exitMessage = exitMessage.replace(/\$sayı/g, member.guild.memberCount);
  exitMessage = exitMessage.replace(
    /\$katılım/g,
    member.joinedAt ? member.joinedAt.toLocaleDateString() : "N/A"
  );

  // Davet takibi: üyenin girişinde kaydedilen davet bilgisini kullanıyoruz
  let inviterText = "Bilinmiyor";
  if (config.inviteTracking) {
    const inviter = await client.db.get(
      `inviter_${member.guild.id}_${member.id}`
    );
    inviterText = inviter ? `<@${inviter}>` : "Bilinmiyor";
  }
  exitMessage = exitMessage.replace(/\$davet/g, inviterText);

  // Embed mesaj kontrolü
  let embed = null;
  const embedMatch = exitMessage.match(/\$embed;(.+)/);
  if (embedMatch) {
    const title = embedMatch[1].trim();
    embed = new MessageEmbed()
      .setTitle(title)
      .setDescription(exitMessage.replace(/\$embed;(.+)/, "").trim());
    exitMessage = "";
  }

  // Çıkış kanalına mesajı gönderiyoruz
  const goodbyeChannel = member.guild.channels.cache.get(
    config.outgoingChannel
  );
  if (goodbyeChannel) {
    if (embed) {
      goodbyeChannel.send({ embeds: [embed] });
    } else {
      goodbyeChannel.send(exitMessage);
    }
  }

  // Opsiyonel: Üyenin girişinde kaydedilen davet bilgisini temizliyoruz
  if (config.inviteTracking) {
    await client.db.delete(`inviter_${member.guild.id}_${member.id}`);
  }
};
