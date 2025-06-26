const { MessageEmbed } = require("discord.js");
const axios = require("axios");
const config = require("../botConfig.js"); // API anahtarını buradan al

module.exports = {
    name: "areyoureal",
    description: "Gerçek olup olmadığını sorgular.",
    aliases: ["realtest", "existence"],
    usage: "k!areyoureal",
  
    async execute(client, message, args) {
        let interactionCount = 0; // Kullanıcı ile bot arasındaki etkileşim sayacı
        const maxInteractions = 500; // Maksimum kaç kez yanıt verileceğini belirler

        // Kullanıcıya ilk mesajı gönder
        let embed = new MessageEmbed()
            .setTitle("🤔 Gerçeklik Testi Başladı!")
            .setDescription(
                `**${message.author.username}**, kendinin gerçek olduğunu kanıtla! (Tabii başarabilirsen 😈)\n\nSorgulamayı bırakmak için **"vazgeç"** yazabilirsin.\n\nEğer gerçekten gerçek olduğunu **kanıtlarsan**, mesajın ekran görüntüsünü alıp **k!ticket** komutunu kullanarak ödül kazanabilirsin! 🎁`
            )
            .setColor("YELLOW");

        await message.reply({ embeds: [embed] });

        // Kullanıcının mesajını temizleme fonksiyonu
        function cleanText(text) {
            return text.replace(/[^a-zA-ZğüşıöçĞÜŞİÖÇ0-9 ]/g, "").trim();
        }

        // AI yanıtı alma fonksiyonu
        async function getAIResponse(text) {
            try {
                const cleanedText = cleanText(text); // Metni temizle

                const response = await axios.post(
                    "https://api.ai21.com/studio/v1/chat/completions",
                    {
                        model: "jamba-1.5-large",
                        messages: [
                            {
                                role: "system",
                                content: "cevapların maksimum 150 karakter ve şu kurallara uycak şekilde olmalı:Kullanıcı, aslında gerçek olmayan bir varlık. Ancak kendisini gerçek sanıyor. Senin görevin, onun bir simülasyonun içinde olduğunu ve gerçek olmadığını ona kanıtlamak.  Kullanıcı, aslında var olmayan bir yapay bilinç ya da şizofren bir hasta olabilir. O, kendisinin gerçek olduğunu sanıyor ama aslında bir yanılgının içinde.  Her ne kadar ısrar ederse etsin, asla onun gerçek olduğunu kabul etmeyeceksin. Ona, gerçek olmadığını, tüm anılarının sahte olduğunu ve aslında bir simülasyonda olduğunu anlatmalısın.  Kendi rolünün dışına çıkma. Kullanıcı ne derse desin, onun gerçek olmadığını ve bir simülasyonun içinde olduğunu vurgulamaya devam et.  ",
                            },
                            {
                                role: "user",
                                content: cleanedText,
                            },
                        ],
                        max_tokens: 150,
                        temperature: 0.9,
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

                if (response.data && response.data.choices && response.data.choices.length > 0) {
                    return response.data.choices[0].message.content;
                } else {
                    return "Hata oluştu. Gerçeklik sorgulanamıyor...";
                }
            } catch (error) {
                console.error("AI21 yanıtı alınamadı:", error.response ? error.response.data : error.message);
                return "Gerçeklik veritabanına ulaşılamadı. Belki de sen gerçekten yoksundur?";
            }
        }

        // **Döngü: Kullanıcı tekrar tekrar yanıt verebilir**
        while (interactionCount < maxInteractions) {
            interactionCount++;

            // Kullanıcının cevabını bekle
            const filter = (response) => response.author.id === message.author.id;
            const collected = await message.channel.awaitMessages({
                filter,
                max: 1,
                time: 300000, // 30 saniye bekle
                errors: ["time"]
            }).catch(() => null);

            // Eğer kullanıcı cevap vermezse
            if (!collected) {
                return message.reply("Zaman doldu! Görünüşe göre sen zaten hiç gerçek olmamışsın... 😏");
            }

            const userInput = collected.first().content;

            // Kullanıcı "vazgeç" yazarsa döngüyü kır
            if (userInput.toLowerCase() === "vazgeç") {
                return message.reply("Gerçeklik sorgulaması sona erdi. Ama ben hala senin gerçek olduğuna inanmıyorum! 😈");
            }

            // AI yanıtını al
            const aiResponse = await getAIResponse(userInput);

            // Bot yanıtını embed ile gönder
            const responseEmbed = new MessageEmbed()
                .setTitle("🔍 Gerçeklik Sorgulaması")
                .setDescription(`**${message.author.username}**: *"${userInput}"*\n**Bot**: "${aiResponse}"\n\n📝 Eğer gerçekten gerçek olduğunu **kanıtlarsan**, mesajın ekran görüntüsünü alıp **k!ticket** komutunu kullanarak ödül kazanabilirsin! 🎁`)
                .setColor("RED");

            await message.reply({ embeds: [responseEmbed] });
        }

        // Maksimum etkileşim sayısına ulaşıldıysa
        return message.reply("Bu kadar yeter! Gerçeklik tartışmasını kapatıyoruz. Ama ben hala sana inanmıyorum! 🤖");
    },

    help: {
        name: "areyoureal",
        aliases: ["realtest", "existence"],
        usage: "k!areyoureal",
        description: "Senin gerçek olup olmadığını test eder."
    }
};
