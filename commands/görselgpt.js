const axios = require("axios");

exports.execute = async (client, message, args) => {
    const userId = message.author.id;
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000; // 24 saat

    // Kullanıcının daha önce komutu kullanıp kullanmadığını kontrol et
    const lastUsage = await client.db.get(`gorselgpt_${userId}`);
    if (lastUsage && now - lastUsage < oneDay) {
        const remainingTime = Math.ceil((oneDay - (now - lastUsage)) / (1000 * 60));
        return message.reply(`❌ Bu komutu günde sadece bir kere kullanabilirsiniz.\nLütfen **${remainingTime} dakika** sonra tekrar deneyin.`);
    }

    if (!args.length) {
        return message.reply("❌ **Lütfen bir açıklama (prompt) girin!**\n📌 Örnek kullanım: `k!görselgpt büyülü bir orman`");
    }

    const prompt = args.join(" ");
    const apiKeys = "b3d5602ff65d495195fff6e2fa793c6e"; // API anahtarları dizisi
    let currentApiKeyIndex = 0; // Varsayılan olarak ilk API anahtarını kullan

    if (!apiKeys || apiKeys.length === 0) {
        return message.reply("⚠️ **AIML API anahtarı bulunamadı!**\nLütfen bot yöneticisine başvurun.");
    }

    try {
        await message.reply(`⏳ **Görsel oluşturuluyor...**\n🎨 *Prompt:* \`${prompt}\`\nLütfen bekleyin...`);

        // API isteği yap
        const response = await axios.post(
            "https://api.aimlapi.com/v1/generate/async",
            {
                model: "dall-e-3",
                prompt: prompt,
                steps: 30,    // Adım sayısı
                width: 512,   // Görsel genişliği
                height: 512,  // Görsel yüksekliği
                n: 1          // Oluşturulacak görsel sayısı
            },
            {
                headers: {
                    "Authorization": `Bearer ${apiKeys[currentApiKeyIndex]}`,
                    "Content-Type": "application/json"
                }
            }
        );

        const taskId = response.data.id;
        if (!taskId) throw new Error("API yanıtında görev kimliği (ID) bulunamadı!");

        let result = null;
        let retries = 0;
        const maxRetries = 12; // Maksimum 12 kez sorgu yap (toplam 2 dakika)

        while (!result && retries < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 10000)); // 10 saniye bekle
            retries++;

            const statusResponse = await axios.get(
                `https://api.aimlapi.com/v1/generate/status/${taskId}`,
                { headers: { "Authorization": `Bearer ${apiKeys[currentApiKeyIndex]}` } }
            );

            if (statusResponse.data.done) {
                result = statusResponse.data.generations[0];
            }
        }

        if (result && result.img) {
            // Kullanıcının günlük kullanımını kaydet
            await client.db.set(`gorselgpt_${userId}`, now);

            // Embed mesajı ile görseli gönder
            const embed = {
                color: 0x0099ff,
                title: "Görsel Oluşturuldu!",
                description: `🎨 *Prompt:* \`${prompt}\``,
                image: {
                    url: result.img
                }
            };

            return message.reply({ embeds: [embed] });
        } else {
            throw new Error("Görsel oluşturulamadı veya API zaman aşımına uğradı.");
        }
    } catch (error) {
        console.error(`[HATA]: Görsel oluşturma başarısız - ${error.message}`);
        return message.reply("❌ **Görsel oluşturulurken bir hata oluştu!**\nLütfen daha sonra tekrar deneyin.");
    }
};

exports.help = {
    name: "görselgpt",
    aliases: ["görsel"],
    usage: "görselgpt <açıklama>",
    description: "Verilen açıklama ile AIML API kullanarak görsel oluşturur. (Günde 1 kullanım)",
};
