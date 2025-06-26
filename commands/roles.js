const { MessageActionRow, MessageButton } = require('discord.js');

exports.execute = async (client, message, args) => {
    try {
        // Yetki kontrolü
        if (!message.member.permissions.has('VIEW_AUDIT_LOG')) {
            return message.reply("❌ Bu komutu kullanmak için yeterli izniniz yok.");
        }

        const roles = message.guild.roles.cache.map(role => `${role.name} (${role.id})`);
        const pageSize = 25; // Sayfa başına gösterilecek rol sayısı
        let currentPage = 0;
        const totalPages = Math.ceil(roles.length / pageSize);

        // Sayfa oluşturma fonksiyonu
        const generatePage = (page) => {
            const row = new MessageActionRow()
                .addComponents(
                    new MessageButton()
                        .setCustomId('prev')
                        .setLabel('⬅️')
                        .setStyle('PRIMARY')
                        .setDisabled(page === 0),
                    new MessageButton()
                        .setCustomId('next')
                        .setLabel('➡️')
                        .setStyle('PRIMARY')
                        .setDisabled(page === totalPages - 1)
                );

            const pageEmbed = {
                content: `**Sunucudaki Roller**\nSayfa ${page + 1}/${totalPages}`,
                embeds: [{
                    title: "Sunucudaki Roller",
                    color: "BLUE",
                    description: roles.slice(page * pageSize, (page + 1) * pageSize).join('\n'),
                    timestamp: new Date(),
                    footer: { text: `Sayfa ${page + 1}/${totalPages}` }
                }],
                components: [row]
            };

            return pageEmbed;
        };

        // İlk sayfayı gönder
        const embedMessage = await message.channel.send(generatePage(currentPage));

        // Buton reaksiyonları için filtreleme
        const collector = embedMessage.createMessageComponentCollector({
            componentType: 'BUTTON',
            time: 60000
        });

        collector.on('collect', async (interaction) => {
            if (interaction.user.id !== message.author.id) {
                return interaction.reply({
                    content: "Bu işlemi siz yapamazsınız.",
                    ephemeral: true
                });
            }

            if (interaction.customId === 'next' && currentPage < totalPages - 1) {
                currentPage++;
            } else if (interaction.customId === 'prev' && currentPage > 0) {
                currentPage--;
            }

            await interaction.update(generatePage(currentPage));
        });

        collector.on('end', () => {
            embedMessage.edit({
                content: "🔒 Zaman aşımına uğradı. Artık sayfa değiştiremezsiniz.",
                components: []
            });
        });

    } catch (error) {
        console.error("Bir hata oluştu:", error);
        return message.reply("⚠️ Bir hata oluştu, lütfen tekrar deneyin.");
    }
};

exports.help = {
    name: "roles",
    aliases: ["roller"],
    usage: `roles`,
    description: "Sunucudaki rolleri 25'lik gruplar halinde gösterir."
};
