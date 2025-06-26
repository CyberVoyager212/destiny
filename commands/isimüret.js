const { MessageEmbed } = require('discord.js');
const fetch = require('node-fetch');
const config = require('../botConfig.js');

exports.help = {
  name: "isimüret",
  description: "Rastgele bir isim oluşturur.",
  usage: "k!isimüret",
  example: "k!isimüret"
};

exports.execute = async (client, message, args) => {
  const isim = await generateYapayZekaIsmi();

  const embed = new MessageEmbed()
    .setTitle("💻 İsim Üretici")
    .setDescription(`İsminiz: **${isim}**`)
    .setColor("#0000ff");

  message.channel.send({ embeds: [embed] });
};

async function generateYapayZekaIsmi() {
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
            "content": "Sen bir isimler üreticisisin. yaratıcı isim üret."
          },
          {
            "role": "user",
            "content": "Yaratıcı bir isim üret ve sadece ismi yaz ekstra bişeye ihtiyacımız yok"
          }
        ],
        "n": 1,
        "max_tokens": 50,
        "temperature": 0.7,
        "top_p": 1,
        "stop": [],
        "response_format": { "type": "text" },
      })
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "Bir hata oluştu, isim alınamadı.";
  } catch (error) {
    console.error('İsim üretme hatası:', error);
    return 'Bir hata oluştu, isim alınamadı.';
  }
}
