// commands/engel.js
const { QuickDB } = require("quick.db");
const db = new QuickDB();

exports.execute = async (client, message, args) => {
  if (!message.member.permissions.has("MANAGE_CHANNELS"))
    return message.reply("⛔ `KANALLARI_YÖNET` yetkisi gerekiyor.");

  const sub = args[0]?.toLowerCase();
  if (!["ekle", "sil", "liste"].includes(sub))
    return message.reply("Alt komut: `ekle`, `sil`, `liste`");

  const guildKey = `mesajEngel_${message.guild.id}`;
  let all = (await db.get(guildKey)) || {};

  // --- EKLE ---
  if (sub === "ekle") {
    const chan = message.mentions.channels.first();
    if (!chan)
      return message.reply("⛔ Örnek: `k!engel ekle #kanal filtre1,filtre2`");

    // virgülle ayrılmış liste
    const list = args
      .slice(2)
      .join(" ")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (!list.length) return message.reply("⛔ En az bir filtre gir.");

    // mevcutları koru, yenileri ekle (tekrarsız)
    all[chan.id] = Array.from(new Set([...(all[chan.id] || []), ...list]));
    await db.set(guildKey, all);

    return message.reply(
      `✅ ${chan} için filtreler kaydedildi:\n` +
        `\`${all[chan.id].join("`, `")}\``
    );
  }

  // --- SİL ---
  if (sub === "sil") {
    const chan = message.mentions.channels.first();
    if (!chan) return message.reply("⛔ Örnek: `k!engel sil #kanal [filtre]`");

    const cur = all[chan.id];
    if (!cur) return message.reply(`❌ ${chan} için ayar yok.`);

    const rem = args
      .slice(2)
      .join(" ")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (rem.length) {
      // belirli filtreleri sil
      all[chan.id] = cur.filter((f) => !rem.includes(f));
      if (!all[chan.id].length) delete all[chan.id];
    } else {
      // tümünü sil
      delete all[chan.id];
    }

    await db.set(guildKey, all);
    return message.reply(`✅ ${chan} için silme işlemi tamam.`);
  }

  // --- LİSTE ---
  if (sub === "liste") {
    const chan = message.mentions.channels.first();
    if (chan) {
      const arr = all[chan.id];
      if (!arr) return message.reply(`🔍 ${chan} için ayar yok.`);
      return message.reply(`🔍 ${chan} filtreleri:\n\`${arr.join("`, `")}\``);
    } else {
      if (!Object.keys(all).length)
        return message.reply("📭 Hiç filtre ayarlı değil.");
      const lines = Object.entries(all)
        .map(([cid, arr]) => `<#${cid}> → \`${arr.join("`, `")}\``)
        .join("\n");
      return message.reply("📋 Sunucu filtreleri:\n" + lines);
    }
  }
};

exports.help = {
  name: "engel",
  description: "Kanallarda özel filtreleme sağlar.",
  usage: "engel <ekle|sil|liste> #kanal [filtre1,filtre2,…]",
  category: "Moderasyon",
  cooldown: 5,
};
