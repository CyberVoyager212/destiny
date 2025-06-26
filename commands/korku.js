const { MessageEmbed } = require('discord.js');
const fetch = require('node-fetch');
const config = require('../botConfig.js');

exports.help = {
  name: "korkuhikaye",
  description: "Yapay zeka ile rastgele korku hikayesi oluşturur.",
  usage: "k!korkuhikaye",
  example: "k!korkuhikaye"
};

exports.execute = async (client, message, args) => {
  const hikaye = await generateHikaye();

  const embed = new MessageEmbed()
    .setTitle("💀 Korku Hikayesi 📚")
    .setDescription(hikaye)
    .setColor("#ff0000");

  message.channel.send({ embeds: [embed] });
};

async function generateHikaye() {
  try {
    const response = await fetch('https://api.ai21.com/studio/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.AI21_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        "model": "jamba-1.5-large",
        "messages": [
          {
            "role": "system",
            "content": "Sen bir korku hikayesi yazarı ve korkutucu hikayeler yazıyorsun."
          },
          {
            "role": "user",
            "content": "Bana bir korku hikayesi anlat."
          }
        ],
        "n": 1,
        "max_tokens": 1500,
        "temperature": 0.7,
        "top_p": 1,
        "stop": [],
        "response_format": { "type": "text" },
      })
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "Bir hata oluştu, hikaye oluşturulamadı.";
  } catch (error) {
    console.error('Hikaye oluşturma hatası:', error);
    return 'Bir hata oluştu, hikaye oluşturulamadı.';
  }
}
