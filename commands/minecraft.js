const Discord = require('discord.js');

module.exports = {
  config: {
    name: 'minecraft',
    description: 'Minecraft tarzında bir başarı (achievement) resmi oluşturur.',
    aliases: ['mc'],
    usage: 'minecraft <metin1> ; <metin2>',
  },

  execute: async (client, message, args) => {
    const text = args.join(" ").split(";");

    if (text.length !== 2) {
      return message.channel.send('Lütfen metni ";" ile ikiye ayırın.');
    }

    const text1 = encodeURIComponent(text[0].trim()); // İlk metin
    const text2 = encodeURIComponent(text[1].trim()); // İkinci metin

    const randomNum = Math.floor(Math.random() * 21) + 10; // 10 ile 30 arasında sayı

    const imageUrl = `https://skinmc.net/achievement/${randomNum}/${text1}/${text2}`;

    let embed = new Discord.MessageEmbed()
      .setTitle('Achievement unlocked!')
      .setImage(imageUrl)
      .setColor('RANDOM')
      .setFooter({ text: 'Minecraft Achievement' });

    message.channel.send({ embeds: [embed] });
  },

  help: {
    name: 'minecraft',
    description: 'Minecraft başarı resmi oluşturur. Metinleri ";" ile ayırarak yazmalısınız.',
    usage: 'minecraft <metin1> ; <metin2>',
    examples: ['minecraft Level Up ; Yeni Başarı', 'minecraft Winner ; Tebrikler!']
  }
};
