module.exports = {
  name: "lock",
  description:
    "Yöneticiler hariç tüm rollerin bu kanala yazmasını kilitler veya açar.",
  usage: "lock <lock|unlock>",
  aliases: [],
  category: "Moderasyon", // Kategori eklendi
  cooldown: 10, // 10 saniye cooldown örneği

  async execute(client, message, args) {
    if (!message.member.permissions.has("MANAGE_CHANNELS")) {
      return message.reply(
        "❌ Bu komutu kullanmak için **Kanalları Yönet** yetkisine sahip olmalısınız."
      );
    }

    if (!args[0] || !["lock", "unlock"].includes(args[0].toLowerCase())) {
      return message.reply(
        "❌ Lütfen `lock` veya `unlock` argümanını belirtin. Örnek: `lock lock` veya `lock unlock`"
      );
    }

    const action = args[0].toLowerCase();

    // Yönetici olmayan roller (@everyone dahil)
    const roles = message.guild.roles.cache.filter((role) => {
      return !role.permissions.has("ADMINISTRATOR");
    });

    try {
      for (const [roleId, role] of roles) {
        await message.channel.permissionOverwrites.edit(role, {
          SEND_MESSAGES: action === "lock" ? false : null,
        });
      }

      if (action === "lock") {
        return message.channel.send(
          "🔒 Kanal kilitlendi! Yöneticiler hariç tüm roller yazamaz."
        );
      } else {
        return message.channel.send(
          "🔓 Kanal kilidi açıldı! Roller tekrar yazabilir."
        );
      }
    } catch (error) {
      console.error(error);
      return message.reply("❌ Kanal kilitlenirken/açılırken bir hata oluştu.");
    }
  },

  help: {
    name: "lock",
    description:
      "Yöneticiler hariç tüm rollerin bu kanala mesaj göndermesini kilitler veya açar.",
    usage: "lock <lock|unlock>",
    aliases: [],
    category: "Moderasyon",
    cooldown: 10,
  },
};
