const math = require('mathjs');
const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');

exports.execute = async (client, message, args) => {
    // Hesap makinesi için butonlar (her satırda en fazla 5 buton olacak şekilde)
    const row1 = new MessageActionRow()
        .addComponents(
            new MessageButton().setCustomId('1').setLabel('1').setStyle('SECONDARY'),
            new MessageButton().setCustomId('2').setLabel('2').setStyle('SECONDARY'),
            new MessageButton().setCustomId('3').setLabel('3').setStyle('SECONDARY'),
            new MessageButton().setCustomId('plus').setLabel('+').setStyle('PRIMARY'),
            new MessageButton().setCustomId('openParen').setLabel('(').setStyle('PRIMARY')
        );

    const row2 = new MessageActionRow()
        .addComponents(
            new MessageButton().setCustomId('4').setLabel('4').setStyle('SECONDARY'),
            new MessageButton().setCustomId('5').setLabel('5').setStyle('SECONDARY'),
            new MessageButton().setCustomId('6').setLabel('6').setStyle('SECONDARY'),
            new MessageButton().setCustomId('minus').setLabel('-').setStyle('PRIMARY'),
            new MessageButton().setCustomId('closeParen').setLabel(')').setStyle('PRIMARY')
        );

    const row3 = new MessageActionRow()
        .addComponents(
            new MessageButton().setCustomId('7').setLabel('7').setStyle('SECONDARY'),
            new MessageButton().setCustomId('8').setLabel('8').setStyle('SECONDARY'),
            new MessageButton().setCustomId('9').setLabel('9').setStyle('SECONDARY'),
            new MessageButton().setCustomId('multiply').setLabel('x').setStyle('PRIMARY'),
            new MessageButton().setCustomId('power').setLabel('^').setStyle('PRIMARY')
        );

    const row4 = new MessageActionRow()
        .addComponents(
            new MessageButton().setCustomId('clear').setLabel('AC').setStyle('DANGER'),
            new MessageButton().setCustomId('0').setLabel('0').setStyle('SECONDARY'),
            new MessageButton().setCustomId('delete').setLabel('⌫').setStyle('DANGER'),
            new MessageButton().setCustomId('divide').setLabel('/').setStyle('PRIMARY'),
            new MessageButton().setCustomId('equals').setLabel('=').setStyle('SUCCESS')
        );

    let currentExpression = '';

    const startMessage = await message.reply({
        content: 'Hesap makinesi hazır! İşlemi yapmak için butonlara tıklayın.',
        embeds: [
            new MessageEmbed()
                .setTitle('🧮・Hesap Makinesi')
                .setDescription(`Hesaplama: ${currentExpression}`)
                .setColor('BLUE')
        ],
        components: [row1, row2, row3, row4]
    });

    // Buton tıklama olaylarını dinleme
    const filter = (interaction) => interaction.user.id === message.author.id;
    const collector = startMessage.createMessageComponentCollector({ filter, time: 60000 });

    collector.on('collect', async (interaction) => {
        const buttonId = interaction.customId;

        // Kullanıcıya verdiğimiz geri bildirimi yanıtla
        await interaction.deferUpdate();

        // İlgili işlemi yap
        if (buttonId === 'clear') {
            currentExpression = '';  // Tüm ifadeyi temizle
        } else if (buttonId === 'delete') {
            currentExpression = currentExpression.slice(0, -1);  // Son karakteri sil
        } else if (buttonId === 'equals') {
            try {
                // Kullanıcıdan gelen ifadeyi çözümle
                const result = math.evaluate(currentExpression);
                currentExpression = result.toString();  // Sonucu ifade olarak ayarla
            } catch (error) {
                currentExpression = 'Hata!';  // Geçersiz işlem hatası
            }
        } else if (buttonId === 'openParen') {
            currentExpression += '(';  // Açma parantezi ekle
        } else if (buttonId === 'closeParen') {
            currentExpression += ')';  // Kapatma parantezi ekle
        } else {
            // Butonun label'ını işlem olarak ekle
            currentExpression += buttonId === 'plus' ? '+' :
                                 buttonId === 'minus' ? '-' :
                                 buttonId === 'multiply' ? '*' :
                                 buttonId === 'divide' ? '/' :
                                 buttonId === 'power' ? '^' : buttonId;
        }

        // Hesap makinesinin güncellenmiş ifadesini gönder
        await interaction.editReply({
            embeds: [
                new MessageEmbed()
                    .setTitle('🧮・Hesap Makinesi')
                    .setDescription(`Hesaplama: ${currentExpression}`)
                    .setColor('BLUE')
            ],
            components: [row1, row2, row3, row4]
        });
    });

    collector.on('end', async () => {
        await startMessage.edit({
            content: 'Süre doldu, işlem iptal edildi.',
            embeds: [
                new MessageEmbed()
                    .setTitle('🧮・Hesap Makinesi')
                    .setDescription('Süre doldu, işlem iptal edildi.')
                    .setColor('RED')
            ],
            components: []  // Butonları kaldır
        });
    });
};

exports.help = {
    name: 'calculator',
    aliases: ['calc', 'hesapla'],
    usage: 'calculator',
    description: 'Matematiksel işlemler yapmanıza olanak tanır.'
};
