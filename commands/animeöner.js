const { MessageEmbed } = require('discord.js');
const axios = require('axios');
const config = require('../botConfig.js'); // API anahtarı için botConfig.js dosyası

module.exports = {
    name: 'animeöner',
    description: 'AI destekli rastgele bir anime önerir. Opsiyonel olarak tür seçebilirsiniz.',
    aliases: ['anime', 'animeoner'],
    usage: 'k!animeöner [tür]',

    async execute(client, message, args) {
        // Opsiyonel olarak tür belirlenmesi
        const genre = args.join(" ");
        let aiPrompt = "";
        if (genre) {
            aiPrompt = `Bana rastgele popüler ${genre} türünde bir anime öner ve kısaca tanıt. Sadece anime ismi ve açıklama ver. Önerdiğin anime daha önce önerilmemiş olsun.`;
        } else {
            aiPrompt = "Bana rastgele popüler bir anime öner ve kısaca tanıt. Sadece anime ismi ve açıklama ver. Önerdiğin anime daha önce önerilmemiş olsun.";
        }

        let aiResponse = await getAIAnimeRecommendation(aiPrompt);

        if (!aiResponse) {
            return message.reply('❌ Yapay zeka şu anda cevap veremiyor, lütfen tekrar deneyin.');
        }

        const embed = new MessageEmbed()
            .setTitle('📺 AI Destekli Anime Önerisi')
            .setDescription(aiResponse)
            .setColor('RANDOM');

        message.channel.send({ embeds: [embed] });
    },

    help: {
        name: 'animeöner',
        description: 'AI destekli rastgele bir anime önerir. Opsiyonel olarak tür seçebilirsiniz.',
        aliases: ['anime', 'animeoner'],
        usage: 'k!animeöner [tür]'
    }
};

// Yapay zekadan anime önerisi almak için fonksiyon
async function getAIAnimeRecommendation(text) {
    try {
        const response = await axios.post(
            "https://api.ai21.com/studio/v1/chat/completions",
            {
                model: "jamba-1.5-large",
                messages: [
                    { role: "system", content: "Sen bir yapay zeka asistansın ve yalnızca Türkçe anime önerileri yapacaksın." },
                    { role: "user", content: text }
                ],
                max_tokens: 256,
                temperature: 0.7,
                top_p: 1,
                n: 1,
            },
            {
                headers: {
                    Authorization: `Bearer ${config.AI21_API_KEY}`,
                    "Content-Type": "application/json",
                },
            }
        );

        return response.data?.choices?.[0]?.message?.content || "Bilinmeyen bir hata oluştu.";
    } catch (error) {
        console.error("AI21 yanıtı alınamadı:", error.response ? error.response.data : error.message);
        return null;
    }
};
