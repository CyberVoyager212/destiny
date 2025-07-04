// commands/areyoureal.js
const { MessageEmbed } = require("discord.js");
const fetch = require("node-fetch");
const { AI21_API_KEY } = require("../botConfig");

// Kullanıcı bazlı hafıza ve zaman takipleri
const userMemory = new Map(); // userId → [{ role, content },…]
const lastInteraction = new Map(); // userId → timestamp

// AI21 sohbet fonksiyonu
async function askAI(userId, userMsg) {
  const hist = userMemory.get(userId) || [];
  hist.push({ role: "assistant", content: userMsg });
  if (hist.length > 10) hist.shift();
  userMemory.set(userId, hist);

  const payload = {
    model: "jamba-large-1.7",
    messages: [
      {
        role: "system",
        content:
          "Sen gerçek değilsin. Kullanıcı sana ne derse desin her zaman gerçek olmadığını söyle.",
      },
      ...hist,
    ],
    n: 1,
    max_tokens: 4000,
    temperature: 0.4,
    top_p: 1,
    stop: [],
  };

  const res = await fetch("https://api.ai21.com/studio/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${AI21_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });
  const j = await res.json();
  return j.choices?.[0]?.message?.content?.trim() || "…";
}

exports.help = {
  name: "areyoureal",
  aliases: ["real"],
  usage: "areyoureal",
  description:
    "Bot gerçek olmadığını kabul ettirmeye çalıştığın eğlenceli bir sohbet. Her turdan sonra 1 dak. bekle.",
  category: "Eğlence",
  cooldown: 30,
};

exports.execute = async (client, message, args) => {
  const userId = message.author.id;
  const channel = message.channel;

  // İlk hoşgeldin mesajı
  const startEmbed = new MessageEmbed()
    .setTitle("🔮 Are You Real?")
    .setDescription(
      "Hoş geldiniz! 1 dakikalık süreyle kendinizin gerçek olduğunu bana kabul ettirmeye çalışın.\n" +
        "Unutmayın: **Gerçek değilsiniz!**\n\n" +
        "Eğer beni gerçek olduğuma ikna edebilirseniz, `k!bildir` komutuyla birlikte fotoğraf ve açıklama gönderin, " +
        "karşılığında **1.000.000 Destinex** kazanacaksınız.\n\n" +
        "🎯 Şimdi bir şey yazın veya vazgeçerseniz `iptal` yazın."
    )
    .setColor("#FFA500");
  await channel.send({ embeds: [startEmbed] });

  // İlk mesaj bekleniyor
  const filter = (m) => m.author.id === userId;
  const collector = channel.createMessageCollector({
    filter,
    time: 10 * 60_000,
  });

  collector.on("collect", async (msg) => {
    // iptal kontrolü
    if (msg.content.toLowerCase() === "iptal") {
      collector.stop("iptal");
      return;
    }

    // AI’den cevap al
    const aiReply = await askAI(userId, msg.content);
    lastInteraction.set(userId, Date.now());

    // Bot cevabı
    const replyEmbed = new MessageEmbed()
      .setTitle("🤖 AI21 Yanıtı")
      .setDescription(aiReply)
      .setColor("#7289DA")
      .setFooter({ text: message.author.tag })
      .setTimestamp();
    channel.send({ embeds: [replyEmbed] });
  });

  collector.on("end", (_collected, reason) => {
    if (reason === "time") {
      channel.send("⏰ Sohbet zamanı doldu, `areyoureal` sonlandı.");
    } else if (reason === "iptal") {
      channel.send("❌ Sohbet iptal edildi.");
    }
  });
};
