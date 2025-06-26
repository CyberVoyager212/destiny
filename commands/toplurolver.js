const { MessageActionRow, MessageButton } = require('discord.js');

exports.execute = async (client, message, args) => {
    if (!message.member.permissions.has('ADMINISTRATOR')) {
        return message.reply("Bu komutu kullanmak için yetkiniz yok.");
    }

    // Kullanım kontrolü
    if (message.mentions.roles.size < 1) {
        return message.reply("Lütfen en az bir rol etiketleyin. Örn: !toplurolver @rol1 @rol2");
    }

    try {
        const rolesAdded = [];
        let totalMembers = 0;
        let membersWithRole = 0;
        let isPaused = false; // İşlemi durdurmak için

        // Sunucudaki tüm üyeleri fetch() ile al
        const members = await message.guild.members.fetch();
        totalMembers = members.filter(member => !member.user.bot).size; // Bot olmayan üyelerin toplam sayısı

        // Butonları oluştur
        const row = new MessageActionRow().addComponents(
            new MessageButton()
                .setCustomId('pause')
                .setLabel('Durdur')
                .setStyle('DANGER'),
            new MessageButton()
                .setCustomId('resume')
                .setLabel('Devam Ettir')
                .setStyle('SUCCESS')
        );

        // İlk mesajı gönder
        const statusMessage = await message.channel.send({
            content: `Rol dağıtımı başladı... Toplam üye sayısı: ${totalMembers}`,
            components: [row]
        });

        // Butonları dinlemek için bir collector başlat
        const filter = (interaction) => interaction.user.id === message.author.id; // Yalnızca komutu yazan kullanıcı etkileşime girebilir
        const collector = statusMessage.createMessageComponentCollector({ filter, time: 60000 }); // 1 dakika süreyle butonları dinle

        collector.on('collect', async (interaction) => {
            if (interaction.customId === 'pause') {
                isPaused = true;
                await interaction.update({
                    content: 'İşlem durduruldu.',
                    components: [row] // Butonları koru
                });
            } else if (interaction.customId === 'resume') {
                isPaused = false;
                await interaction.update({
                    content: 'İşlem devam ediyor...',
                    components: [row] // Butonları koru
                });
            }
        });

        // Etiketlenen rolleri al
        for (const role of message.mentions.roles.values()) {
            for (const [index, member] of [...members.values()].entries()) {
                // Her adımda işlemi durdurma kontrolü yapıyoruz
                while (isPaused) {
                    await new Promise(resolve => setTimeout(resolve, 1000)); // 1 saniye bekle
                }

                // Bot olmayanlara rol ekle
                if (!member.user.bot && !member.roles.cache.has(role.id)) {
                    await member.roles.add(role).then(async () => {
                        membersWithRole++;
                        const remainingMembers = totalMembers - membersWithRole; // Kalan üye sayısı

                        // Durum mesajını güncelle
                        await statusMessage.edit({
                            content: `"${role.name}" rolü veriliyor...\n` +
                                     `İşlemdeki Kişi: ${member.user.tag}\n` +
                                     `Verilen Kişi Sayısı: ${membersWithRole}\n` +
                                     `Kalan Kişi Sayısı: ${remainingMembers}\n` +
                                     `Sıradaki Kişi: ${index + 1}/${totalMembers}`
                        }).catch(console.error);
                    }).catch(error => {
                        console.error(`Rol eklenirken hata oluştu: ${error}`);
                    });

                    // 0.5 saniye bekle
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }
            rolesAdded.push(role.name);
        }

        // Son bildirim gönder
        await statusMessage.edit({
            content: `Başarıyla şu roller verildi: ${rolesAdded.join(', ')}`,
            components: [] // Butonları kaldır
        });

    } catch (error) {
        console.error(error);
        return message.reply("Komut çalıştırılırken bir hata oluştu.");
    }
};

exports.help = {
    name: "toplurolver",
    aliases: ["trv"],
    description: 'tüm kullanıcılara rol verir',
    usage: `toplurolver @rol1 @rol2 ...`
};
