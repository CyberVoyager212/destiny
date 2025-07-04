const { MessageEmbed } = require("discord.js");

module.exports = async (client, member) => {
  // GGS yapılandırmasını alıyoruz
  const config = await client.db.get(`welcomegoodbye_${member.guild.id}`);
  if (!config || !config.enabled) return;

  // Invite Tracking: Eğer aktifse, hangi davetin kullanıldığını tespit ediyoruz
  let inviterId = null;
  if (config.inviteTracking) {
    try {
      // Güncel davetleri çekiyoruz
      const newInvites = await member.guild.invites.fetch();
      // Daha önceden cache'e alınan davetler (bot ready eventinde oluşturulmuş olmalı)
      const cachedInvites = client.invites.get(member.guild.id);
      // Kullanım sayısında artış olan daveti buluyoruz
      const usedInvite = newInvites.find((inv) => {
        const oldInvite = cachedInvites.get(inv.code);
        const oldUses = oldInvite ? oldInvite.uses : 0;
        return inv.uses > oldUses;
      });
      if (usedInvite) {
        inviterId = usedInvite.inviter.id;
      }
      // Cache'i güncelliyoruz
      client.invites.set(member.guild.id, newInvites);
      // Eğer bir davet bulunduysa, daveti yapanı veritabanına kaydediyoruz
      if (inviterId) {
        await client.db.set(
          `inviter_${member.guild.id}_${member.id}`,
          inviterId
        );
      }
    } catch (err) {
      console.error("Invite tracking hatası:", err);
    }
  }

  // Giriş mesajını oluşturuyoruz
  let entryMessage = config.entryMessage;
  entryMessage = entryMessage.replace(/\$etiket/g, member.toString());
  entryMessage = entryMessage.replace(/\$sayı/g, member.guild.memberCount);
  entryMessage = entryMessage.replace(
    /\$katılım/g,
    member.joinedAt ? member.joinedAt.toLocaleDateString() : "N/A"
  );

  let inviterText = inviterId ? `<@${inviterId}>` : "Bilinmiyor";
  entryMessage = entryMessage.replace(/\$davet/g, inviterText);

  // Embed mesaj kontrolü (örn: "$embed;Başlık")
  let embed = null;
  const embedMatch = entryMessage.match(/\$embed;(.+)/);
  if (embedMatch) {
    const title = embedMatch[1].trim();
    embed = new MessageEmbed()
      .setTitle(title)
      .setDescription(entryMessage.replace(/\$embed;(.+)/, "").trim());
    entryMessage = "";
  }

  // Giriş kanalına mesajı gönderiyoruz
  const welcomeChannel = member.guild.channels.cache.get(
    config.incomingChannel
  );
  if (welcomeChannel) {
    if (embed) {
      welcomeChannel.send({ embeds: [embed] });
    } else {
      welcomeChannel.send(entryMessage);
    }
  }

  // Otorol (otomatik rol) ekleme
  if (config.otorol) {
    // "bot" veya "kullanıcı" kontrolü yapılıyor
    if (
      (config.otorol.type === "bot" && member.user.bot) ||
      (config.otorol.type === "kullanıcı" && !member.user.bot)
    ) {
      for (const roleId of config.otorol.roles) {
        const role = member.guild.roles.cache.get(roleId);
        if (role) {
          member.roles
            .add(role)
            .catch((err) => console.error("Otorol eklenemedi:", err));
        }
      }
    }
  }

  // Otoisim (otomatik nickname) ayarlama
  if (config.otoisim) {
    if (
      (config.otoisim.type === "bot" && member.user.bot) ||
      (config.otoisim.type === "kullanıcı" && !member.user.bot)
    ) {
      member
        .setNickname(config.otoisim.name)
        .catch((err) => console.error("Otoisim ayarlanamadı:", err));
    }
  }
};
