const fetch = require("node-fetch");
const { MessageEmbed } = require("discord.js");

exports.help = {
  name: "korkuhikayesi",
  aliases: ["korku", "horror"],
  usage: "korkuhikayesi",
  description: "Yapay zeka tarafından kısa bir korku hikayesi anlatır.",
  category: "Eğlence",
  cooldown: 20,
};

async function getHorrorStory(API_KEY) {
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
              "Kısa, ürkütücü ve akılda kalıcı bir korku hikayesi yaz. Fazla uzun olmasın, maksimum 5-6 cümle. Sadece hikayeyi yaz, başka bir şey ekleme.",
          },
          {
            role: "assistant",
            content: "Bana korku hikayesi anlat.",
          },
        ],
        max_tokens: 4000,
        temperature: 0.8,
      }),
    }
  );

  const data = await response.json();
  return (
    data?.choices?.[0]?.message?.content?.trim() ||
    "Karanlıkta bir ses duydum, ama sesin sahibi yoktu..."
  );
}

exports.execute = async (client, message, args) => {
  try {
    const story = await getHorrorStory(client.config.AI21_API_KEY);

    const embed = new MessageEmbed()
      .setTitle("👻 Korku Hikayesi")
      .setDescription(story)
      .setColor("#8B0000")
      .setTimestamp();

    message.channel.send({ embeds: [embed] });
  } catch (err) {
    console.error(err);
    message.reply("❌ Korku hikayesi alınırken bir hata oluştu.");
  }
};
