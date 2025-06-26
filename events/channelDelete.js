module.exports = async (client, channel) => {
  if (!channel.guild) return;

  // Silinen kanal için yapışkan mesaj kontrolü
  const stickyData = client.db.get(`stickyMessage_${channel.id}`);
  if (!stickyData) return;

  try {
    // Kanalın özelliklerini kullanarak aynı kategoride yeni bir kanal oluşturuyoruz.
    const newChannel = await channel.guild.channels.create(channel.name, {
      type: channel.type,
      parent: channel.parentId,
      permissionOverwrites: channel.permissionOverwrites.cache.map((overwrite) => {
        return {
          id: overwrite.id,
          allow: overwrite.allow.toArray(),
          deny: overwrite.deny.toArray(),
          type: overwrite.type,
        };
      }),
    });

    const sentMessage = await newChannel.send(`${stickyData.content}`);

    // Yeni kanal için veritabanını güncelle
    client.db.set(`stickyMessage_${newChannel.id}`, {
      messageId: sentMessage.id,
      content: stickyData.content,
    });

    // Eski kanal verisini sil
    client.db.delete(`stickyMessage_${channel.id}`);
  } catch (error) {
    console.error("Silinen kanal yeniden oluşturulurken hata oluştu:", error);
  }
};
