const fetch = require("node-fetch");

exports.help = {
  name: "emojiçevir",
  aliases: ["emojify"],
  usage: "emojiçevir <metin>",
  description:
    "Verilen metni yapay zeka ile sadece emojilerden oluşacak şekilde çevirir.",
  category: "Eğlence",
  cooldown: 10, // saniye
};

async function fetchAI21(API_KEY, inputText) {
  const response = await fetch(
    "https://api.ai21.com/studio/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "jamba-large-1.7",
        messages: [
          {
            role: "user",
            content:
              'Kullanıcının verdiği metni yalnızca emojilerle ifade et. "merhaba" kelimesi geçiyorsa bunu "🫡" emojisi ile değiştir.',
          },
          {
            role: "user",
            content: inputText,
          },
        ],
        max_tokens: 100,
        temperature: 0.7,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`API Hatası: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content || "Emoji çeviri başarısız.";
}

exports.execute = async (client, message, args) => {
  if (!args.length) return message.reply("❌ Lütfen çevirilecek metni girin.");

  const inputText = args.join(" ");

  try {
    let aiResponse = await fetchAI21(client.config.AI21_API_KEY, inputText);

    // Eğer yanıt hala harf veya sayı içeriyorsa düzeltme iste
    if (/[A-Za-z0-9]/.test(aiResponse)) {
      const fixPrompt = `Aşağıdaki metni sadece emojilerle ifade et. Harf veya sayı varsa uygun emojilerle değiştir:\n\n${aiResponse}`;
      aiResponse = await fetchAI21(client.config.AI21_API_KEY, fixPrompt);
    }

    return message.channel.send(aiResponse);
  } catch (error) {
    console.error("Emoji çeviri hatası:", error);
    return message.reply(
      "❌ Emoji çeviri başarısız oldu, lütfen daha sonra tekrar deneyin."
    );
  }
};
