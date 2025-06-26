const { MessageActionRow, MessageButton } = require('discord.js');

exports.execute = async (client, message, args) => {
    if (!message.member.permissions.has('ADMINISTRATOR')) {
        return message.reply("Bu komutu kullanmak için yetkiniz yok.");
    }

    // Kullanım kontrolü
    if (args.length < 1) {
        return message.reply("Lütfen bir takma ad belirtin. Örn: !toplutakmaadver yeniTakmaAd");
    }

    const newNickname = args.join(' '); // Takma ad olarak belirtilen tüm argümanları al

    try {
        let updatedMembers = 0;
        let skippedMembers = 0; // Atlanan üyeler sayısı
        let isPaused = false; // İşlemi durdurma durumu

        // Sunucudaki tüm üyeleri fetch() ile al
        const members = await message.guild.members.fetch(); // Tüm üyeleri al
        const nonBotMembers = members.filter(member => !member.user.bot); // Bot olmayanları filtrele
        const totalMembers = nonBotMembers.size; // Bot olmayan üyelerin toplam sayısı

        // Durdurma (🛑) ve devam ettirme (▶️) butonları ekleyelim
        const row = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId('pause')
                    .setLabel('Durdur')
                    .setStyle('DANGER'),
                new MessageButton()
                    .setCustomId('resume')
                    .setLabel('Devam Et')
                    .setStyle('SUCCESS')
            );

        let statusMessage = await message.channel.send({
            content: 'Takma ad dağıtımı başladı...',
            components: [row]
        });

        const filter = interaction => interaction.user.id === message.author.id;
        const collector = statusMessage.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async (interaction) => {
            if (interaction.customId === 'pause') {
                isPaused = true;
                await interaction.update({ content: 'İşlem durduruldu.', components: [row] });
            } else if (interaction.customId === 'resume') {
                isPaused = false;
                await interaction.update({ content: 'İşlem devam ediyor.', components: [row] });
            }
        });

        for (const [index, member] of [...nonBotMembers.values()].entries()) {
            // Her adımda işlemi durdurma kontrolü yapıyoruz
            while (isPaused) {
                await new Promise(resolve => setTimeout(resolve, 1000)); // 1 saniye bekle
            }

            const previousNickname = member.nickname || 'Takma adı yok'; // Üyenin önceki takma adını al

            if (previousNickname === newNickname) {
                skippedMembers++; // Zaten bu takma ada sahip üyeleri say
            } else {
                await member.setNickname(newNickname).catch(error => {
                    console.error(`Takma ad ayarlanırken hata oluştu: ${error}`);
                });
                updatedMembers++;
            }

            // Her işlemde bilgileri mesaj olarak güncelle
            await statusMessage.edit({
                content: `Takma ad "${newNickname}" veriliyor... Güncellenen: ${updatedMembers}, Atlanan: ${skippedMembers}`,
            });

            await new Promise(resolve => setTimeout(resolve, 500)); // 0.5 saniye bekle
        }

        // Son bildirim gönder
        await statusMessage.edit({
            content: `Başarıyla tüm kullanıcılara "${newNickname}" takma adı verildi.\nGüncellenen: ${updatedMembers}, Atlanan: ${skippedMembers}`,
            components: [] // Butonları kaldır
        });

    } catch (error) {
        console.error(error);
        return message.reply("Komut çalıştırılırken bir hata oluştu.");
    }
};

exports.help = {
    name: "toplutakmaadver",
    aliases: ["tta"],
    description: 'herkese takma ad verir',
    usage: `toplutakmaadver yeniTakmaAd`
};
