// index.js

const { Client, Intents, Collection, MessageEmbed, Permissions } = require("discord.js");
const fs = require("fs");
const Eco = require("quick.eco");
const config = require("./botConfig");

// İstemciyi gerekli intentlerle oluşturuyoruz.
const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS, 
    Intents.FLAGS.GUILD_MESSAGES, 
    Intents.FLAGS.DIRECT_MESSAGES, 
    Intents.FLAGS.GUILD_MEMBERS,
  ],
  partials: ["CHANNEL", "MESSAGE", "REACTION"],
});

// Koleksiyonlar ve diğer özelliklerin tanımlanması
client.commands = new Collection();
client.aliases = new Collection();
client.games = new Map();
client.eco = new Eco.Manager(); // quick.eco
client.db = Eco.db; // quick.db
client.config = config;

// --------------------
// Komutların Yüklenmesi
// --------------------
fs.readdir("./commands/", (err, files) => {
  if (err) return console.error("Komutlar yüklenirken hata oluştu:", err);
  files.forEach((file) => {
    if (!file.endsWith(".js")) return;
    const command = require(`./commands/${file}`);
    if (!command.help || !command.help.name) {
      console.error(`Komut ${file} geçerli bir yardım nesnesine sahip değil.`);
      return;
    }
    client.commands.set(command.help.name, command);
    if (command.help.aliases && Array.isArray(command.help.aliases)) {
      command.help.aliases.forEach((alias) => {
        client.aliases.set(alias, command.help.name);
      });
    }
  });
});

// --------------------
// Eventlerin Yüklenmesi
// --------------------
fs.readdir("./events/", (err, files) => {
  if (err) return console.error("Eventler yüklenirken hata oluştu:", err);
  files.forEach((file) => {
    if (!file.endsWith(".js")) return;
    const event = require(`./events/${file}`);
    const eventName = file.split(".")[0];
    client.on(eventName, event.bind(null, client));
  });
});

// --------------------
// Ek Fonksiyonlar: Coin Tablosu ve Yardımcı İşlemler
// --------------------
function getRandomPrice() {
  return Math.floor(Math.random() * 9000) + 1000;
}

function generateInitialCoins() {
  return {
    Bitcoin: { history: [getRandomPrice()] },
    Ethereum: { history: [getRandomPrice()] },
    Litecoin: { history: [getRandomPrice()] },
    Dogecoin: { history: [getRandomPrice()] },
    Ripple: { history: [getRandomPrice()] },
    Cardano: { history: [getRandomPrice()] },
    Polkadot: { history: [getRandomPrice()] },
    Solana: { history: [getRandomPrice()] },
    Chainlink: { history: [getRandomPrice()] },
    Stellar: { history: [getRandomPrice()] },
  };
}

async function updateCoinTableEmbed(client) {
  try {
    // client.config üzerinden coin tablosunun bulunduğu kanal ve mesaj ID'sini alıyoruz.
    const channelId = client.config.coinTableChannelId;
    const messageId = client.config.coinTableMessageId;
    if (!channelId || !messageId) {
      console.log("Coin table kanal veya mesaj ID'si ayarlanmamış.");
      return;
    }

    const channel = await client.channels.fetch(channelId);
    if (!channel) {
      console.log("Belirtilen coin table kanalı bulunamadı.");
      return;
    }

    const message = await channel.messages.fetch(messageId);
    if (!message) {
      console.log("Belirtilen coin table mesajı bulunamadı.");
      return;
    }

    let coins = client.db.get("coins");
    if (!coins) {
      coins = generateInitialCoins();
      client.db.set("coins", coins);
    }

    let embed = new MessageEmbed()
      .setTitle("📈 Güncel Coin Durumları")
      .setColor("BLUE");

    Object.keys(coins).forEach((coin) => {
      let priceHistory = coins[coin].history;
      let lastPrice = priceHistory.slice(-1)[0];
      let previousPrice = priceHistory.length > 1 ? priceHistory[priceHistory.length - 2] : lastPrice;
      let trend = lastPrice > previousPrice ? "📈" : "📉";
      embed.addField(
        coin,
        `<:cuval_DNX:1347664200620572702> **${lastPrice}** ${trend}`,
        true
      );
    });

    embed.setFooter({
      text: `Son güncelleme: ${new Date().toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" })}`,
    });

    await message.edit({ embeds: [embed] });
  } catch (error) {
    console.error("Coin table embed güncellenirken hata oluştu:", error);
  }
}

// --------------------
// Bot Hazır Olduğunda Yapılacak İşlemler
// --------------------
client.once("ready", async () => {
  console.log(`Bot başarıyla giriş yaptı: ${client.user.tag}`);

  // Tüm sunuculardaki davetleri çekmek için
  client.invites = new Collection();
  await Promise.all(
    client.guilds.cache.map(async (guild) => {
      try {
        const invites = await guild.invites.fetch();
        const inviteMap = new Collection();
        invites.forEach((invite) => inviteMap.set(invite.code, { uses: invite.uses, inviter: invite.inviter?.id }));
        client.invites.set(guild.id, inviteMap);
      } catch (err) {
        console.error(`${guild.name} sunucusunun davetleri çekilemedi:`, err);
      }
    })
  );

  // Örnek: Belirli bir kanalda coin tablosu komutunu çalıştırmak (opsiyonel)
  try {
    const coinCommand = require("./commands/coin.js");
    const channelId = "1347625145430184118"; // Coin tablosunun güncelleneceği kanal
    const channel = await client.channels.fetch(channelId);
    if (!channel) {
      console.log("❌ Belirtilen kanal bulunamadı!");
    } else {
      const fakeMessage = {
        content: "k!coin tablo",
        author: { id: "707269247532793858", bot: false },
        channel: channel,
        client: client,
        send: (msg) => channel.send(msg),
      };
      const args = ["tablo"];
      await coinCommand.execute(client, fakeMessage, args);
    }
  } catch (error) {
    console.error("Komut çalıştırılırken hata oluştu:", error);
  }

  // Botun bulunduğu sunucu, kanal ve üye bilgilerini dosyaya yazma
  let data = "📌 Botun Bulunduğu Sunucular, Kanallar ve Üyeler:\n\n";
  for (const guild of client.guilds.cache.values()) {
    data += `🏠 Sunucu: ${guild.name} (${guild.id})\n`;
    try {
      const members = await guild.members.fetch();
      data += "👥 Üyeler:\n";
      members.forEach((member) => {
        data += `  - ${member.user.tag} (${member.id})\n`;
      });
      const channels = guild.channels.cache;
      data += "📢 Kanallar:\n";
      channels.forEach((channel) => {
        data += `  - ${channel.name} (${channel.id}) [${channel.type}]\n`;
      });
      data += "\n-------------------------------------\n\n";
    } catch (err) {
      console.error(`Hata: ${guild.name} sunucusundaki veriler çekilemedi.`, err);
    }
  }

  // İlk güncelleme hemen yapılsın, sonrasında her 60 dakikada bir güncellensin.
  updateCoinTableEmbed(client);
  setInterval(() => {
    updateCoinTableEmbed(client);
  }, 60 * 60 * 1000);
});

// --------------------
// Botun Discord'a Giriş Yapması
// --------------------
client.login(config.token);
