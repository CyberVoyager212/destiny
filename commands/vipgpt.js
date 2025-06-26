const { Permissions } = require("discord.js");
const fetch = require("node-fetch");
const config = require("../botConfig.js");

// Kanal bazında konuşma geçmişleri, istek sayıları, zaman bilgileri ve ayarları
// channelId: { messages, requestCount, startTime, lastRequestTime, systemMessage, selectedModel }
const conversationHistories = {};

// Saatlik istek limiti ve her mesaj arası bekleme süresi
const MAX_REQUESTS_PER_HOUR = 10;
const HOURLY_COOLDOWN_DURATION = 3600000; // 1 saat
const PER_MESSAGE_COOLDOWN = 150000; 

// VIP API key rotasyonu: config dosyanızda 6 adet API key dizisi bulunmalıdır.
const apiKeys = config.VIP_API_KEYS;
let currentApiKeyIndex = 0;
let currentUsageCount = 0;
const MAX_REQUESTS_PER_KEY = 4;

// Varsayılan ayarlar
const DEFAULT_SYSTEM_MESSAGE =
  "senin adın destiny discord botusun kullanıcılarla düzgün türkçe konuş";
const DEFAULT_MODEL = "gpt-4.5-preview";

// Kullanıcının seçebileceği izin verilen modeller
const allowedModels = [
  "gpt-4.5-preview",                          // OpenAI'nin yeni amiral gemisi
  "mistralai/Mixtral-8x22B-Instruct-v0.1", // Mistral Mixtral 8x22B
  "Qwen/Qwen2.5-72B-Instruct-Turbo",      // Alibaba Qwen 2.5 - 72B
  "cohere/command-r-plus",          // Cohere Command-R+, kod için çok iyi
  "x-ai/grok-3-beta",               // xAI Grok 3 Beta (Elon Musk LLM)
  "o3-mini"
];


module.exports = {
  name: "vipgpt",
  description: "VIP kullanıcıları için GPT ile yazılı modda iletişim kurar.",
  usage: "vipgpt [restart|create|close|test]",
  async execute(client, message, args) {
    // VIP kullanıcı kontrolü
    if (!config.vipUsers.includes(message.author.id)) {
      return message.reply("Bu komutu sadece VIP kullanıcılar kullanabilir.");
    }

    // Ek olarak; test komutu sadece belirli ID'li kullanıcıya açık
    if (args[0] === "test") {
      if (message.author.id !== "707269247532793858") {
        return message.reply("Bu komutu kullanmaya yetkiniz yok.");
      }
      
      // testResults dizisi; model adı ve eğer cevaplarında "destiny" geçmiyorsa mesajı saklar.
      const testResults = [];
      let lastTestResponse = null;

      // Tüm modeller için döngü
      for (let model of allowedModels) {
        // Yeni test konuşma geçmişi oluşturuluyor. (Her model için sistem mesajı olarak varsayılanı veya isteğe bağlı farklı mesaj kullanılabilir.)
        const testHistory = {
          messages: [{ role: "system", content: DEFAULT_SYSTEM_MESSAGE }],
          requestCount: 0,
          startTime: Date.now(),
          lastRequestTime: 0,
          systemMessage: DEFAULT_SYSTEM_MESSAGE,
          selectedModel: model,
        };
        // Kullanıcıdan "Adın ne?" mesajını ekliyoruz.
        testHistory.messages.push({ role: "user", content: "Adın ne?" });
        
        try {
          const aiResponse = await getAI21Response(testHistory);
          // Son mesaj kaydı için
          lastTestResponse = { model, response: aiResponse };

          // "destiny" kelimesini (küçük/büyük harf duyarsız kontrol) içermiyorsa, sonuç dizisine ekle
          if (!aiResponse.toLowerCase().includes("destiny")) {
            testResults.push({ model, response: aiResponse });
          }
        } catch (error) {
          console.error("Test sırasında hata:", error);
          testResults.push({ model, response: "Hata: Yanıt alınamadı." });
        }
      }

      // Test sonuç raporu oluşturuluyor:
      let reportMessage = "**Test Komutu Sonuç Raporu**\n\n";
      reportMessage += "Test edilen modeller:\n";
      allowedModels.forEach(model => {
        reportMessage += `- ${model}\n`;
      });
      reportMessage += "\n**Cevaplarında 'destiny' içermeyen modeller:**\n";
      if (testResults.length > 0) {
        testResults.forEach(result => {
          reportMessage += `**Model:** ${result.model}\n**Yanıt:** ${result.response}\n\n`;
        });
      } else {
        reportMessage += "Tüm modellerin yanıtlarında 'destiny' bulunuyor.\n";
      }
      
      // Son test mesajını da ekliyoruz
      if (lastTestResponse) {
        reportMessage += "\n**Son Test Mesajı**\n";
        reportMessage += `Model: ${lastTestResponse.model}\nYanıt: ${lastTestResponse.response}\n`;
      }
      
      return message.channel.send(reportMessage);
    }

    // restart, create, close komutları
    const member = message.member;
    const guild = message.guild;
    const channelName = `vipgpt-${member.user.username}`;
    const existingChannel = guild.channels.cache.find(
      (ch) => ch.name === channelName
    );

    if (args[0] === "restart" || args[0] === "create" || args[0] === "close") {
      if (args[0] === "restart") {
        if (existingChannel) {
          listenToTextChannel(client, existingChannel, member);
          if (!conversationHistories[existingChannel.id]) {
            conversationHistories[existingChannel.id] = {
              messages: [{ role: "system", content: DEFAULT_SYSTEM_MESSAGE }],
              requestCount: 0,
              startTime: Date.now(),
              lastRequestTime: 0,
              systemMessage: DEFAULT_SYSTEM_MESSAGE,
              selectedModel: DEFAULT_MODEL,
            };
          }
          return message.reply(`Kanal dinlemeye başlandı: ${existingChannel}`);
        } else {
          return message.reply("Öncelikle bir kanal oluşturmalısın.");
        }
      }

      if (args[0] === "create") {
        if (existingChannel) {
          return message.reply(
            `Zaten bir özel kanalın var: ${existingChannel}.`
          );
        }

        try {
          const channel = await guild.channels.create(channelName, {
            type: "GUILD_TEXT",
            permissionOverwrites: [
              {
                id: guild.id,
                deny: [Permissions.FLAGS.VIEW_CHANNEL],
              },
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

          await message.reply(`Özel kanal oluşturuldu: ${channel}`);
          await channel.send(
            "GPT ile yazılı iletişime geçmek için mesaj yazmaya başlayabilirsiniz.\nVarsayılan sistem mesajı: " +
              DEFAULT_SYSTEM_MESSAGE +
              "\nModel: " +
              DEFAULT_MODEL +
              "\n\nNot: Sistem mesajını değiştirmek için 'sistem-mesajı: ...' ve modeli değiştirmek için 'model: ...' şeklinde yazınız. İzin verilen modeller: " +
              allowedModels.join(", ")
          );

          conversationHistories[channel.id] = {
            messages: [{ role: "system", content: DEFAULT_SYSTEM_MESSAGE }],
            requestCount: 0,
            startTime: Date.now(),
            lastRequestTime: 0,
            systemMessage: DEFAULT_SYSTEM_MESSAGE,
            selectedModel: DEFAULT_MODEL,
          };

          listenToTextChannel(client, channel, member);
        } catch (error) {
          console.error(error);
          return message.reply(
            "Kanal oluşturulurken bir hata oluştu. Lütfen tekrar deneyin."
          );
        }
      }

      if (args[0] === "close") {
        if (existingChannel) {
          await existingChannel.delete();
          delete conversationHistories[existingChannel.id];
          return message.reply(`Kanal kapatıldı: ${existingChannel}`);
        } else {
          return message.reply("Kapatılacak bir kanalınız yok.");
        }
      }
    }

    if (
      message.content.startsWith("k!vipyazıgpt") ||
      message.content.startsWith("k!vipgpt")
    ) {
      return message.reply(
        "Lütfen `restart`, `create`, `close` veya `test` olarak belirtiniz."
      );
    }
  },
};

async function listenToTextChannel(client, channel, creator) {
  client.on("messageCreate", async (message) => {
    if (message.channel.id !== channel.id || message.author.bot) return;
    if (message.author.id !== creator.id) return;
    if (message.content.startsWith("k!")) return;

    // Geçmişi al veya varsayılan ayarlarla başlat
    const channelHistory = conversationHistories[channel.id] || {
      messages: [{ role: "system", content: DEFAULT_SYSTEM_MESSAGE }],
      requestCount: 0,
      startTime: Date.now(),
      lastRequestTime: 0,
      systemMessage: DEFAULT_SYSTEM_MESSAGE,
      selectedModel: DEFAULT_MODEL,
    };

    const now = Date.now();

    // Saatlik istek limiti kontrolü
    if (
      now - channelHistory.startTime < HOURLY_COOLDOWN_DURATION &&
      channelHistory.requestCount >= MAX_REQUESTS_PER_HOUR
    ) {
      return message.reply(
        "Üzgünüz, 1 saat içerisinde en fazla 10 istek yapılabiliyor. Lütfen daha sonra tekrar deneyin."
      );
    } else if (now - channelHistory.startTime >= HOURLY_COOLDOWN_DURATION) {
      channelHistory.requestCount = 0;
      channelHistory.startTime = now;
      channelHistory.messages = [
        { role: "system", content: channelHistory.systemMessage },
      ];
    }

    // Her mesaj arasında bekleme kontrolü
    if (now - channelHistory.lastRequestTime < PER_MESSAGE_COOLDOWN) {
      const waitMs =
        PER_MESSAGE_COOLDOWN - (now - channelHistory.lastRequestTime);
      const minutes = Math.floor(waitMs / 60000);
      const seconds = Math.floor((waitMs % 60000) / 1000);
      return message.reply(
        `Bir sonraki sohbetiniz için ${minutes} dakika : ${seconds} saniye beklemeniz gerekiyor.`
      );
    }

    // Sistem mesajını değiştirmek için "sistem-mesajı:" komutu
    if (message.content.toLowerCase().startsWith("sistem-mesajı:")) {
      const newSystemMessage = message.content
        .substring("sistem-mesajı:".length)
        .trim();
      if (newSystemMessage) {
        channelHistory.systemMessage = newSystemMessage;
        channelHistory.messages[0] = {
          role: "system",
          content: newSystemMessage,
        };
        await channel.send("Sistem mesajı güncellendi: " + newSystemMessage);
      } else {
        await channel.send("Lütfen geçerli bir sistem mesajı giriniz.");
      }
      return;
    }

    // Model değiştirmek için "model:" komutu
    if (message.content.toLowerCase().startsWith("model:")) {
      const newModel = message.content.substring("model:".length).trim();
      if (allowedModels.includes(newModel)) {
        channelHistory.selectedModel = newModel;
        await channel.send("Yapay zeka modeli güncellendi: " + newModel);
      } else {
        await channel.send(
          "Lütfen izin verilen modellerden birini seçiniz: " +
            allowedModels.join(", ")
        );
      }
      return;
    }

    // Normal kullanıcı mesajı: mesajı geçmişe ekle ve istek sayısını artır
    channelHistory.messages.push({ role: "user", content: message.content });
    channelHistory.requestCount++;
    channelHistory.lastRequestTime = now;

    try {
      const aiResponse = await getAI21Response(channelHistory);
      channelHistory.messages.push({ role: "assistant", content: aiResponse });
      await sendInChunks(channel, aiResponse, 2000);
    } catch (error) {
      console.error(error);
      return message.reply("GPT yanıtı alınamadı.");
    }

    conversationHistories[channel.id] = channelHistory;
  });
}

async function getAI21Response(conversationHistory) {
  // API key rotasyonu: mevcut key 10 istek yaptıysa sıradaki key'e geç
  if (currentUsageCount >= MAX_REQUESTS_PER_KEY) {
    currentApiKeyIndex = (currentApiKeyIndex + 1) % apiKeys.length;
    currentUsageCount = 0;
  }
  currentUsageCount++;

  try {
    const response = await fetch(
      "https://api.aimlapi.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKeys[currentApiKeyIndex]}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: conversationHistory.selectedModel,
          messages: conversationHistory.messages,
          documents: [],
          tools: [],
          n: 1,
          max_tokens: 4096,
          temperature: 0.3,
          top_p: 1,
          stop: [],
          response_format: { type: "text" },
        }),
      }
    );

    const data = await response.json();
    const responseText = data.choices?.[0]?.message?.content;
    if (!responseText) {
      return "GPT yanıtı alınamadı.";
    }
    return responseText;
  } catch (error) {
    console.error("GPT yanıtı hatası:", error);
    return "GPT yanıtı alınamadı.";
  }
}

async function sendInChunks(channel, text, chunkSize) {
  if (!text || typeof text !== "string") return;
  const words = text.split(" ");
  let currentChunk = "";

  for (const word of words) {
    if ((currentChunk + word).length > chunkSize) {
      await channel.send(currentChunk.trim());
      currentChunk = word + " ";
    } else {
      currentChunk += word + " ";
    }
  }
  if (currentChunk.trim()) {
    await channel.send(currentChunk.trim());
  }
}

module.exports.help = {
  name: "vipyazıgpt",
  aliases: ["vipgpt"],
  usage: "vipyazıgpt [restart|create|close|test]",
  description:
    "VIP kullanıcılar için GPT ile yazılı modda iletişim kurmanızı sağlar. Ek olarak, sadece 707269247532793858 ID'li kullanıcı test komutu ile tüm modelleri deneyebilir.",
};
