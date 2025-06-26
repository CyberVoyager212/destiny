const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');
const botConfig = require('../botConfig');

exports.execute = async (client, message, args) => {
    try {
        // Kullanıcının mesajını sil
        await message.delete();
    } catch (error) {
        console.log('Error deleting message:', error);
    }

    // Kullanıcının ID'si admin listesinde mi kontrol et
    if (!botConfig.admins.includes(message.author.id)) {
        return message.reply("❌ Bu komutu kullanmak için yetkiniz yok.");
    }

    const guilds = Array.from(client.guilds.cache.values());
    const numberEmojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

    // Eğer bot 10'dan fazla sunucuya bağlıysa, sadece ilk 10'u listele
    if (guilds.length > 10) {
        guilds.length = 10;
    }

    // Embed mesajını oluştur
    const createEmbed = () => {
        const embed = new MessageEmbed()
            .setTitle("Bağlı Olduğum Sunucular")
            .setColor("BLUE")
            .setTimestamp();

        const fields = guilds.map((guild, index) => ({
            name: `${numberEmojis[index]} ${guild.name}`,
            value: `Üye Sayısı: ${guild.memberCount}`,
            inline: true
        }));

        embed.addFields(fields);
        return embed;
    };

    // Embed mesajını ve butonları yalnızca bir kez gönder
    const row = new MessageActionRow();
    numberEmojis.slice(0, guilds.length).forEach((emoji, index) => {
        row.addComponents(
            new MessageButton()
                .setCustomId(`leave_server_${index}`)
                .setLabel(emoji)
                .setStyle('DANGER')
        );
    });

    // Sunucular hakkında bir embed mesajı ve butonları birlikte gönder
    let sentMessage;
    try {
        sentMessage = await message.channel.send({
            content: `Bağlı olduğum sunuculardan birini seçip ayrılabilirsiniz.`,
            embeds: [createEmbed()],
            components: [row]
        });
    } catch (error) {
        console.log('Error sending message:', error);
        return message.reply("❌ Mesaj gönderilirken bir hata oluştu.");
    }

    // Buton etkileşimlerini dinleme
    const filter = i => i.user.id === message.author.id; // Sadece komut sahibinin etkileşimi kabul edilir
    const collector = sentMessage.createMessageComponentCollector({ filter, time: 15000 });

    collector.on('collect', async (interaction) => {
        if (interaction.customId.startsWith('leave_server_')) {
            const serverIndex = parseInt(interaction.customId.split('_')[2]);

            const guild = guilds[serverIndex];
            if (guild) {
                try {
                    await guild.leave();
                    await interaction.reply({
                        content: `✅ Başarıyla ${guild.name} sunucusundan ayrıldınız.`,
                        ephemeral: true
                    });
                } catch (error) {
                    console.log('Error leaving guild:', error);
                    await interaction.reply({
                        content: `❌ ${guild.name} sunucusundan ayrılırken bir hata oluştu.`,
                        ephemeral: true
                    });
                }
            }
        }
        collector.stop();
    });

    collector.on('end', (collected, reason) => {
        if (reason === 'time') {
            message.channel.send('Onay süresi doldu, sunucudan ayrılma işlemi gerçekleşmedi.');
        }
    });
};

exports.help = {
    name: "sunucular",
    aliases: ["servers"],
    usage: `sunucular`,
    description: "Bağlı olduğum sunuculardan birini seçip ayrılmanıza imkan tanır."
};
