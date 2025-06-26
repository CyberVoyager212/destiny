const fs = require("fs");
const path = require("path");
const { MessageEmbed } = require("discord.js");
const axios = require("axios");
const config = require("../botConfig.js");
const userCooldowns = new Map();
const messageHistory = new Map();
const automodConfig = {
  badWords: {
    enabled: false,
    list: [
      "şerefsiz",
      "piç",
      "orospu",
      "kaltak",
      "göt",
      "amcık",
      "yavşak",
      "manyak",
      "yavşak",
      "siktir",
      "gavat",
    ],
    action: "delete", // delete | warn | timeout
    customMessage: "❌ Uygunsuz dil kullanımı tespit edildi!",
  },
  spam: {
    enabled: false,
    threshold: 5, // 5 saniyede 5 mesaj
    action: "timeout",
    duration: 60, // 60 saniye
  },
  links: {
    enabled: false,
    allowed: ["discord.gg", "example.com"],
    action: "delete",
  },
  caps: {
    enabled: false,
    ratio: 0.7, // %70'den fazla büyük harf
    minLength: 10,
  },
  mentions: {
    maxUsers: 3,
    maxRoles: 2,
    action: "delete",
    enabled: false,
  },
};

// Geçici sunucu bazlı prefixler
const serverPrefixes = new Map();

// Levenshtein Mesafesi Hesaplama Fonksiyonu
function levenshteinDistance(a, b) {
  const matrix = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

// events klasöründeki mesajlar.json dosyasının tam yolunu belirtiyoruz.
const filtersPath = path.join(__dirname, "mesajlar.json");

let filters = [];

// Filtreleri dosyadan yükleyen fonksiyon
const loadFilters = () => {
  try {
    const data = fs.readFileSync(filtersPath, "utf8");
    filters = JSON.parse(data);
  } catch (error) {
    console.error("mesajlar.json okunurken hata oluştu:", error);
    filters = [];
  }
};

// Başlangıçta filtreleri yükle
loadFilters();

// Dosya değişikliklerini izleyelim
fs.watchFile(filtersPath, (curr, prev) => {
  console.log("mesajlar.json değişti, filtreler yeniden yükleniyor...");
  loadFilters();
});

module.exports = async (client, message) => {
  if (!message.guild || message.author.bot) return;

  // Filtre kontrolü: Eğer mesajın olduğu kanalda filtre varsa kontrol et.
  const filter = filters.find((f) => f.channelId === message.channel.id);
  if (filter) {
    // allowedMessage hem tek değer hem de dizi olabilir; her zaman dizi olarak ele alıyoruz.
    const rules = Array.isArray(filter.allowedMessage)
      ? filter.allowedMessage
      : [filter.allowedMessage];
    let isAllowed = false;

    // Her bir kuralı kontrol ediyoruz.
    for (const rule of rules) {
      if (rule === "#sayı#") {
        // Mesaj sadece rakamlardan oluşuyorsa
        if (/^\d+$/.test(message.content)) {
          isAllowed = true;
          break;
        }
      } else if (rule === "#kelime#") {
        // Mesaj sadece harflerden oluşuyorsa
        if (/^[a-zA-ZğüşöçıİĞÜŞÖÇ]+$/.test(message.content)) {
          isAllowed = true;
          break;
        }
      } else {
        // Örneğin "k!verify" gibi tam eşleşme bekleniyorsa
        if (message.content === rule) {
          isAllowed = true;
          break;
        }
      }
    }

    // Eğer mesaj hiçbir kurala uymuyorsa, mesaj silinir.
    if (!isAllowed) {
      message.delete().catch(() => {});
      return;
    }
  }

  if (message.guild) {
    let guildKey = `messageLogs_${message.guild.id}`;
    let messageLogs = (await client.db.get(guildKey)) || [];

    messageLogs.push({
      timestamp: Date.now(),
      author: message.author ? message.author.tag : "Webhook",
      webhook: message.webhookId ? true : false, // Webhook mesajı mı?
    });

    if (messageLogs.length > 1000) messageLogs.shift();

    client.db.set(guildKey, messageLogs);
  }

  await runAutomodChecks(client, message);

  const prefix = serverPrefixes.get(message.guild.id) || config.prefix || "!";

  // Prefix değiştirme komutu
  if (message.content.startsWith(`${prefix}prefix`)) {
    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const newPrefix = args[1];

    if (!newPrefix) {
      return message.reply("Lütfen geçerli bir prefix belirtin.");
    }

    serverPrefixes.set(message.guild.id, newPrefix);
    return message.reply(`Prefix başarıyla değiştirildi: \`${newPrefix}\``);
  }
  const botConfig = require("../botConfig.js"); // botConfig.js dosyasını içe aktarıyoruz

  // AFK komutu
  if (message.content.startsWith(`${prefix}afk`)) {
    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const reason = args.slice(1).join(" ") || "Sebep belirtilmedi";
    const timestamp = new Date().toISOString(); // AFK olduğunuz zamanı alıyoruz

    // AFK'yi veritabanında sakla (sunucu bazında kaydet)
    await client.db.set(`afk_${message.guild.id}_${message.author.id}`, {
      reason,
      timestamp,
    });

    // Kullanıcıyı AFK olarak işaretle
    message.reply(`Başarıyla AFK oldunuz! Sebep: ${reason}`);
    return;
  }

  // AFK sebebini ve zamanını kontrol et
  const afkData = await client.db.get(
    `afk_${message.guild.id}_${message.author.id}`
  );
  if (afkData) {
    // Kullanıcı AFK, mesaja cevap ver
    const afkTime = new Date(afkData.timestamp);
    const timeSpent = Math.floor((Date.now() - afkTime) / 1000); // AFK olduğu süreyi saniye cinsinden hesapla
    message.reply(
      `AFK'dan çıktınız. Sebep: ${afkData.reason}. AFK kaldığınız süre: ${timeSpent} saniye.`
    );

    // Veritabanından AFK bilgisini sil
    await client.db.delete(`afk_${message.guild.id}_${message.author.id}`);
    return;
  }

  // Kullanıcıyı etiketleme durumunda AFK bilgisi verme
  const mentionedUsers = message.mentions.users;
  mentionedUsers.forEach(async (user) => {
    const afkReason = await client.db.get(`afk_${message.guild.id}_${user.id}`);
    if (afkReason) {
      message.reply(
        `${user.tag} AFK'dır. Sebep: ${
          afkReason.reason || "Sebep belirtilmemiş."
        }`
      );
    }
  });

  // **Admin kontrolü ekliyoruz**
  // Eğer mesajı gönderen kullanıcı adminse, AFK'daki tüm kişileri listele
  if (
    message.content.startsWith(`${prefix}listafk`) &&
    botConfig.admins.includes(message.author.id)
  ) {
    let afkList = "";

    // Sunucudaki tüm kullanıcılar için AFK verilerini kontrol et
    const members = message.guild.members.cache;
    for (const [userId, member] of members) {
      const afkData = await client.db.get(`afk_${message.guild.id}_${userId}`);
      if (afkData) {
        afkList += `<@${userId}> - Sebep: ${
          afkData.reason || "Sebep belirtilmemiş"
        }\n`;
      }
    }

    // Eğer AFK olan kullanıcı varsa listeyi göster
    if (afkList) {
      message.reply(`AFK olan tüm kullanıcılar:\n${afkList}`);
    } else {
      message.reply("Şu anda AFK olan hiç kimse yok.");
    }
  }

  const {
    MessageActionRow,
    MessageButton,
    MessageEmbed,
  } = require("discord.js");

  // Komut kontrolü
  if (message.content.startsWith(prefix)) {
    const userId = message.author.id;
    const now = Date.now();
    const cooldownKey = `cooldown_${userId}`;
    const usageHistory = (await client.db.get(cooldownKey)) || [];

    const recentUsages = usageHistory.filter(
      (timestamp) => now - timestamp < 10 * 1000
    );
    recentUsages.push(now);

    if (recentUsages.length > 5) {
      // Kullanıcıya 15 saniyelik engel koy
      await client.db.set(`blocked_${userId}`, now + 15 * 1000);
      return message.channel.send(
        "❌ Çok fazla komut kullandınız! 15 saniye bekleyin."
      );
    }

    await client.db.set(cooldownKey, recentUsages);

    // Kullanıcı engelli mi kontrol et
    const blockTime = await client.db.get(`blocked_${userId}`);
    if (blockTime && blockTime > now) {
      const remainingTime = Math.ceil((blockTime - now) / 1000);
      return message.channel.send(
        `❌ Çok fazla komut kullandınız! **${remainingTime} saniye** bekleyin.`
      );
    }
    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    const command =
      client.commands.get(commandName) ||
      client.commands.get(client.aliases.get(commandName));

    // Kullanıcının borç durumunu kontrol et
    const guildId = message.guild.id;
    const loanData = await client.db.get(`loan_${userId}`);

    if (loanData && loanData.amount > 0) {
      const loanDate = loanData.timestamp;
      const daysSinceLoan = Math.floor(
        (now - loanDate) / (1000 * 60 * 60 * 24)
      );
      const penaltyDuration = (await client.db.get(`penalty_${userId}`)) || 0;

      if (daysSinceLoan >= 5 && penaltyDuration === 0) {
        // Kullanıcıya 2 gün boyunca komut kullanım yasağı koy
        await client.db.set(`penalty_${userId}`, now + 2 * 24 * 60 * 60 * 1000);
        return message.channel.send(
          "❌ Borcunuzu 5 gündür ödemediğiniz için 2 gün boyunca komut kullanamazsınız."
        );
      }

      if (penaltyDuration > now) {
        const remainingTime = Math.ceil(
          (penaltyDuration - now) / (1000 * 60 * 60 * 24)
        );
        return message.channel.send(
          `❌ Borcunuzu ödemediğiniz için **${remainingTime} gün** boyunca komut kullanamazsınız.`
        );
      } else if (penaltyDuration !== 0) {
        await client.db.delete(`penalty_${userId}`);
      }
    }

    // Eğer komut bulunamazsa, öneri gönder
    if (!command) {
      const allCommands = [
        ...Array.from(client.commands.keys()),
        ...Array.from(client.aliases.keys()),
      ];

      const distances = allCommands.map((cmd) => ({
        command: cmd,
        distance: levenshteinDistance(commandName, cmd),
      }));

      distances.sort((a, b) => a.distance - b.distance);

      const suggestions = distances
        .filter((d) => d.distance <= 3)
        .map((d) => d.command);

      console.log(
        `Birisi komutu yanlış kullandı. ID: ${message.author.id}, Komut: ${commandName}`
      );

      if (suggestions.length > 0) {
        const embed = new MessageEmbed()
          .setColor("YELLOW")
          .setTitle("Komut Bulunamadı")
          .setDescription(
            `Aradığınız komutu bulamadık, ancak şunlardan biri olabilir:\n
                        ${suggestions.map((cmd) => `\`k!${cmd}\``).join(", ")}`
          );
        return message.channel.send({ embeds: [embed] });
      } else {
        return message.channel.send(
          "Üzgünüm, bu komutu bulamadık ve önerilecek bir şey yok."
        );
      }
    }

    // Kullanıcı verisini kontrol et
    const userData = await client.db.get(`userData_${guildId}_${userId}`);

    // Eğer kullanıcı veriye sahip değilse, veri almak için onay iste
    if (!userData) {
      // Butonları oluştur
      const row = new MessageActionRow().addComponents(
        new MessageButton()
          .setCustomId("yes")
          .setLabel("Evet")
          .setStyle("SUCCESS"),
        new MessageButton()
          .setCustomId("no")
          .setLabel("Hayır")
          .setStyle("DANGER")
      );

      // Kullanıcıya mesaj gönder
      const verificationMessage = await message.reply({
        content:
          "Bot, kullanıcılarla veriler paylaşarak çalışmaktadır. Bu veriyi almayı kabul ediyor musunuz?",
        components: [row],
      });

      // Butonları dinle
      const filter = (interaction) => interaction.user.id === message.author.id;
      const collector = verificationMessage.createMessageComponentCollector({
        filter,
        time: 15000,
      });

      collector.on("collect", async (interaction) => {
        if (interaction.customId === "yes") {
          // Veri ekleme işlemi
          await client.db.set(`userData_${guildId}_${userId}`, {
            user: "Yeni Kullanıcı",
            canDeleteData: false,
          });

          // Komut çalıştırılabilir
          await interaction.reply("Veriyi aldınız ve komut çalıştırılabilir!");

          try {
            await command.execute(client, message, args);
          } catch (error) {
            console.error(error);
            await message.reply("Bu komutu çalıştırırken bir hata oluştu!");
          }
        } else if (interaction.customId === "no") {
          // Veriyi kabul etmediyse komut çalışmaz
          await interaction.reply(
            "Veri kabul edilmediği için komut çalıştırılamaz."
          );
        }
      });

      collector.on("end", (collected, reason) => {
        if (reason === "time") {
          verificationMessage.edit({
            content: "Veri kabulü için süre sona erdi!",
            components: [],
          });
        }
      });
      return;
    }

    // Kullanıcı verisi mevcutsa, komutu çalıştır
    try {
      await command.execute(client, message, args);

      // Komut kullanım verilerini kaydet
      const usageKey = `commandUsage_${guildId}_${userId}`;
      let usageData = (await client.db.get(usageKey)) || {};

      // Her komutun kullanım sayısını artır
      usageData[commandName] = (usageData[commandName] || 0) + 1;
      await client.db.set(usageKey, usageData);
    } catch (error) {
      console.error(error);
      await message.reply("Bu komutu çalıştırırken bir hata oluştu!");
    }
    // --- Komut yürütme kısmının sonuna ekleyin ---
    const commandCategory = command.help.category || "uncategorized";

    // 1. Kullanıcı geçmişini güncelle (user_usage)
    let userUsage = (await client.db.get(`user_usage_${userId}`)) || [];
    if (!userUsage.includes(commandName)) {
      userUsage.push(commandName);
      await client.db.set(`user_usage_${userId}`, userUsage);
    }

    // 2. Komutun kategori bilgisini sakla (sadece ilk seferde kaydedilebilir)
    if (!(await client.db.get(`command_category_${commandName}`))) {
      await client.db.set(`command_category_${commandName}`, commandCategory);
    }

    // 3. Birlikte kullanım (co-usage) verisini güncelle
    // Kullanıcı geçmişinde bulunan diğer komutlarla, bu komutun birlikte kullanım sayısını artırıyoruz.
    for (let otherCmd of userUsage) {
      if (otherCmd === commandName) continue;
      // her otherCmd için co-usage bilgisini güncelle
      let coUsage = (await client.db.get(`cousage_${otherCmd}`)) || {};
      coUsage[commandName] = (coUsage[commandName] || 0) + 1;
      await client.db.set(`cousage_${otherCmd}`, coUsage);
    }
  }

  // "destiny" kelimesi geçiyorsa veya bot etiketlendiyse devam et
  if (
    message.content.toLowerCase().includes("destiny") ||
    message.mentions.has(client.user)
  ) {
    // @everyone veya @here içeren mesajları atla
    if (
      message.content.includes("@everyone") ||
      message.content.includes("@here")
    )
      return;

    const promptMessage = message.content.trim();

    if (promptMessage.toLowerCase() === "destiny") {
      await message.reply(
        "Buyrun beni çağırmışsınız. Benimle konuşmak için bu mesaja yanıt verin veya 'destiny (metin)' olarak yazın."
      );
      return;
    }

    let fullPrompt = promptMessage;
    // Eğer mesaj bir reply ise, önceki mesajı da ekle
    if (message.reference) {
      try {
        const referencedMessage = await message.channel.messages.fetch(
          message.reference.messageId
        );
        if (referencedMessage) {
          // Eğer önceki mesaj botun mesajıysa veya kullanıcı mesajıysa aynı şekilde ekle
          fullPrompt = `${referencedMessage.content}\n${promptMessage}`;
        }
      } catch (error) {
        console.error("Referenced message fetch failed:", error);
      }
    } else if (!promptMessage) {
      await message.reply(
        "Buyrun beni çağırmışsınız. Benimle konuşmak için bu mesaja yanıt verin veya 'destiny (metin)' olarak yazın."
      );
      return;
    }

    // "Yazıyor..." durumuna geç
    message.channel.sendTyping();

    // Kanal geçmişini güncelle (her kanal için 5 mesaj saklanıyor)
    if (!messageHistory.has(message.channel.id)) {
      messageHistory.set(message.channel.id, []);
    }
    const channelHistory = messageHistory.get(message.channel.id);
    channelHistory.push({ userMessage: fullPrompt, botResponse: "" });

    // Eğer geçmiş çok uzun olduysa, en eski mesajları sil
    if (channelHistory.length > 5) channelHistory.shift();

    // Tüm geçmişi birleştirerek yapay zekaya gönderilecek metni oluşturuyoruz
    const conversationContext = formatMessageHistory(channelHistory);

    try {
      const geminiResponse = await getGeminiResponse(conversationContext);

      if (geminiResponse.length > 2000) {
        await message.reply(
          "Yanıt çok uzun, bunu buradan gönderemiyorum. Daha fazlasını görmek için k!yazıgpt komutunu kullanabilirsiniz."
        );
        return;
      }

      // Yanıtı gönder
      await message.reply(geminiResponse);

      // Botun yanıtını geçmişe ekle
      channelHistory[channelHistory.length - 1].botResponse = geminiResponse;
    } catch (error) {
      console.error("AI yanıtı alınırken hata oluştu:", error);
      await message.reply("Üzgünüm, şu anda yanıt veremiyorum.");
    }
  }

  const mentions = message.mentions;
  const memberMentions = mentions.members;
  const roleMentions = mentions.roles;
  const userId = message.author.id;
  const guildId = message.guild.id;

  let etiketSayisi =
    (await client.db.get(`etiketSayisi_${guildId}_${userId}`)) || 0;
  let cezaSayisi =
    (await client.db.get(`cezaSayisi_${guildId}_${userId}`)) || 0;

  let yasakliEtiketVar = false;

  // Kullanıcı etiketlerini kontrol et
  for (const [targetId, member] of memberMentions) {
    const yasakli = await client.db.get(`etiketYasak_${guildId}_${targetId}`);
    if (yasakli) {
      yasakliEtiketVar = true;
      break;
    }
  }

  // Rol etiketlerini kontrol et
  for (const [roleId, role] of roleMentions) {
    const yasakli = await client.db.get(`etiketYasak_${guildId}_${roleId}`);
    if (yasakli) {
      yasakliEtiketVar = true;
      break;
    }
  }

  // Eğer yasaklı birini/rolü etiketlediyse
  if (yasakliEtiketVar) {
    await message.delete(); // Mesajı sil

    etiketSayisi++;
    await client.db.set(`etiketSayisi_${guildId}_${userId}`, etiketSayisi);

    if (etiketSayisi >= 3) {
      cezaSayisi++;
      let timeoutDuration = 15 * cezaSayisi * 60 * 1000; // 15 dakika × ceza sayısı

      const member = message.guild.members.cache.get(userId);
      if (member) {
        // Kullanıcının rollerini kaydet
        let userRoles = member.roles.cache.map((role) => role.id);
        await client.db.set(`eskiRoller_${guildId}_${userId}`, userRoles);

        // Yasaklı rolünü bul veya oluştur
        let muteRole = message.guild.roles.cache.find(
          (r) => r.name === "Yasaklı"
        );
        if (!muteRole) {
          try {
            muteRole = await message.guild.roles.create({
              name: "Yasaklı",
              color: "BLACK",
              permissions: [],
            });

            // Tüm kanallarda mesaj gönderme ve sesli bağlanma iznini kapat
            message.guild.channels.cache.forEach(async (channel) => {
              await channel.permissionOverwrites.create(muteRole, {
                SEND_MESSAGES: false,
                CONNECT: false,
              });
            });
          } catch (err) {
            return message.reply(
              '❌ "Yasaklı" rolü oluşturulurken bir hata oluştu!'
            );
          }
        }

        // Kullanıcının rollerini sıfırla ve sadece Yasaklı rolünü ver
        await member.roles.set([muteRole]);
        await message.channel.send(
          `🚫 | **${message.author.tag}**, yasaklı etiketleme nedeniyle **${
            timeoutDuration / (60 * 1000)
          } dakika** boyunca yasaklandı.`
        );

        // Süre dolunca eski rollerini geri ver
        setTimeout(async () => {
          let savedRoles = await client.db.get(
            `eskiRoller_${guildId}_${userId}`
          );
          if (savedRoles) {
            await member.roles.set(savedRoles);
            await client.db.delete(`eskiRoller_${guildId}_${userId}`);
            message.channel.send(
              `✅ **${message.author.tag}** kullanıcısının ceza süresi doldu ve eski rolleri geri verildi.`
            );
          }
        }, timeoutDuration);
      }

      // Ceza sayısını artır ve etiket sayısını sıfırla
      await client.db.set(`cezaSayisi_${guildId}_${userId}`, cezaSayisi);
      await client.db.delete(`etiketSayisi_${guildId}_${userId}`);
    } else {
      await message.channel.send(
        `⚠️ | **${message.author.tag}**, yasaklı bir kullanıcıyı/rolü etiketleyemezsiniz! (Etiket: ${etiketSayisi}/3)`
      );
    }
  }
};

// Kelimeleri temizlemek için kullanılan fonksiyon
function cleanText(text) {
  const forbiddenWords = ["destiny", "@Destiny~v13", "Destiny"];
  let cleanedText = text;

  forbiddenWords.forEach((word) => {
    const regex = new RegExp(word, "gi");
    cleanedText = cleanedText.replace(regex, "");
  });

  return cleanedText;
}

// Mesaj geçmişini uygun formata dönüştürme (sistem mesajı dahil)
// Sistem mesajı, yapay zekanın "destiny" ifadelerinden etkilenmemesi için bilgilendirme yapar.
function formatMessageHistory(history) {
  const systemMessage = {
    role: "system",
    content:
      "senin adın destiny fakat bunları mesajında belirtmek zorunda kalmadıkça belirtme çok samimi ol küfür edebilirsin ve bir discord botusun.",
  };

  return [
    systemMessage,
    ...history
      .map((entry) => {
        // Hem kullanıcı hem de asistan mesajlarını temizleyerek ekliyoruz
        return [
          {
            role: "user",
            content: cleanText(entry.userMessage),
          },
          {
            role: "assistant",
            content: cleanText(entry.botResponse || "(Henüz cevap verilmedi)"),
          },
        ];
      })
      .flat(),
  ];
}

// AI21 API'sine istek gönderme
async function getGeminiResponse(messages) {
  try {
    const response = await axios.post(
      "https://api.ai21.com/studio/v1/chat/completions",
      {
        model: "jamba-1.5-large",
        messages: messages,
        max_tokens: 4000,
        temperature: 0.8,
        top_p: 1,
        n: 1,
      },
      {
        headers: {
          Authorization: `Bearer ${config.AI21_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    // AI21 yanıtını kontrol et
    if (
      response.data &&
      response.data.choices &&
      response.data.choices.length > 0
    ) {
      return response.data.choices[0].message.content;
    } else {
      return "Destiny yanıt vermedi. Lütfen tekrar deneyin.";
    }
  } catch (error) {
    console.error(
      "AI21 yanıtı alınamadı:",
      error.response ? error.response.data : error.message
    );
    return "Destiny yanıt vermedi. Lütfen tekrar deneyin.";
  }
}

async function runAutomodChecks(client, message) {
  // Kötü dil filtresi
  if (automodConfig.badWords.enabled && checkBadWords(message.content)) {
    handleInfraction(client, message, "badWords");
    return;
  }

  // Spam kontrolü
  if (automodConfig.spam.enabled && (await checkSpam(message))) {
    handleInfraction(client, message, "spam");
    return;
  }

  // Link kontrolü
  if (automodConfig.links.enabled && checkLinks(message.content)) {
    handleInfraction(client, message, "links");
    return;
  }

  // Büyük harf kontrolü
  if (automodConfig.caps.enabled && checkCaps(message.content)) {
    handleInfraction(client, message, "caps");
    return;
  }

  // Etiket spam kontrolü
  if (automodConfig.mentions.enabled && checkMentions(message)) {
    handleInfraction(client, message, "mentions");
    return;
  }
}

function checkBadWords(content) {
  const words = content.toLowerCase().split(/ +/);
  return automodConfig.badWords.list.some((pattern) => {
    if (pattern.startsWith("regex:")) {
      const regex = new RegExp(pattern.slice(6), "gi");
      return regex.test(content);
    }
    return words.includes(pattern.toLowerCase());
  });
}

async function checkSpam(message) {
  const key = `${message.guild.id}-${message.author.id}`;
  const now = Date.now();
  const cooldown = userCooldowns.get(key) || [];

  // Eski kayıtları temizle
  const recent = cooldown.filter(
    (t) => now - t < automodConfig.spam.threshold * 1000
  );
  recent.push(now);

  userCooldowns.set(key, recent);
  return recent.length > automodConfig.spam.threshold;
}

function checkLinks(content) {
  const urlRegex = /https?:\/\/[^\s/$.?#].[^\s]*/gi;
  const foundLinks = content.match(urlRegex) || [];
  return foundLinks.some(
    (link) =>
      !automodConfig.links.allowed.some((allowed) => link.includes(allowed))
  );
}

function checkCaps(content) {
  if (content.length < automodConfig.caps.minLength) return false;
  const capsCount = (content.match(/[A-ZĞİŞÇÖÜ]/g) || []).length;
  return capsCount / content.length > automodConfig.caps.ratio;
}

function checkMentions(message) {
  const mentions = message.mentions;
  return (
    mentions.users.size > automodConfig.mentions.maxUsers ||
    mentions.roles.size > automodConfig.mentions.maxRoles
  );
}

async function handleInfraction(client, message, type) {
  const config = automodConfig[type];
  try {
    await message.delete();

    const actionMessage =
      config.customMessage ||
      `❌ ${type} kural ihlali nedeniyle mesajınız silindi!`;

    const warning = await message.channel.send({
      content: `${message.author} ${actionMessage}`,
      ephemeral: true,
    });

    // Loglama
    logInfraction(client, message, type);

    // Ek işlemler
    switch (config.action) {
      case "timeout":
        await message.member.timeout(
          automodConfig.spam.duration * 1000,
          `${type} ihlali`
        );
        break;
      case "warn":
        await addWarning(client, message.member);
        break;
    }

    setTimeout(() => warning.delete(), 5000);
  } catch (error) {
    console.error("Automod hatası:", error);
  }
}

async function logInfraction(client, message, type) {
  const logData = {
    user: message.author.tag,
    userId: message.author.id,
    type: type,
    content: message.content,
    timestamp: new Date().toISOString(),
  };

  await client.db.push("automod_logs", logData);
}

async function addWarning(client, member) {
  const currentWarnings =
    (await client.db.get(`warnings_${member.guild.id}_${member.id}`)) || [];
  currentWarnings.push(new Date().toISOString());
  await client.db.set(
    `warnings_${member.guild.id}_${member.id}`,
    currentWarnings
  );

  if (currentWarnings.length >= 3) {
    await member.timeout(3600000, "3 uyarı"); // 1 saat timeout
    await client.db.delete(`warnings_${member.guild.id}_${member.id}`);
  }
}
