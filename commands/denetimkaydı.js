const { MessageActionRow, MessageButton } = require('discord.js');

exports.execute = async (client, message, args) => {
    const { guild } = message;

    try {
        // Denetim kaydını al
        const auditLogs = await guild.fetchAuditLogs({ limit: 50 });
        const logsArray = auditLogs.entries.map(entry => {
            const user = entry.executor ? entry.executor.tag : "Bilinmiyor";
            const action = entry.action;
            const target = entry.target ? (entry.target.tag || entry.target.name || entry.target.id) : "Bilinmiyor";
            const reason = entry.reason || "Sebep belirtilmemiş";
            return `**Kullanıcı:** ${user}\n**Eylem:** ${action}\n**Hedef:** ${target}\n**Sebep:** ${reason}`;
        });

        // Eğer kayıtlara ulaşılamazsa
        if (logsArray.length === 0) {
            return message.channel.send("⚠️ **Denetim kaydı bulunamadı.**");
        }

        // Sayfa yapısı
        let currentPage = 0;
        const itemsPerPage = 5;
        const maxPages = Math.ceil(logsArray.length / itemsPerPage) - 1;

        // Sayfa mesajı oluşturma
        const createMessage = (page) => {
            const start = page * itemsPerPage;
            const end = start + itemsPerPage;
            const logs = logsArray.slice(start, end).map((log, index) => `**${start + index + 1}. Kayıt:**\n${log}`).join('\n\n') || "Denetim kaydı bulunamadı.";
            return `**${guild.name} Denetim Kaydı**\n\n${logs}\n\n**Sayfa ${page + 1}/${maxPages + 1}**`;
        };

        // İlk mesajı gönder
        const firstMessage = await message.channel.send(createMessage(currentPage));

        // Eğer sayfa 1'den fazla ise butonları ekle
        if (logsArray.length > itemsPerPage) {
            const row = new MessageActionRow()
                .addComponents(
                    new MessageButton()
                        .setCustomId('back')
                        .setLabel('⬅️ Geri')
                        .setStyle('PRIMARY')
                        .setDisabled(currentPage === 0), // İlk sayfada devre dışı
                    new MessageButton()
                        .setCustomId('next')
                        .setLabel('➡️ İleri')
                        .setStyle('PRIMARY')
                        .setDisabled(currentPage === maxPages) // Son sayfada devre dışı
                );

            await firstMessage.edit({ content: createMessage(currentPage), components: [row] });

            const filter = (interaction) => interaction.user.id === message.author.id;
            const collector = firstMessage.createMessageComponentCollector({ filter, time: 60000 });

            collector.on('collect', async (interaction) => {
                try {
                    if (interaction.customId === 'next' && currentPage < maxPages) {
                        currentPage++;
                    } else if (interaction.customId === 'back' && currentPage > 0) {
                        currentPage--;
                    }

                    // Butonları güncelle
                    await interaction.update({
                        content: createMessage(currentPage),
                        components: [
                            new MessageActionRow().addComponents(
                                new MessageButton()
                                    .setCustomId('back')
                                    .setLabel('⬅️ Geri')
                                    .setStyle('PRIMARY')
                                    .setDisabled(currentPage === 0),
                                new MessageButton()
                                    .setCustomId('next')
                                    .setLabel('➡️ İleri')
                                    .setStyle('PRIMARY')
                                    .setDisabled(currentPage === maxPages)
                            )
                        ]
                    });
                } catch (error) {
                    console.error('Buton tıklanırken hata oluştu:', error);
                    await interaction.reply({ content: '❌ **Bir hata oluştu!**', ephemeral: true });
                }
            });

            collector.on('end', () => {
                firstMessage.edit({ components: [] }).catch(error => console.error('Butonlar kaldırılırken hata oluştu:', error));
            });
        }

    } catch (error) {
        console.error('Denetim kaydı alınırken hata oluştu:', error);
        return message.reply("❌ **Denetim kaydına erişim sağlanırken bir hata oluştu.**");
    }
};

exports.help = {
        "name": "denetimkaydı",
        "aliases": [
            "dk"
        ],
        "usage": "denetimkaydı",
        "description": "Botun denetim kaydını görüntüler veya kaydeder."
};
