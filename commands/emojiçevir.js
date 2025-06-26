const config = require("../botConfig.js");
const fetch = require("node-fetch");

module.exports = {
  name: "emojiçevir",
  async execute(client, message, args) {
    if (!args.length) return message.reply("Lütfen bir metin girin.");

    try {
      const userInput = args.join(" ");

      // İlk yapay zeka çağrısı
      let aiResponse = await fetchAI21(userInput);

      // Emoji dışı karakter kontrolü: harf veya rakam varsa
      const nonEmojiRegex = /[A-Za-z0-9]/;
      if (nonEmojiRegex.test(aiResponse)) {
        // Eğer metinde emoji dışında karakterler varsa, yapay zekadan düzeltmesini iste
        const fixPrompt = `Aşağıdaki metni incele. Eğer herhangi bir yazı, harf veya rakam varsa lütfen bunları uygun emojilerle değiştirerek metni sadece emojilerden oluşacak şekilde yeniden çevir:\n\n${aiResponse}`;
        aiResponse = await fetchAI21(fixPrompt);
      }

      await message.channel.send(`${aiResponse}`);
    } catch (error) {
      console.error(error);
      return message.reply("Emoji çeviri başarısız.");
    }
  },
  help: {
    name: "emojiçevir",
    aliases: [],
    usage: "emojiçevir [metin]",
    description: "Metni emojilere dönüştürerek gönderir.",
  },
};

// Yapay zekadan istenen metni almak için ortak fonksiyon
async function fetchAI21(inputText) {
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
            "Kullanıcının verdiği metni yalnızca emojilerle ifade et. Emoji dışında herhangi bir karakter kullanma. Harfler için uygun harf emojilerini kullan (örneğin A ⟶ 🅰️, B ⟶ 🅱️). Sayılar için sayı emojilerini kullan (örneğin 1 ⟶ 1️⃣, 2 ⟶ 2️⃣). Cümleleri anlamlı şekilde emojilere çevir (örneğin 'Merhaba' ⟶ 🖐️😁, 'Nasılsın?' ⟶ 🤔😊).",
        },
        {
          role: "user",
          content: inputText,
        },
      ],
      n: 1,
      max_tokens: 100,
      temperature: 0.7,
    }),
  });
  const data = await response.json();
  return data.choices?.[0]?.message?.content || "Emoji çeviri başarısız.";
}
