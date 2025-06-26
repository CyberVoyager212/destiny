module.exports = (client) => {
  console.log(`${client.user.tag} is online!`);

  
  // Botun durumları
  const statuses = [
    { name: "Yardım için k!help 🆘", type: "LISTENING" },
    { name: "Bot Yenilendi", type: "PLAYING" },
    {
      name: "Botta hata bulursanız k!bildir komutunu kullanın 💻",
      type: "COMPETING",
    },
    {
      name: "Kayıt Sistemi-v2.2 🎥",
      type: "STREAMING",
      url: "https://www.twitch.tv/yourchannel",
    },
    {
      name: "Kumar Sistemi-v4.2 🎲",
      type: "STREAMING",
      url: "https://www.twitch.tv/yourchannel",
    },
    {
      name: "Moderasyon-v2.5 ⚖️",
      type: "STREAMING",
      url: "https://www.twitch.tv/yourchannel",
    },
    {
      name: "Mute Sistemi-v2.1 🔇",
      type: "STREAMING",
      url: "https://www.twitch.tv/yourchannel",
    },    
    {
      name: "Gelen Giden Sistemi-v2.1 🎟️",
      type: "STREAMING",
      url: "https://www.twitch.tv/yourchannel",
    },
    {
      name: "Ticket Sistemi-v2.1 🎫",
      type: "STREAMING",
      url: "https://www.twitch.tv/yourchannel",
    },
    {
      name: "Automod Sistemi-v1.0 ⚔️",
      type: "STREAMING",
      url: "https://www.twitch.tv/yourchannel",
    },
    {
      name: "Bilgi Yarışması-v2.4 🏆",
      type: "STREAMING",
      url: "https://www.twitch.tv/yourchannel",
    },
    {
      name: "Görsel Oluşturma-v2.6 🖼️",
      type: "STREAMING",
      url: "https://www.twitch.tv/yourchannel",
    },
    {
      name: "Yazılı Konuşma-v2.2 ✍️",
      type: "STREAMING",
      url: "https://www.twitch.tv/yourchannel",
    },
    {
      name: "Webde Arama-v2.8 🌐",
      type: "STREAMING",
      url: "https://www.twitch.tv/yourchannel",
    },
    {
      name: "NEW-80+ farklı eğlence komutu 🥳",
      type: "STREAMING",
      url: "https://www.twitch.tv/yourchannel",
    },
  ];

  let currentIndex = 0;

  // Durumları değiştiren bir interval ayarlıyoruz
  setInterval(() => {
    const status = statuses[currentIndex];

    if (status.type === "STREAMING") {
      client.user.setActivity(status.name, {
        type: status.type,
        url: status.url,
      });
    } else {
      client.user.setActivity(status.name, { type: status.type });
    }

    // Sıradaki duruma geç
    currentIndex = (currentIndex + 1) % statuses.length;
  }, 10000); // Her 10 saniyede bir durum değişir
};
