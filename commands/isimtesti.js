const { MessageEmbed } = require('discord.js');
const fetch = require('node-fetch');
const config = require('../botConfig.js');

exports.help = {
  name: "isimtesti",
  description: "Kullanıcının isminin gizli anlamını açıklar.",
  usage: "k!isimtesti [isim]",
  example: "k!isimtesti Ahmet"
};

exports.execute = async (client, message, args) => {
  const isim = args.join(" ");
  if (!isim) {
    return message.reply("Lütfen bir isim girin.");
  }

  const anlam = await generateIsimAnlami(isim);

  const embed = new MessageEmbed()
    .setTitle(`${isim} İsminin Gizli Anlamı`)
    .setDescription(anlam)
    .setColor("#00ff00");

  message.channel.send({ embeds: [embed] });
};

async function generateIsimAnlami(isim) {
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
            "content": "Sen bir isim analisti ve insanların isimlerinin gizli anlamlarını çözüyorsun."
          },
          {
            "role": "user",
            "content": `Bana ${isim} isminin gizli anlamını açıkla. Gerçek bi anlam deil sadece gizemli olsun diye rastgele bişey söyle`
          }
        ],
        "n": 1,
        "max_tokens": 1500,
        "temperature": 0.5,
        "top_p": 1,
        "stop": [],
        "response_format": { "type": "text" },
      })
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "Bir hata oluştu, anlam alınamadı.";
  } catch (error) {
    console.error('İsim analizi hatası:', error);
    return 'Bir hata oluştu, anlam alınamadı.';
  }
}
