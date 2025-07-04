const fetch = require("node-fetch");

exports.help = {
  name: "garipbilgi",
  aliases: ["ilginçbilgi", "tuhafbilgi"],
  usage: "garipbilgi",
  description: "Sana ilginç, garip ve tuhaf bir bilgi verir.",
  category: "Eğlence",
  cooldown: 10,
};

async function fetchWeirdFactFromAI21(AI21_API_KEY) {
  const messages = [
    {
      role: "system",
      content:
        "Sen garip, eğlenceli ve tuhaf bilgiler veren bir botsun. Kullanıcıya internette pek bulunmayan, garip veya tuhaf bir bilgi ver. Bilgiyi sade, kısa ve eğlenceli anlat. Sadece bilgi ver, başka şey yazma.",
    },
    {
      role: "user",
      content: "Bana bir garip bilgi ver.",
    },
  ];

  const response = await fetch(
    "https://api.ai21.com/studio/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${AI21_API_KEY}`,
      },
      body: JSON.stringify({
        model: "jamba-large-1.7",
        messages: messages,
        n: 1,
        max_tokens: 4000,
        temperature: 0.7,
        top_p: 1,
        stop: [],
        response_format: { type: "text" },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      `AI21 API isteği başarısız oldu: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();

  if (
    !data.choices ||
    !data.choices[0] ||
    !data.choices[0].message ||
    !data.choices[0].message.content
  ) {
    throw new Error("AI21’den geçerli bir içerik gelmedi.");
  }

  return data.choices[0].message.content.trim();
}

exports.execute = async (client, message, args) => {
  try {
    const AI21_API_KEY = client.config.AI21_API_KEY;

    // Garip bilgiyi AI21 üzerinden al
    const weirdFact = await fetchWeirdFactFromAI21(AI21_API_KEY);

    // Embed ile gönder
    const embed = {
      title: "🤯 Garip Bilgi!",
      description: weirdFact,
      color: "#00CCCC",
      footer: { text: `Destiny v14 Garip Bilgi Botu` },
      timestamp: new Date(),
    };

    return message.channel.send({ embeds: [embed] });
  } catch (error) {
    console.error(error);
    return message.reply(
      "❌ Garip bilgi alınırken bir hata oluştu, lütfen tekrar deneyiniz."
    );
  }
};
