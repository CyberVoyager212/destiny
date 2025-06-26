const { Permissions } = require('discord.js');
const axios = require('axios');
const config = require('../botConfig.js');

// Kanal bazında konuşma geçmişi, istek sayısı ve son istek zamanı
const conversationHistories = {}; // channelId: { messages: [], requestCount, startTime, lastRequestTime }
const MAX_REQUESTS_PER_HOUR = 10;
const HOURLY_COOLDOWN_DURATION = 3600000; // 1 saat = 3600000 ms
const PER_MESSAGE_COOLDOWN = 10 * 60 * 1000; // 10 dakika = 600000 ms

// API key rotasyonu için ayarlar
const apiKeys = config.aimlApiKeys; // config dosyanızda [ "API_KEY1", "API_KEY2", "API_KEY3" ] şeklinde tanımlı olmalı
let currentApiKeyIndex = 0;
let currentUsageCount = 0;
const MAX_REQUESTS_PER_KEY = 10;

module.exports = {
  name: 'yazıgpt',
  description: 'Yazılı modda GPT ile iletişim kurar.',
  usage: 'yazıgpt',
  async execute(client, message, args) {
    const member = message.member;
    const guild = message.guild;
    const channelName = `gpt-${member.user.username}`;
    const existingChannel = guild.channels.cache.find(ch => ch.name === channelName);

    // Komutları kontrol et
    if (args[0] === 'restart' || args[0] === 'create' || args[0] === 'close') {
      if (args[0] === 'restart') {
        if (existingChannel) {
          listenToTextChannel(client, existingChannel, member);
          // Konuşma geçmişini başlat veya sıfırla
          if (!conversationHistories[existingChannel.id]) {
            conversationHistories[existingChannel.id] = {
              messages: [
                { role: "system", content: "Senin adın destiny discord botusun kullanıcılarla bunlara göre konuş ve düzgün türkçe kullan çok bilgilendirici olmadan samimi bir muhabbet yap" }
              ],
              requestCount: 0,
              startTime: Date.now(),
              lastRequestTime: 0
            };
          }
          return message.reply(`Kanal dinlemeye başlandı: ${existingChannel}`);
        } else {
          return message.reply("Öncelikle bir kanal oluşturmalısın.");
        }
      }

      if (args[0] === 'create') {
        if (existingChannel) {
          return message.reply(`Zaten bir özel kanalın var: ${existingChannel}.`);
        }

        try {
          const channel = await guild.channels.create(channelName, {
            type: 'GUILD_TEXT',
            permissionOverwrites: [
              {
                id: guild.id,
                deny: [Permissions.FLAGS.VIEW_CHANNEL],
              },
              {
                id: member.id,
                allow: [Permissions.FLAGS.VIEW_CHANNEL, Permissions.FLAGS.SEND_MESSAGES],
              },
              {
                id: client.user.id,
                allow: [Permissions.FLAGS.VIEW_CHANNEL, Permissions.FLAGS.SEND_MESSAGES],
              },
            ],
          });

          await message.reply(`Özel kanal oluşturuldu: ${channel}`);
          await channel.send('GPT ile yazılı iletişime geçmek için mesaj yazmaya başlayabilirsiniz.');
          // Yeni kanal için konuşma geçmişini başlat (sistem mesajıyla birlikte)
          conversationHistories[channel.id] = {
            messages: [
              { role: "system", content: "Senin adın destiny discord botusun kullanıcılarla bunlara göre konuş ve düzgün türkçe kullan çok bilgilendirici olmadan samimi bir muhabbet yap" }
            ],
            requestCount: 0,
            startTime: Date.now(),
            lastRequestTime: 0
          };
          listenToTextChannel(client, channel, member);
        } catch (error) {
          console.error(error);
          return message.reply("Kanal oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.");
        }
      }

      if (args[0] === 'close') {
        if (existingChannel) {
          await existingChannel.delete();
          delete conversationHistories[existingChannel.id];
          return message.reply(`Kanal kapatıldı: ${existingChannel}`);
        } else {
          return message.reply("Kapatılacak bir kanalınız yok.");
        }
      }
    }

    // 'k!' ile başlayan mesajları dinleme
    if (message.content.startsWith('k!') && !message.content.startsWith('k!yazıgpt')) {
      return message.reply("Lütfen `restart`, `create` veya `close` olarak belirtiniz.");
    }

    // 'k!yazıgpt' komutunu kontrol et
    if (message.content.startsWith('k!yazıgpt')) {
      return message.reply("Lütfen `restart`, `create` veya `close` olarak belirtiniz.");
    }
  },
};

async function listenToTextChannel(client, channel, creator) {
  client.on('messageCreate', async (message) => {
    if (message.channel.id !== channel.id || message.author.bot) return;
    if (message.author.id !== creator.id) return;
    if (message.content.startsWith('k!')) return;

    // Konuşma geçmişini al veya başlat
    const channelHistory = conversationHistories[channel.id] || {
      messages: [
        { role: "system", content: "Senin adın destiny discord botusun kullanıcılarla bunlara göre konuş ve düzgün türkçe kullan çok bilgilendirici olmadan samimi bir muhabbet yap" }
      ],
      requestCount: 0,
      startTime: Date.now(),
      lastRequestTime: 0
    };

    const now = Date.now();

    // 1 saatlik istek limiti kontrolü
    if (now - channelHistory.startTime < HOURLY_COOLDOWN_DURATION && channelHistory.requestCount >= MAX_REQUESTS_PER_HOUR) {
      return message.reply("Üzgünüz, 1 saat içerisinde en fazla 10 istek yapılabiliyor. Lütfen daha sonra tekrar deneyin.");
    } else if (now - channelHistory.startTime >= HOURLY_COOLDOWN_DURATION) {
      // 1 saat dolduysa konuşmayı sıfırla
      channelHistory.requestCount = 0;
      channelHistory.startTime = now;
      channelHistory.messages = [
        { role: "system", content: "Senin adın destiny discord botusun kullanıcılarla bunlara göre konuş ve düzgün türkçe kullan çok bilgilendirici olmadan samimi bir muhabbet yap" }
      ];
    }

    // Her mesaj için 10 dakikalık bekleme kontrolü
    if (now - channelHistory.lastRequestTime < PER_MESSAGE_COOLDOWN) {
      const waitMs = PER_MESSAGE_COOLDOWN - (now - channelHistory.lastRequestTime);
      const minutes = Math.floor(waitMs / 60000);
      const seconds = Math.floor((waitMs % 60000) / 1000);
      return message.reply(`Bi sonraki gpt-4.5-preview sohbetiniz için ${minutes} dakika ${seconds} saniye beklemeniz gerekiyor.`);
    }

    // Kullanıcının mesajını geçmişe ekle ve istek sayısını artır
    channelHistory.messages.push({ role: "user", content: message.content });
    channelHistory.requestCount++;
    channelHistory.lastRequestTime = now;

    try {
      const aimlResponse = await getAimlResponse(channelHistory);
      // AI yanıtını da geçmişe ekle
      channelHistory.messages.push({ role: "assistant", content: aimlResponse });
      await sendInChunks(channel, aimlResponse, 2000);
    } catch (error) {
      console.error(error);
      return message.reply("GPT yanıtı alınamadı.");
    }

    // Güncellenmiş geçmişi kaydet
    conversationHistories[channel.id] = channelHistory;
  });
}

async function getAimlResponse(conversationHistory) {
  // API key rotasyonu: Eğer mevcut API key 10 istek yaptıysa diğerine geç
  if (currentUsageCount >= MAX_REQUESTS_PER_KEY) {
    currentApiKeyIndex = (currentApiKeyIndex + 1) % apiKeys.length;
    currentUsageCount = 0;
  }
  currentUsageCount++;

  try {
    const response = await axios.post(
      `https://api.aimlapi.com/v1/chat/completions`,
      {
        model: "gpt-4o",
        messages: conversationHistory.messages,
        temperature: 0.7,
        max_tokens: 256
      },
      {
        headers: {
          "Authorization": `Bearer ${apiKeys[currentApiKeyIndex]}`,
          "Content-Type": "application/json"
        }
      }
    );
    return response.data.choices[0]?.message?.content || "GPT yanıtı alınamadı.";
  } catch (error) {
    console.error('GPT yanıtı hatası:', error);
    return "GPT yanıtı alınamadı.";
  }
}

async function sendInChunks(channel, text, chunkSize) {
  const words = text.split(' ');
  let currentChunk = '';

  for (const word of words) {
    if ((currentChunk + word).length > chunkSize) {
      await channel.send(currentChunk.trim());
      currentChunk = word + ' ';
    } else {
      currentChunk += word + ' ';
    }
  }

  if (currentChunk.trim()) {
    await channel.send(currentChunk.trim());
  }
}

module.exports.help = {
  name: "yazıgpt",
  aliases: [],
  usage: "yazıgpt",
  description: "GPT ile yazılı modda iletişim kurmanızı sağlar."
};
