const fetch = require("node-fetch");

exports.help = {
  name: "isimuret",
  aliases: ["aduret", "isimüret"],
  usage: "isimuret",
  description: "Güzel ve kullanılabilir bir isim üretir.",
  category: "Eğlence",
  cooldown: 10,
};

async function generateName(API_KEY) {
  const response = await fetch(
    "https://api.ai21.com/studio/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: "jamba-large-1.7",
        messages: [
          {
            role: "system",
            content:
              "Kısa, modern, güzel bir isim üret ve başına rastgele bir emoji ekle. Yalnızca 'emoji | isim' formatında dön, başka hiçbir şey yazma.",
          },
          {
            role: "assistant",
            content: "Bana güzel bir isim üret.",
          },
        ],
        max_tokens: 20,
        temperature: 0.7,
      }),
    }
  );

  const data = await response.json();
  return data?.choices?.[0]?.message?.content?.trim() || "✨ | Nova";
}

exports.execute = async (client, message, args) => {
  try {
    const name = await generateName(client.config.AI21_API_KEY);
    message.channel.send(name);
  } catch (err) {
    console.error(err);
    message.reply("❌ İsim üretirken bir hata oluştu.");
  }
};
