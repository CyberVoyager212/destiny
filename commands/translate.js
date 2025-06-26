const { MessageEmbed } = require('discord.js');
const translate = require('@iamtraction/google-translate');

module.exports = {
    name: 'translate',
    description: 'Bir metni istediğiniz dile çevirir.',
    usage: 'translate <dil_kodu> <metin>',
    example: 'translate tr Merhaba!',

    async execute(client, message, args) {
        // Argümanlardan dil kodu ve metni al
        const language = args[0];
        const text = args.slice(1).join(' ');

        // Dil kodu ve metin kontrolü
        if (!language || !text) {
            return message.reply('Lütfen geçerli bir dil kodu ve çevrilecek metin girin. Örnek: `!translate tr Merhaba!`');
        }

        try {
            // Google Translate API'si ile çeviri
            const res = await translate(text, { to: language });

            // Başarılı çeviri yanıtı
            const embed = new MessageEmbed()
                .setTitle('✅・Başarılı!')
                .setDescription('Aşağıdaki metni çevirdim:')
                .addFields(
                    { name: "📥 - Girdi", value: text, inline: false },
                    { name: "📤 - Çıktı", value: res.text, inline: false }
                )
                .setColor('GREEN');

            await message.reply({ embeds: [embed] });

        } catch (err) {
            console.error(err);

            // Hata mesajı
            const errorEmbed = new MessageEmbed()
                .setTitle('❌ Hata!')
                .setDescription('Lütfen geçerli bir ISO dil kodu sağlayın!')
                .setColor('RED');

            await message.reply({ embeds: [errorEmbed] });
        }
    },

    help: {
        name: 'translate',
        description: 'Bir metni bir dilden başka bir dile çevirir.',
        usage: 'translate <dil_kodu> <metin>',
        example: 'translate tr Merhaba!'
    }
};
