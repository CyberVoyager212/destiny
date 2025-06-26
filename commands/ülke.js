const { MessageEmbed } = require('discord.js');
const fetch = require('node-fetch');

module.exports = {
    name: 'country',
    description: 'Belirtilen ülkenin bilgilerini gösterir.',
    aliases: ['ülke', 'ülkebilgi'],
    usage: 'country <ülke adı>',
    category: 'Bilgi',
    accessableby: 'Herkes',
    
    execute: async (client, message, args) => {
        const country = args.join(' ');
        if (!country) {
            return message.reply(':x: Lütfen geçerli bir ülke adı girin! Kullanım: `country <ülke adı>`');
        }

        const url = `https://restcountries.com/v3.1/name/${encodeURIComponent(country)}`;

        try {
            const response = await fetch(url);
            if (!response.ok) {
                return message.reply(':x: Ülke bilgisi bulunamadı! Lütfen doğru yazdığınızdan emin olun.');
            }

            const data = await response.json();
            const countryData = data[0];
            const flag = countryData.flags?.png || 'https://via.placeholder.com/150';

            const embed = new MessageEmbed()
                .setColor('#3498db')
                .setTitle(countryData.name.common)
                .setThumbnail(flag)
                .setFooter({ text: `Bilgi isteyen: ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
                .setTimestamp()
                .addFields(
                    { name: '🌍 Yerel İsim', value: `\`\`\`${countryData.translations?.tur?.common || countryData.name.common}\`\`\``, inline: true },
                    { name: '🏛 Başkent', value: `\`\`\`${countryData.capital ? countryData.capital[0] : 'Bilinmiyor'}\`\`\``, inline: true },
                    { name: '📍 Bölge', value: `\`\`\`${countryData.subregion || countryData.region}\`\`\``, inline: true },
                    { name: '💰 Para Birimi', value: `\`\`\`${Object.values(countryData.currencies || {})[0]?.name || 'Bilinmiyor'}\`\`\``, inline: true },
                    { name: '👥 Nüfus', value: `\`\`\`${countryData.population.toLocaleString()}\`\`\``, inline: true },
                    { name: '🗺 Alan', value: `\`\`\`${countryData.area.toLocaleString()} km²\`\`\``, inline: true },
                    { name: '🗣 Konuşulan Diller', value: `\`\`\`${Object.values(countryData.languages || {}).join(', ')}\`\`\`` }
                );

            message.channel.send({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            return message.reply(':x: Bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
        }
    }
};

// Help için ayrı bir bilgi nesnesi ekleyelim
module.exports.help = {
    name: "country",
    description: "Belirttiğiniz ülkenin detaylı bilgilerini gösterir.",
    usage: "country <ülke adı>",
    aliases: ["ülke", "ülkebilgi"]
};
