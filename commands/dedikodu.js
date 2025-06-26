const fetch = require("node-fetch");
const config = require("../botConfig.js");

module.exports = {
  name: "dedikodu",
  async execute(client, message, args) {
    try {
      // 🎭 **1. AI21'e İlk İstek: Dedikodu Üret**
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
                "Kullanıcı için eğlenceli bir dedikodu uydur. Dedikodu mantıklı, ilginç ve komik olsun. Bir kişinin yaptığı bilinmeyen bir şeyi açığa çıkarıyormuş gibi olabilir veya birine şaka yollu iftira atabilirsin. Örneğin: 'Duydun mu? Biri gece gizlice sunucunun rollerini değiştirmiş!' veya 'Ali aslında pizzanın ananaslı halini seviyormuş, ama kimseye söylemiyormuş!' gibi. **Sadece dedikoduyu yaz, başka açıklama ekleme.**",
            },
            {
              role: "user",
              content: "Bana eğlenceli bir dedikodu uydur.",
            },
          ],
          n: 1,
          max_tokens: 100,
          temperature: 0.8,
        }),
      });

      const data = await response.json();
      let dedikodu = data.choices?.[0]?.message?.content || "Dedikodu üretilemedi.";

      // 🎭 **2. AI21'e İkinci İstek: Dedikoduda İsim Var mı?**
      const checkNameResponse = await fetch("https://api.ai21.com/studio/v1/chat/completions", {
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
                "Sana bir cümle vereceğim. Eğer cümlede bir insan ismi geçiyorsa, sadece ismi söyle. Eğer isim yoksa sadece 'YOK' yaz.",
            },
            {
              role: "user",
              content: `Bu cümlede isim var mı? Eğer varsa, sadece ismi yaz: "${dedikodu}"`,
            },
          ],
          n: 1,
          max_tokens: 10,
          temperature: 0.3,
        }),
      });

      const nameData = await checkNameResponse.json();
      const detectedName = nameData.choices?.[0]?.message?.content.trim() || "YOK";

      // 🎭 **3. Dedikoduda İsim Varsa, Sunucudan Rastgele Kullanıcı Adı Seç**
      if (detectedName !== "YOK") {
        const members = message.guild.members.cache
          .filter((m) => !m.user.bot)
          .map((m) => m.displayName);

        if (members.length > 0) {
          const randomUser = members[Math.floor(Math.random() * members.length)];
          dedikodu = dedikodu.replace(new RegExp(`\\b${detectedName}\\b `, "g"), randomUser );
        }
      }

      // 🎭 **4. Dedikoduyu Mesaj Olarak Gönder**
      await message.channel.send(`🗣 **Dedikodu:** ${dedikodu}`);
    } catch (error) {
      console.error(error);
      return message.reply("Dedikodu üretilemedi.");
    }
  },
  help: {
    name: "dedikodu",
    aliases: [],
    usage: "dedikodu",
    description: "Sunucu için rastgele dedikodular üretir.",
  },
};
