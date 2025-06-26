const config = require("../botConfig.js");
const fetch = require("node-fetch");

module.exports = {
  name: "rozet",
  async execute(client, message, args) {
    try {
      const response = await fetch("https://api.ai21.com/studio/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.AI21_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "jamba-1.5-large",
          messages: [
            {
              role: "system",
              content:
                "Kullanıcıya rastgele bir rozet ismi öner. Rozet isimleri komik, başarılı, aşağılayıcı veya yakıştırmacı olabilir. Sadece rozet ismini ver ve şu formatı kullan: '🔱 | Efsane Oyuncu' veya '🤡 | Oyun Kaybedeni'. Cevaplarında sadece rozet ismi olmalı, başka bir şey yazma.",
            },
            {
              role: "user",
              content: "Bana rastgele bir rozet ismi öner.",
            },
          ],
          n: 1,
          max_tokens: 60,
          temperature: 0.8,
        }),
      });

      const data = await response.json();
      const ai21Response = data.choices?.[0]?.message?.content || "Rozet bulunamadı.";

      await message.reply(`**${ai21Response}**`);
    } catch (error) {
      console.error(error);
      return message.reply("Rozet oluşturulamadı.");
    }
  },
  help: {
    name: "rozet",
    aliases: [],
    usage: "rozet",
    description: "Yapay zeka tarafından rastgele bir rozet verilir.",
  },
};
