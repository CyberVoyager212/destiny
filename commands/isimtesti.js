const fetch = require("node-fetch");
const { MessageEmbed } = require("discord.js");

exports.help = {
  name: "isimtesti",
  aliases: ["isim-anlam", "adtest"],
  usage: "isimtesti <isim>",
  description: "Girilen ismin anlamını yapay zeka ile öğrenir.",
  category: "Eğlence",
  cooldown: 10,
};

async function fetchNameMeaning(name, API_KEY) {
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
              "Kısa ve net isim anlamı veren bir asistansın. Sadece isim anlamını ver, başka yorum yapma.",
          },
          {
            role: "assistant",
            content: `Bana "${name}" isminin anlamını söyle.`,
          },
        ],
        max_tokens: 150,
        temperature: 0.4,
      }),
    }
  );

  const data = await response.json();
  return (
    data?.choices?.[0]?.message?.content?.trim() ||
    "Bu ismin anlamı bulunamadı."
  );
}

exports.execute = async (client, message, args) => {
  const name = args.join(" ");
  if (!name) return message.reply("Lütfen bir isim gir: `k!isimtesti <isim>`");

  try {
    const meaning = await fetchNameMeaning(name, client.config.AI21_API_KEY);

    const embed = new MessageEmbed()
      .setTitle(`📖 "${name}" İsminin Anlamı`)
      .setDescription(meaning)
      .setColor("#4B0082")
      .setTimestamp();

    message.channel.send({ embeds: [embed] });
  } catch (err) {
    console.error(err);
    message.reply("❌ İsim anlamı alınırken bir hata oluştu.");
  }
};
