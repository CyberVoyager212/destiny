// events/messageCreate.js
const { MessageEmbed } = require("discord.js");
const ms = require("ms");
const botConfig = require("../botConfig.js");
const axios = require("axios");

// Levenshtein distance fonksiyonu
function levenshtein(a, b) {
  const dp = Array(b.length + 1)
    .fill(null)
    .map((_, i) => [i]);
  dp[0] = Array(a.length + 1)
    .fill(0)
    .map((_, j) => j);
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      dp[i][j] =
        b[i - 1] === a[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j - 1], dp[i][j - 1], dp[i - 1][j]);
    }
  }
  return dp[b.length][a.length];
}

module.exports = async (client, message) => {
  // — 0) Sağlamlık kontrolleri —
  if (message.author.bot || !message.guild) return;

  // — 1) Temel değişkenler yalnızca bir kez —
  const db = client.db;
  const guildId = message.guild.id;
  const authorId = message.author.id;
  const channelId = message.channel.id;
  const content = message.content.trim();

  // — 2) ETİKET YASAK + UYARI SİSTEMİ —
  for (const user of message.mentions.users.values()) {
    const dbKey = `etiketYasak_${guildId}_${user.id}`;
    if (await db.get(dbKey)) {
      await message.delete().catch(() => {});

      const warnKey = `warn_${guildId}_${authorId}`;
      const bwKey = `bw_${guildId}_${authorId}`;

      let warnCount = (await db.get(warnKey)) || 0;
      let bwCount = (await db.get(bwKey)) || 0;

      // 5 büyük uyarı → ban + reset
      if (bwCount >= 5) {
        await message.guild.members
          .ban(authorId, { reason: "5 büyük uyarı." })
          .catch(() => {});
        await db.delete(bwKey);
        return message.channel.send(
          "🚫 5 büyük uyarı dolduğu için sunucudan atıldın!"
        );
      }

      // 1+ büyük → direkt büyük uyarı
      if (bwCount >= 1) {
        await db.add(bwKey, 1);
        return message.channel.send(`🚫 Büyük uyarı aldın! (${bwCount + 1}/5)`);
      }

      // küçük uyarı
      warnCount++;
      await db.set(warnKey, warnCount);

      if (warnCount >= 3) {
        // timeout + reset küçük + büyük++
        const member = message.guild.members.cache.get(authorId);
        if (member?.manageable) {
          await member
            .timeout(ms("10m"), "3 küçük uyarı doldu")
            .catch(() => {});
        }
        await db.delete(warnKey);
        await db.add(bwKey, 1);
        return message.channel.send(
          `🚫 3 küçük uyarı → 10dk timeout, 1 büyük uyarı verildi! (1/5)`
        );
      } else {
        return message.channel.send(
          `🚫 Yasaklı etiket! Küçük uyarı: ${warnCount}/3`
        );
      }
    }
  }

  for (const role of message.mentions.roles.values()) {
    const dbKey = `etiketYasak_${guildId}_${role.id}`;
    if (await db.get(dbKey)) {
      await message.delete().catch(() => {});
      // (aynı warn logic’i burada tekrar et)
      // …
      return message.channel.send("🚫 Bu rolü etiketleyemezsin!");
    }
  }

  // — 3) KELİME/SAYI ENGEL SİSTEMİ —
  const engelKey = `mesajEngel_${guildId}`;
  const allFilters = (await db.get(engelKey)) || {};
  const filters = allFilters[channelId];
  if (Array.isArray(filters)) {
    const isNumber = (txt) => /^\d+$/.test(txt);
    const isWord = (txt) => /^[\p{L}]+$/u.test(txt);

    // allow‐only ("!" ile başlayan)
    const allowOnly = filters
      .filter((f) => f.startsWith("!"))
      .map((f) => f.slice(1));
    if (allowOnly.length) {
      const ok = allowOnly.some((f) => {
        if (f === "#sayı#") return isNumber(content);
        if (f === "#kelime#") return isWord(content);
        return content === f;
      });
      if (!ok) {
        await message.delete().catch(() => {});
        return;
      }
    } else {
      // negatif filtreler
      for (const f of filters) {
        if (f === "#sayı#" && isNumber(content)) {
          await message.delete().catch(() => {});
          return;
        }
        if (f === "#kelime#" && isWord(content)) {
          await message.delete().catch(() => {});
          return;
        }
        if (!f.startsWith("!") && content === f) {
          await message.delete().catch(() => {});
          return;
        }
      }
    }
  }

  // 1) Prefix okuma
  let prefix = await db.get(`prefix_${message.guild.id}`);
  if (!prefix) prefix = client.config.prefix;

  // 2) AFK'den çıkışı kontrol et
  const userAfkKey = `afk_${message.author.id}`;
  const afkData = await db.get(userAfkKey);
  if (afkData) {
    await db.delete(userAfkKey);
    const elapsed = Date.now() - afkData.start;
    const timeStr = ms(elapsed, { long: true });
    await message.reply(`Artık AFK değilsin. **${timeStr}** boyunca AFK idin.`);
  }

  // 3) Etiketlenen kullanıcı AFK uyarısı
  if (message.mentions.users.size) {
    for (const [, user] of message.mentions.users) {
      if (user.bot) continue;
      const key = `afk_${user.id}`;
      const data = await db.get(key);
      if (data) {
        const reason = data.reason || "Belirtilmemiş";
        message.channel.send(`<@${user.id}> şu anda AFK: ${reason}`);
      }
    }
  }

  const lower = content.toLowerCase();

  // 4) Destiny tetikleyici
  const isMentioned = message.mentions.users.has(client.user.id);
  if (
    lower.startsWith("destiny") ||
    (isMentioned && lower.includes("destiny"))
  ) {
    // komuttan sonraki kısmı al
    const after = content.split(/\s+/).slice(1).join(" ").trim();

    // a) Sadece "destiny" ise karşılama mesajı
    if (!after) {
      try {
        const welcomeRes = await axios.post(
          "https://api.ai21.com/studio/v1/chat/completions",
          {
            model: "jamba-large-1.7",
            messages: [
              {
                role: "system",
                content:
                  "sadece kullanıcı isteğini yerine getir ekstra bişey yazma",
              },
              {
                role: "user",
                content:
                  "kibarca yönlendirme mesajı ver: `k!yazıgpt` ya da `destiny (mesaj)` formatında konuşabileceğini söyle. sadece mesajı yaz ekstra herhangi bir şey yazma",
              },
            ],
            max_tokens: 400,
            temperature: 0.7,
          },
          {
            headers: {
              Authorization: `Bearer ${botConfig.AI21_API_KEY}`,
              "Content-Type": "application/json",
            },
          }
        );
        const welcomeText = welcomeRes.data.choices[0].message.content.trim();
        return message.reply(welcomeText);
      } catch (err) {
        console.error(err);
        return message.reply(
          "❌ Şu anda yardımcı olamıyorum, lütfen `k!yazıgpt` kullanın."
        );
      }
    }

    // b) Asistan moda soru gönder
    const historyKey = `destiny_history_${message.author.id}`;
    let history = (await db.get(historyKey)) || [];

    const aiMessages = [
      {
        role: "system",
        content:
          "Sen Destiny adındaki yardımcı asistansın. Kurucun Mustafa Sepet. Soruları akıcı ve Türkçe cevapla.",
      },
      ...history.slice(-8),
      { role: "user", content: after },
    ];

    try {
      const aiRes = await axios.post(
        "https://api.ai21.com/studio/v1/chat/completions",
        {
          model: "jamba-large-1.7",
          messages: aiMessages,
          max_tokens: 2048,
          temperature: 0.4,
          top_p: 1,
        },
        {
          headers: {
            Authorization: `Bearer ${botConfig.AI21_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      const aiReply = aiRes.data.choices[0].message.content.trim();

      // c) Cevap çok uzunsa uyar
      if (aiReply.length > 2000) {
        const nudgeRes = await axios.post(
          "https://api.ai21.com/studio/v1/chat/completions",
          {
            model: "jamba-large-1.7",
            messages: [
              {
                role: "system",
                content:
                  "sadece kullanıcı isteğini yerine getir ekstra bişey yazma",
              },
              {
                role: "user",
                content:
                  "2000 karakterden uzun soru cevap uyarısı yaz. sorduğunuz soruya verilen cevap 2000 karakterin üzerindeydi k!yazıgpt create moduna geçerek sorunuza daha detaylı bilgi alabilirsiniz",
              },
            ],
            max_tokens: 400,
            temperature: 0.7,
          },
          {
            headers: {
              Authorization: `Bearer ${botConfig.AI21_API_KEY}`,
              "Content-Type": "application/json",
            },
          }
        );
        const nudge = nudgeRes.data.choices[0].message.content.trim();
        return message.reply(nudge);
      }

      // d) Normal cevap
      await message.reply(aiReply);

      // e) Geçmişi kaydet
      history.push({ role: "user", content: after });
      history.push({ role: "assistant", content: aiReply });
      await db.set(historyKey, history);
    } catch (err) {
      console.error(err.response?.data || err);
      message.reply("❌ Şu anda bir hata oluştu, lütfen tekrar deneyin.");
    }

    return;
  }

  // 5) Komut sistemi
  if (!content.startsWith(prefix)) return;
  const parts = content.slice(prefix.length).trim().split(/ +/);
  const cmdName = parts.shift().toLowerCase();

  let command = null;
  let commandName = null;

  // Komutu bul (ana ad veya alias'e göre)
  for (const [name, cmd] of client.commands) {
    const help = cmd.help || {};
    if (name.toLowerCase() === cmdName) {
      command = cmd;
      commandName = name;
      break;
    }
    if (
      help.aliases &&
      help.aliases.map((a) => a.toLowerCase()).includes(cmdName)
    ) {
      command = cmd;
      commandName = name;
      break;
    }
  }

  if (!command) {
    // Öneri sistemi: tüm komut adları ve aliases'ları listele
    const commandNames = [];
    client.commands.forEach((cmd, name) => {
      const help = cmd.help || {};
      commandNames.push(name.toLowerCase());
      if (help.aliases && Array.isArray(help.aliases)) {
        help.aliases.forEach((alias) => commandNames.push(alias.toLowerCase()));
      }
    });

    const distances = commandNames.map((name) => ({
      name,
      dist: levenshtein(cmdName, name),
    }));
    distances.sort((a, b) => a.dist - b.dist);

    const suggestions = distances
      .filter((d) => d.dist <= 3)
      .slice(0, 3)
      .map((d) => `\`${prefix}${d.name}\``);

    const embed = new MessageEmbed()
      .setTitle("❌ Komut Bulunamadı")
      .setColor("#FF5555")
      .setThumbnail(client.user.displayAvatarURL())
      .setFooter({ text: "Destiny v14 | Komut Öneri Sistemi" })
      .setTimestamp();

    if (suggestions.length) {
      embed.setDescription(
        `\`${cmdName}\` adında bir komut bulunamadı.\nBelki şunları demek istediniz:\n${suggestions.join(
          "\n"
        )}`
      );
    } else {
      embed.setDescription(
        `\`${cmdName}\` adında bir komut bulunamadı.\n\`${prefix}help\` yazarak tüm komutları görebilirsiniz.`
      );
    }

    return message.channel.send({ embeds: [embed] });
  }

  // Cooldown kontrolü
  const cooldownSeconds = command.cooldown || command.help?.cooldown || 5;
  const userId = message.author.id;
  const cooldownKey = `${commandName}Cooldown_${userId}`;
  const lastUsed = await db.get(cooldownKey);

  if (lastUsed && Date.now() - lastUsed < cooldownSeconds * 1000) {
    const remaining = cooldownSeconds * 1000 - (Date.now() - lastUsed);
    const seconds = Math.ceil(remaining / 1000);

    const msg = await message.reply(
      `⏳ | Bu komutu tekrar kullanabilmen için **${seconds} saniye** beklemelisin.`
    );

    setTimeout(() => {
      msg.delete().catch(() => {});
    }, seconds * 1000);

    return;
  }

  // Cooldown süresini kaydet
  await db.set(cooldownKey, Date.now());

  // Komutu çalıştır
  try {
    await command.execute(client, message, parts);
  } catch (err) {
    console.error(err);
    message.reply("Komut çalıştırılırken bir hata oluştu.");
  }
};
