const { MessageEmbed } = require('discord.js');
const fetch = require('node-fetch');
const config = require('../botConfig.js');

exports.help = {
  name: "garipbilgi",
  description: "İlginç bir bilgi alır ve kullanıcıya sunar.",
  usage: "k!garipbilgi",
  example: "k!garipbilgi"
};

exports.execute = async (client, message, args) => {
  const bilgi = await generateGaripBilgi();

  const embed = new MessageEmbed()
    .setTitle("🤯 İlginç Bilgi")
    .setDescription(bilgi)
    .setColor("#ff6600");

  message.channel.send({ embeds: [embed] });
};

async function generateGaripBilgi() {
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
            "content": "Sen bir bilgi uzmanısın ve ilginç, şaşırtıcı, garip bilgiler sağlıyorsun."
          },
          {
            "role": "user",
            "content": "Bana ilginç bir bilgi verir misin? kısa olsun lütfen"
          }
        ],
        "n": 1,
        "max_tokens": 500,
        "temperature": 0.7,
        "top_p": 1,
        "stop": [],
        "response_format": { "type": "text" },
      })
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "Bir hata oluştu, bilgi alınamadı.";
  } catch (error) {
    console.error('Garip bilgi alma hatası:', error);
    return 'Bir hata oluştu, bilgi alınamadı.';
  }
}
