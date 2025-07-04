const { Client, Collection, Intents } = require("discord.js");
const fs = require("fs");
const { QuickDB } = require("quick.db");
const express = require("express");

// Config dosyası (token, prefix, admin listesi vs.)
const config = require("./botConfig.js");

// Yeni client örneği, gerekli intentlerle
const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MEMBERS,
    Intents.FLAGS.GUILD_VOICE_STATES,
  ],
});
client.setMaxListeners(200);

// Global koleksiyonlar
client.commands = new Collection();
client.aliases = new Collection();
client.games = new Map();

// QuickDB veritabanı örneği
const db = new QuickDB();
client.db = db; // Client'a DB ataması yapıldı

// Basit ekonomi yöneticisi
client.eco = {
  async fetchMoney(userId) {
    const value = await db.get(`money_${userId}`);
    return Number(value) || 0;
  },
  async addMoney(userId, amount) {
    const before = await this.fetchMoney(userId);
    const after = before + amount;
    await db.set(`money_${userId}`, after);
    return { before, after };
  },
  async removeMoney(userId, amount) {
    const before = await this.fetchMoney(userId);
    const after = Math.max(before - amount, 0);
    await db.set(`money_${userId}`, after);
    return { before, after };
  },
};

// index.js

const items = [
  {
    id: 1,
    name: "Elmas",
    emoji: "💎",
    description: "Değerli ve nadir bir taş.",
    value: 500,
  },
  {
    id: 2,
    name: "Altın",
    emoji: "🥇",
    description: "Parlak ve değerli bir metal.",
    value: 300,
  },
  {
    id: 3,
    name: "Demir",
    emoji: "⛓️",
    description: "Güçlü ve dayanıklı bir metal.",
    value: 150,
  },
  {
    id: 4,
    name: "Ahşap",
    emoji: "🪵",
    description: "Temel yapı malzemesi.",
    value: 50,
  },
  {
    id: 5,
    name: "Taş",
    emoji: "🪨",
    description: "Basit maden kayası.",
    value: 30,
  },
  {
    id: 6,
    name: "Su Şişesi",
    emoji: "💧",
    description: "Susuzluğu giderir.",
    value: 20,
  },
  {
    id: 7,
    name: "Yemek Tabağı",
    emoji: "🍽️",
    description: "Açlığı giderir.",
    value: 40,
  },
  {
    id: 8,
    name: "Ekmeğimsi",
    emoji: "🍞",
    description: "Karbonhidrat kaynağı.",
    value: 25,
  },
  { id: 9, name: "Et", emoji: "🍖", description: "Protein deposu.", value: 60 },
  {
    id: 10,
    name: "Balık",
    emoji: "🐟",
    description: "Denizden gelen lezzet.",
    value: 70,
  },
  {
    id: 11,
    name: "Elma",
    emoji: "🍎",
    description: "Sağlıklı bir atıştırmalık.",
    value: 15,
  },
  {
    id: 12,
    name: "Muz",
    emoji: "🍌",
    description: "Enerji verici meyve.",
    value: 18,
  },
  {
    id: 13,
    name: "Üzüm",
    emoji: "🍇",
    description: "Tatlı ve sulu meyve.",
    value: 22,
  },
  {
    id: 14,
    name: "Portakal",
    emoji: "🍊",
    description: "C vitamini kaynağı.",
    value: 20,
  },
  {
    id: 15,
    name: "Şarap",
    emoji: "🍷",
    description: "Olgunlaşmış meyve içkisi.",
    value: 150,
  },
  {
    id: 16,
    name: "Bira",
    emoji: "🍺",
    description: "Fermente içecek.",
    value: 80,
  },
  {
    id: 17,
    name: "Kahve",
    emoji: "☕",
    description: "Güne enerjiyle başla.",
    value: 45,
  },
  {
    id: 18,
    name: "Çay",
    emoji: "🍵",
    description: "Rahatlatıcı içecek.",
    value: 30,
  },
  {
    id: 19,
    name: "Kitap",
    emoji: "📚",
    description: "Bilgi kaynağı.",
    value: 200,
  },
  {
    id: 20,
    name: "Harita",
    emoji: "🗺️",
    description: "Keşif rehberi.",
    value: 120,
  },
  {
    id: 21,
    name: "Pusula",
    emoji: "🧭",
    description: "Yön gösterir.",
    value: 110,
  },
  {
    id: 22,
    name: "Fener",
    emoji: "🔦",
    description: "Karanlıkta ışık sağlar.",
    value: 90,
  },
  {
    id: 23,
    name: "Kılıç",
    emoji: "⚔️",
    description: "Saldırı silahı.",
    value: 300,
  },
  {
    id: 24,
    name: "Kalkan",
    emoji: "🛡️",
    description: "Savunma ekipmanı.",
    value: 250,
  },
  {
    id: 25,
    name: "Ok",
    emoji: "🏹",
    description: "Uzak saldırı silahı.",
    value: 100,
  },
  {
    id: 26,
    name: "Yay",
    emoji: "🏹",
    description: "Ok atmak için.",
    value: 180,
  },
  {
    id: 27,
    name: "Zırh",
    emoji: "🥋",
    description: "Koruyucu kıyafet.",
    value: 350,
  },
  {
    id: 28,
    name: "Cüppe",
    emoji: "🧙‍♂️",
    description: "Büyücü kıyafeti.",
    value: 220,
  },
  {
    id: 29,
    name: "Büyü Kitabı",
    emoji: "📖",
    description: "Gizli sihirler.",
    value: 400,
  },
  {
    id: 30,
    name: "Mantar",
    emoji: "🍄",
    description: "Ormanda bulunur.",
    value: 35,
  },
  {
    id: 31,
    name: "Çiçek",
    emoji: "🌸",
    description: "Güzel kokulu bitki.",
    value: 25,
  },
  {
    id: 32,
    name: "Bal",
    emoji: "🍯",
    description: "Tatlı ve yapışkan.",
    value: 60,
  },
  {
    id: 33,
    name: "Süt",
    emoji: "🥛",
    description: "Kalsiyum kaynağı.",
    value: 30,
  },
  {
    id: 34,
    name: "Yumurta",
    emoji: "🥚",
    description: "Protein deposu.",
    value: 20,
  },
  {
    id: 35,
    name: "Makas",
    emoji: "✂️",
    description: "Kesici alet.",
    value: 50,
  },
  {
    id: 36,
    name: "Çekiç",
    emoji: "🔨",
    description: "Çivi çakmak için.",
    value: 70,
  },
  {
    id: 37,
    name: "Pense",
    emoji: "🔧",
    description: "Cıvata sıkmak için.",
    value: 65,
  },
  {
    id: 38,
    name: "Vida",
    emoji: "🔩",
    description: "Bağlantı parçası.",
    value: 15,
  },
  {
    id: 39,
    name: "Somun",
    emoji: "🔩",
    description: "Vida karşıt parça.",
    value: 15,
  },
  {
    id: 40,
    name: "Matkap",
    emoji: "🛠️",
    description: "Delme aleti.",
    value: 200,
  },
  {
    id: 41,
    name: "Testere",
    emoji: "🪚",
    description: "Kesme aleti.",
    value: 180,
  },
  {
    id: 42,
    name: "Çekiç",
    emoji: "🔨",
    description: "Çivi çakmak için.",
    value: 70,
  },
  {
    id: 43,
    name: "Kredi Kartı",
    emoji: "💳",
    description: "Dijital para aracı.",
    value: 500,
  },
  {
    id: 44,
    name: "Anahtar",
    emoji: "🔑",
    description: "Kilidi açar.",
    value: 80,
  },
  {
    id: 45,
    name: "Gözlük",
    emoji: "👓",
    description: "Görmeyi sağlar.",
    value: 150,
  },
  {
    id: 46,
    name: "Saat",
    emoji: "⌚",
    description: "Zamanı gösterir.",
    value: 220,
  },
  {
    id: 47,
    name: "Telefon",
    emoji: "📱",
    description: "İletişim aracı.",
    value: 800,
  },
  {
    id: 48,
    name: "Bilgisayar",
    emoji: "💻",
    description: "Çalışma aracı.",
    value: 1200,
  },
  {
    id: 49,
    name: "Tablet",
    emoji: "📊",
    description: "Taşınabilir bilgisayar.",
    value: 900,
  },
  {
    id: 50,
    name: "Kulaklık",
    emoji: "🎧",
    description: "Ses dinleme cihazı.",
    value: 300,
  },
  {
    id: 51,
    name: "Hoparlör",
    emoji: "🔊",
    description: "Ses çalma cihazı.",
    value: 350,
  },
  {
    id: 52,
    name: "Mikrofon",
    emoji: "🎤",
    description: "Ses kaydetme cihazı.",
    value: 250,
  },
  {
    id: 53,
    name: "Kamera",
    emoji: "📷",
    description: "Fotoğraf çekme.",
    value: 600,
  },
  {
    id: 54,
    name: "Film",
    emoji: "🎬",
    description: "Eğlence kaynağı.",
    value: 100,
  },
  {
    id: 55,
    name: "Kitaplık",
    emoji: "🪑",
    description: "Kitaplar için depolama.",
    value: 500,
  },
  {
    id: 56,
    name: "Masa",
    emoji: "🪞",
    description: "Çalışma alanı.",
    value: 400,
  },
  {
    id: 57,
    name: "Sandalye",
    emoji: "🪑",
    description: "Oturmak için.",
    value: 200,
  },
  {
    id: 58,
    name: "Koltuk",
    emoji: "🛋️",
    description: "Rahat oturma.",
    value: 600,
  },
  {
    id: 59,
    name: "Yorgan",
    emoji: "🛏️",
    description: "Sıcak tutar.",
    value: 300,
  },
  {
    id: 60,
    name: "Yastık",
    emoji: "🛏️",
    description: "Baş desteği.",
    value: 100,
  },
  {
    id: 61,
    name: "Çarşaf",
    emoji: "🛏️",
    description: "Yatak örtüsü.",
    value: 150,
  },
  {
    id: 62,
    name: "Halı",
    emoji: "🧶",
    description: "Zemin örtüsü.",
    value: 250,
  },
  {
    id: 63,
    name: "Perde",
    emoji: "🪟",
    description: "Pencere örtüsü.",
    value: 200,
  },
  {
    id: 64,
    name: "Lamba",
    emoji: "💡",
    description: "Işık kaynağı.",
    value: 180,
  },
  { id: 65, name: "Fan", emoji: "🌀", description: "Hava akımı.", value: 160 },
  {
    id: 66,
    name: "Klima",
    emoji: "❄️",
    description: "Hava soğutma.",
    value: 1000,
  },
  {
    id: 67,
    name: "Fırın",
    emoji: "🍞",
    description: "Pişirme aracı.",
    value: 550,
  },
  {
    id: 68,
    name: "Buzdolabı",
    emoji: "🧊",
    description: "Yiyecek koruma.",
    value: 800,
  },
  {
    id: 69,
    name: "Çamaşır Makinesi",
    emoji: "🚿",
    description: "Giysi temizler.",
    value: 700,
  },
  {
    id: 70,
    name: "Bulaşık Makinesi",
    emoji: "🍽️",
    description: "Tabak yıkar.",
    value: 650,
  },
];

module.exports = { items };

// Config ataması
client.config = config;

// Eventleri dinamik yükleme
fs.readdir("./events/", (err, files) => {
  if (err) return console.error("Event dosyaları okunamadı:", err);
  files
    .filter((f) => f.endsWith(".js"))
    .forEach((file) => {
      const event = require(`./events/${file}`);
      const eventName = file.split(".")[0];
      client.on(eventName, (...args) => event(client, ...args));
    });
});

// Komutları dinamik yükleme
fs.readdir("./commands/", (err, files) => {
  if (err) return console.error("Komut dosyaları okunamadı:", err);
  files
    .filter((f) => f.endsWith(".js"))
    .forEach((file) => {
      const command = require(`./commands/${file}`);
      client.commands.set(command.help.name, command);
      if (Array.isArray(command.help.aliases)) {
        command.help.aliases.forEach((alias) => {
          client.aliases.set(alias, command.help.name);
        });
      }
    });
});

// Bot hazır olduğunda konsola bilgi ver
client.once("ready", () => {
  console.log(`Bot giriş yaptı: ${client.user.tag}`);
});

// Login işlemi
client.login(client.config.token).catch((err) => {
  console.error("Bot giriş yaparken hata oluştu:", err);
});
