const { MessageEmbed } = require("discord.js"); // EmbedBuilder yerine MessageEmbed kullanıyoruz
const db = require('quick.db');

exports.execute = async (client, message, args) => {
    // Yetki kontrolü
    if (!client.config.admins.includes(message.author.id)) {
        return message.reply("🚫 Bu komutu kullanmak için yetkiniz yok.");
    }

    let user = message.mentions.users.first();
    let resetAll = args[0] === "all";

    try {
        // Tüm kullanıcıların parasını sıfırlama
        if (resetAll) {
            const guild = message.guild; // Komutun gönderildiği sunucu
            const members = await guild.members.fetch(); // Tüm üyeleri al

            // Üyeler üzerinden geçerek, botlar hariç tüm kullanıcıların parasını sıfırlama
            for (const member of members.values()) {
                if (member.user.bot) continue; // Botları atla
                await db.set(`money_${member.user.id}`, 0); // Kullanıcının parasını sıfırla
            }

            const embed = new MessageEmbed() // EmbedBuilder yerine MessageEmbed kullanıyoruz
                .setTitle("💰 Tüm Kullanıcıların Parası Sıfırlandı!")
                .setDescription("🔄 Sunucudaki tüm kullanıcıların parası başarıyla sıfırlandı.")
                .setColor("RANDOM") // "Random" yerine "RANDOM" kullanmalısınız
                .setTimestamp();

            return message.channel.send({ embeds: [embed] });
        } else if (user) {
            // Belirtilen kullanıcının parasını sıfırlama
            await db.set(`money_${user.id}`, 0); // Belirtilen kullanıcının parasını sıfırla

            const embed = new MessageEmbed() // EmbedBuilder yerine MessageEmbed kullanıyoruz
                .setTitle("💰 Kullanıcının Parası Sıfırlandı!")
                .addFields(
                    { name: "Kullanıcı", value: `<@${user.id}>`, inline: true },
                    { name: "Toplam Miktar", value: "0", inline: true }
                )
                .setColor("RANDOM") // "Random" yerine "RANDOM" kullanmalısınız
                .setThumbnail(user.displayAvatarURL())
                .setTimestamp();

            return message.channel.send({ embeds: [embed] });
        } else {
            // Kullanıcı belirtilmediyse hata mesajı
            return message.reply("❌ Lütfen bir kullanıcı belirtin veya 'all' komutunu kullanın!");
        }
    } catch (error) {
        // Hata kontrolü
        console.error("Hata:", error); // Hata mesajını logla
        return message.reply("❌ Bir şeyler ters gitti. Lütfen tekrar deneyin veya bir hata bildirin.");
    }
};

exports.help = {
    name: "resetmoney",
    aliases: ["resetbal"],
    usage: `resetmoney @kullanıcı | resetmoney all`,
    description: "Bir kullanıcının parasını sıfırlar veya tüm sunucudaki kullanıcıların parasını sıfırlar."
};