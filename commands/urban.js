const { MessageEmbed } = require('discord.js');
const axios = require('axios');

exports.execute = async (client, message, args) => {
    let query = args.join(' ');

    if (!query) {
        return message.reply("❌ **Lütfen aramak istediğiniz kelimeyi girin!**");
    }

    query = encodeURIComponent(query);

    try {
        const { data } = await axios.get(`https://api.urbandictionary.com/v0/define?term=${query}`);

        if (!data.list.length) {
            return message.reply("❌ **Bu kelime için herhangi bir tanım bulunamadı!**");
        }

        const answer = data.list[0];

        const embed = new MessageEmbed()
            .setTitle(answer.word)
            .setURL(answer.permalink)
            .setColor('RANDOM')
            .addFields(
                { name: '📖 Tanım', value: trim(answer.definition) },
                { name: '✍️ Örnek', value: trim(answer.example) },
                { name: '👍 Beğeniler', value: `👍 ${answer.thumbs_up} || 👎 ${answer.thumbs_down}` }
            );

        return message.channel.send({ embeds: [embed] });
    } catch (error) {
        console.error("Urban Dictionary Hata:", error);
        return message.reply("❌ **Bir hata oluştu, lütfen daha sonra tekrar deneyin.**");
    }
};

// Metin uzunluğunu sınırlandıran fonksiyon
function trim(input) {
    return input.length > 1024 ? `${input.slice(0, 1020)} ...` : input;
}

exports.help = {
    "name": "urban",
    "aliases": ["ud", "kelime"],
    "usage": "urban <kelime>",
    "description": "Urban Dictionary'den bir kelimenin tanımını getirir."
};
