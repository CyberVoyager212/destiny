// commands/bildir.js
const { MessageEmbed, MessageAttachment, Permissions } = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();

exports.help = {
  name: "bildir",
  aliases: ["report", "şikayet"],
  usage:
    "bildir <metin> [fotoğraf] | bildir cevapla <id> <cevap> | bildir sil <id> | bildir help",
  description:
    "Botla ilgili sorunlarınızı bildirir, yönetici cevaplayabilir veya raporu kapatabilir.",
  category: "Araçlar",
  cooldown: 10,
};

exports.execute = async (client, message, args) => {
  const adminId = "707269247532793858";
  const sub = args[0]?.toLowerCase();

  // --- Yardım: bildir help ---
  if (sub === "help") {
    const embed = new MessageEmbed()
      .setTitle("📢 k!bildir Komut Yardım")
      .setColor("#5865F2")
      .setDescription(
        [
          "`k!bildir <şikayet metni>` — Yeni rapor oluşturur (isteğe bağlı fotoğraf ekleyin).",
          "`k!bildir cevapla <id> <cevap>` — Yönetici rapora cevap verir (DM olarak iletilir).",
          "`k!bildir sil <id>` — Yönetici raporu kapatır ve veritabanından siler.",
          "`k!bildir help` — Bu yardım mesajını gösterir.",
          "",
          "**Örnekler:**",
          "`k!bildir Kumar komutunda param gitti! [fotoğraf ekledim]`",
          "`k!bildir cevapla ab12cd3 Sorununuzu anladık, paramı geri göndereceğiz.`",
          "`k!bildir sil ab12cd3`",
        ].join("\n")
      )
      .setFooter({
        text: message.author.tag,
        iconURL: message.author.displayAvatarURL(),
      })
      .setTimestamp();

    try {
      await message.author.send({ embeds: [embed] });
      if (message.channel.type !== "DM")
        await message.reply(
          "📬 Komut kullanımı DM olarak gönderildi. Lütfen DM kutunuzu kontrol edin."
        );
    } catch {
      await message.reply(
        "⚠️ DM'lerinizi açtığınızdan emin olun, yardım mesajı gönderilemedi."
      );
    }
    return;
  }

  // --- Rapor sil: bildir sil <id> ---
  if (sub === "sil") {
    if (message.author.id !== adminId)
      return message.reply("❌ Bu işlemi sadece yönetici yapabilir.");
    const id = args[1];
    if (!id) return message.reply("❌ Kapatılacak bildirimin ID’sini girin.");
    const report = await db.get(`report_${id}`);
    if (!report) return message.reply("❌ Bu ID ile bir bildirim bulunamadı.");
    await db.delete(`report_${id}`);
    await db.delete(`report_files_${id}`);
    await db.delete(`report_responses_${id}`);
    return message.channel.send(`🗑️ Bildirim **${id}** başarıyla kapatıldı.`);
  }

  // --- Rapor cevapla: bildir cevapla <id> <cevap> ---
  if (sub === "cevapla") {
    if (message.author.id !== adminId)
      return message.reply("❌ Bu işlemi sadece yönetici yapabilir.");
    const id = args[1];
    const replyText = args.slice(2).join(" ");
    if (!id || !replyText)
      return message.reply("❌ Kullanım: `k!bildir cevapla <id> <cevap>`");
    const report = await db.get(`report_${id}`);
    if (!report) return message.reply("❌ Bu ID ile bir bildirim bulunamadı.");

    // Cevabı kaydet
    const responses = (await db.get(`report_responses_${id}`)) || [];
    responses.push({
      by: message.author.id,
      text: replyText,
      date: Date.now(),
    });
    await db.set(`report_responses_${id}`, responses);

    // Rapor sahibine DM gönder
    const user = await client.users.fetch(report.author).catch(() => null);
    if (user) {
      await user
        .send(`📣 **Bildiriminiz (#${id}) için cevap:**\n${replyText}`)
        .catch(() => {});
      await message.channel.send(
        `✅ Bildirim **${id}** için cevap DM ile iletildi.`
      );
    } else {
      await message.channel.send("⚠️ Rapor sahibi bulunamadı veya DM kapalı.");
    }
    return;
  }

  // --- Yeni bildirim oluştur ---
  // args tümü metin veya metin+foto
  if (args.length && sub !== "cevapla" && sub !== "sil") {
    // Rapor detayları
    const reportText = args.join(" ");
    const id = Date.now().toString(36); // basit ID

    // Veritabanına kaydet
    await db.set(`report_${id}`, {
      author: message.author.id,
      text: reportText,
      date: Date.now(),
    });
    const files = message.attachments.map((att) => att.url);
    if (files.length) await db.set(`report_files_${id}`, files);

    // Embed hazırla
    const embed = new MessageEmbed()
      .setTitle(`📣 Yeni Bildirim (#${id})`)
      .setColor("#FFA500")
      .setTimestamp()
      .addFields(
        {
          name: "👤 Kullanıcı",
          value: `${message.author} (\`${message.author.id}\`)`,
          inline: true,
        },
        { name: "📝 Bildirim", value: reportText, inline: false },
        { name: "👥 Yönetici", value: `<@${adminId}>`, inline: true }
      );
    if (files.length) embed.setImage(files[0]);

    // Onay mesajı
    const confirmMsg = await message.channel.send({
      embeds: [embed],
      content: "⚠️ Göndermek için `evet`, iptal için `hayır` yazın. (30s)",
    });

    const filter = (m) =>
      m.author.id === message.author.id &&
      ["evet", "hayır"].includes(m.content.toLowerCase());
    const collector = message.channel.createMessageCollector({
      filter,
      max: 1,
      time: 30000,
    });

    collector.on("collect", async (m) => {
      if (m.content.toLowerCase() === "evet") {
        // Yöneticiye DM + dosya
        const admin = await client.users.fetch(adminId).catch(() => null);
        if (admin) {
          const attachments = files.map((url) => new MessageAttachment(url));
          await admin
            .send({ embeds: [embed], files: attachments })
            .catch(() => {});
          await message.author.send(
            `✅ Bildiriminiz **${id}** yöneticilere iletildi.`
          );
        } else {
          await message.author.send("⚠️ Yönetici bulunamadı.");
        }
      } else {
        // İptal
        await message.author.send("❌ Bildirim iptal edildi.");
        await db.delete(`report_${id}`);
        await db.delete(`report_files_${id}`);
      }
      // Temizlik
      setTimeout(() => {
        [message, confirmMsg, m].forEach((msg) =>
          msg?.delete().catch(() => {})
        );
      }, 2000);
    });

    collector.on("end", (collected) => {
      if (!collected.size) {
        message.author
          .send("⌛ Süre doldu, bildirim iptal edildi.")
          .then((msg) => setTimeout(() => msg.delete().catch(() => {}), 2000));
        db.delete(`report_${id}`);
        db.delete(`report_files_${id}`);
        setTimeout(() => {
          [message, confirmMsg].forEach((msg) => msg?.delete().catch(() => {}));
        }, 2000);
      }
    });

    return;
  }

  // Hatalı kullanım
  return message.reply(
    "❌ Geçersiz kullanım. Yardım için `k!bildir help` komutunu kullanın."
  );
};
