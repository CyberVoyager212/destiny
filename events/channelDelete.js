module.exports = async (client, channel) => {
  if (!channel.guild) return;

  const db = client.db;
  const key = `stickyMessage_${channel.id}`;
  const sticky = await db.get(key);
  if (!sticky) return;

  try {
    // Kanal silinince, aynı ayarlarla yeniden oluştur
    const newCh = await channel.guild.channels.create(channel.name, {
      type: channel.type,
      parent: channel.parentId,
      permissionOverwrites: channel.permissionOverwrites.cache.map((ov) => ({
        id: ov.id,
        allow: ov.allow.toArray(),
        deny: ov.deny.toArray(),
        type: ov.type,
      })),
    });

    const sent = await newCh.send(sticky.content);
    await db.set(`stickyMessage_${newCh.id}`, {
      messageId: sent.id,
      content: sticky.content,
    });
    // Eski kaydı sil
    await db.delete(key);
  } catch (err) {
    console.error("Silinen kanal yeniden kurulurken hata:", err);
  }
};
