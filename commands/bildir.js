const { MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");
const config = require("../botConfig.js");
const cooldowns = new Map(); // Kullanıcıların cooldown süresini takip etmek için

exports.execute = async (client, message, args) => {
    try {
        let reportMessage = args.join(" ");
        if (!reportMessage) {
            return message.reply("🚨 **Lütfen bildirilecek mesajı girin.**");
        }

        const isAdmin = message.member.permissions.has("ADMINISTRATOR");
        const userId = message.author.id;
        const lastUsed = cooldowns.get(userId);

        if (!isAdmin && lastUsed) {
            const timePassed = Date.now() - lastUsed;
            const cooldownTime = 12 * 60 * 60 * 1000; // 12 saat

            if (timePassed < cooldownTime) {
                const remaining = Math.ceil((cooldownTime - timePassed) / (60 * 60 * 1000));
                return message.reply(`⏳ **Bu komutu tekrar kullanmak için ${remaining} saat beklemelisin!**`);
            }
        }

        let embed = new MessageEmbed()
            .setTitle("🔔 **Yeni Bildirim**")
            .setDescription(`Mesajınız: **${reportMessage}**\n\n**Onaylamak için ✅, iptal etmek için ❌ butonlarına tıklayın.**`)
            .setColor("BLUE")
            .setTimestamp()
            .setFooter({ text: 'Bildirim işlemi için 1 dakika geçerlidir.' });

        const confirmButton = new MessageButton()
            .setCustomId('confirm')
            .setLabel('✅ Onayla')
            .setStyle('SUCCESS');

        const cancelButton = new MessageButton()
            .setCustomId('cancel')
            .setLabel('❌ İptal Et')
            .setStyle('DANGER');

        const row = new MessageActionRow().addComponents(confirmButton, cancelButton);
        const gameMessage = await message.channel.send({ embeds: [embed], components: [row] });

        const filter = i => i.user.id === message.author.id;
        const collector = gameMessage.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async (interaction) => {
            if (interaction.customId === 'confirm') {
                cooldowns.set(userId, Date.now()); // Cooldown başlat

                for (let adminId of config.admins) {
                    let admin = await message.guild.members.fetch(adminId).catch(() => null);
                    if (admin) {
                        try {
                            await admin.send({
                                embeds: [
                                    new MessageEmbed()
                                        .setTitle("⚠️ **Yeni Bildirim**")
                                        .setDescription(`Kullanıcı **${message.author.tag}** bir problem bildirdi:\n\n**${reportMessage}**`)
                                        .setColor("RED")
                                        .setTimestamp()
                                        .setFooter({ text: 'Bildirim gönderildi' })
                                ]
                            });
                        } catch (err) {
                            console.error(`Admin ${admin.user.tag} için DM gönderilemedi: `, err);
                        }
                    }
                }

                await message.channel.send("✅ **Bildirim adminlere başarıyla gönderildi.**");
            } else if (interaction.customId === 'cancel') {
                await message.channel.send(`${message.author} bildirisi iptal edildi.`);
            }

            collector.stop();
        });

        collector.on('end', () => {
            gameMessage.edit({ components: [] }).catch(() => {});
        });
    } catch (error) {
        console.error(error);
        return message.reply("❌ **Bir hata oluştu, lütfen tekrar deneyin.**");
    }
};

exports.help = {
    name: "bildir",
    aliases: ["b"],
    usage: "bildir <mesaj>",
    description: "Bildirilecek bir mesajı onaylatır ya da iptal ettirir."
};
