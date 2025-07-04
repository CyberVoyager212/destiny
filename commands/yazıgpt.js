const { Permissions } = require("discord.js");
const fetch = require("node-fetch");
const config = require("../botConfig.js");

// Kanal bazında konuşma geçmişi
const conversationHistories = {}; // channelId → { messages: [] }

module.exports = {
  name: "yazıgpt",
  description: "Yazılı modda Destiny ile AI21 üzerinden iletişim kurar.",
  usage: "yazıgpt <restart|create|close>",
  aliases: [],
  category: "Araçlar",
  cooldown: 5,

  async execute(client, message, args) {
    const member = message.member;
    const guild = message.guild;
    const channelName = `destiny-${member.user.username}`;
    const existingChannel = guild.channels.cache.find(
      (ch) => ch.name === channelName
    );

    // Alt komutlar: restart, create, close
    const action = args[0]?.toLowerCase();
    if (["restart", "create", "close"].includes(action)) {
      if (action === "restart") {
        if (!existingChannel)
          return message.reply("Önce `create` ile kanal açmalısın.");
        listenToTextChannel(client, existingChannel, member);
        return message.reply(`Yeniden dinleniyor: ${existingChannel}`);
      }

      if (action === "create") {
        if (existingChannel)
          return message.reply(`Zaten açılmış: ${existingChannel}`);
        const channel = await guild.channels.create(channelName, {
          type: "GUILD_TEXT",
          permissionOverwrites: [
            { id: guild.id, deny: [Permissions.FLAGS.VIEW_CHANNEL] },
            {
              id: member.id,
              allow: [
                Permissions.FLAGS.VIEW_CHANNEL,
                Permissions.FLAGS.SEND_MESSAGES,
              ],
            },
            {
              id: client.user.id,
              allow: [
                Permissions.FLAGS.VIEW_CHANNEL,
                Permissions.FLAGS.SEND_MESSAGES,
              ],
            },
          ],
        });
        conversationHistories[channel.id] = {
          messages: [
            {
              role: "system",
              content:
                "Sen Destiny adlı bir Discord botusun. Kullanıcılarla samimi, anlaşılır ve doğru Türkçe ile sohbet et.",
            },
          ],
        };
        listenToTextChannel(client, channel, member);
        return message.reply(`Oluşturuldu ve dinleniyor: ${channel}`);
      }

      if (action === "close") {
        if (!existingChannel)
          return message.reply("Kapatılacak bir kanalın yok.");

        await message.reply(`Kanal kapatılıyor: ${existingChannel.name}`);
        delete conversationHistories[existingChannel.id];
        await existingChannel.delete();
        return;
      }
    }

    // Eğer subkomut verilmemişse uyar
    return message.reply(
      "Lütfen `restart`, `create` veya `close` olarak kullanın."
    );
  },
};

async function listenToTextChannel(client, channel, creator) {
  client.on("messageCreate", async (msg) => {
    if (msg.channel.id !== channel.id || msg.author.bot) return;
    if (msg.author.id !== creator.id) return;
    if (msg.content.startsWith("k!")) return;

    // Geçmişi al / başlat
    let history = conversationHistories[channel.id];
    if (!history) {
      history = {
        messages: [
          {
            role: "system",
            content:
              "Sen Destiny adlı bir Discord botusun. Kullanıcılarla samimi, anlaşılır ve doğru Türkçe ile sohbet et.",
          },
        ],
      };
    }

    // Kullanıcı mesajını ekle
    history.messages.push({ role: "user", content: msg.content });

    // AI21’den cevap al
    let reply;
    try {
      reply = await fetchChatFromAI21(
        process.env.AI21_API_KEY || client.config.AI21_API_KEY,
        history.messages
      );
    } catch (e) {
      console.error(e);
      return msg.reply("AI21 API'den cevap alınamadı.");
    }

    // Cevabı ekle ve ilet
    history.messages.push({ role: "assistant", content: reply });
    conversationHistories[channel.id] = history;

    // Uzun mesajları parçalara bölerek gönder
    const chunks = reply.match(/[\s\S]{1,2000}/g);
    for (const chunk of chunks) {
      await channel.send(chunk);
    }
  });
}

async function fetchChatFromAI21(apiKey, messages) {
  const res = await fetch("https://api.ai21.com/studio/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "jamba-large-1.7",
      messages,
      max_tokens: 4000,
      temperature: 0.8,
    }),
  });
  if (!res.ok) throw new Error(`AI21 error ${res.status}`);
  const data = await res.json();
  return data.choices[0].message.content.trim();
}

module.exports.help = {
  name: "yazıgpt",
  aliases: [],
  usage: "yazıgpt <restart|create|close>",
  description: "Destiny ile yazılı modda AI21 üzerinden sohbet gerçekleştirir.",
  category: "Araçlar",
  cooldown: 5,
};
