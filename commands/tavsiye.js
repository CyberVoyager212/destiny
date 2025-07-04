const fetch = require("node-fetch");

exports.help = {
  name: "tavsiye",
  aliases: ["öneri", "advice"],
  usage: "tavsiye <soru veya konu>",
  description: "AI21 yapay zekasından tavsiye veya öneri alırsınız.",
  category: "Eğlence",
  cooldown: 10,
};

async function fetchAdviceFromAI21(apiKey, userInput) {
  const messages = [
    {
      role: "system",
      content:
        "Sen yardımcı, bilgili ve kibar bir tavsiye botusun. Kullanıcının sorusuna veya isteğine uygun, kısa ve net tavsiyeler veriyorsun. Gereksiz uzunluk yapma, direkt tavsiye ver.",
    },
    {
      role: "assistant",
      content: userInput,
    },
  ];

  const response = await fetch(
    "https://api.ai21.com/studio/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
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
  if (!args.length)
    return message.reply(
      "❗ Lütfen bir soru veya tavsiye almak istediğiniz konuyu yazın."
    );

  try {
    const AI21_API_KEY = client.config.AI21_API_KEY;
    if (!AI21_API_KEY) return message.reply("❌ API anahtarınız ayarlanmamış.");

    const userInput = args.join(" ");
    const advice = await fetchAdviceFromAI21(AI21_API_KEY, userInput);

    const embed = {
      title: "💡 Tavsiyeniz",
      description: advice,
      color: "#00CCCC",
      footer: { text: "Destiny v14 Tavsiye Botu" },
      timestamp: new Date(),
    };

    return message.channel.send({ embeds: [embed] });
  } catch (error) {
    console.error(error);
    return message.reply(
      "❌ Tavsiye alınırken bir hata oluştu, lütfen daha sonra tekrar deneyiniz."
    );
  }
};
