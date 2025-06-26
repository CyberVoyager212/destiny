module.exports = async (client, message) => {
  if (!message.guild) return;

  // Botun mesajı değilse, silinen mesajı kaydet.
  if (!message.partial && message.author.id !== client.user.id && message.guild) {
    let guildKey = `deletedMessages_${message.guild.id}`;
    let deletedMessages = (await client.db.get(guildKey)) || [];
    let timestamp = new Date().toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    deletedMessages.unshift(
      `[${timestamp}] **${message.author.tag}**: ${message.content}`
    );
    if (deletedMessages.length > 10) deletedMessages.pop();

    client.db.set(guildKey, deletedMessages);
  }

  // Yapışkan mesaj kontrolü
  const stickyData = client.db.get(`stickyMessage_${message.channel.id}`);
  if (!stickyData) return;

  if (message.id === stickyData.messageId) {
    try {
      const sentMessage = await message.channel.send(`${stickyData.content}`);
      // Yeni mesaj ID'sini güncelle
      client.db.set(`stickyMessage_${message.channel.id}`, {
        messageId: sentMessage.id,
        content: stickyData.content,
      });
    } catch (error) {
      console.error("Yapışkan mesaj tekrar gönderilirken hata oluştu:", error);
    }
  }
};
