const { MessageEmbed } = require('discord.js');

exports.execute = async (bot, message, args) => {
    let soru = args.join(' '); // Prefix uzunluğu hesaplama hatası düzeltildi

    if (!soru) {
        return message.channel.send("❌ **Bir soru belirtmediniz!**");
    } else {
        let cevaplar = [
            'Belki.',
            'Kesinlikle hayır.',
            'Umarım öyledir.',
            'Bunu hayal bile edemezsin.',
            'Bunun iyi bir ihtimali var.',
            'Oldukça olası.',
            'Sanırım öyle.',
            'Umarım değildir.',
            'Umarım öyledir.',
            'Asla!',
            'Unut gitsin.',
            'Ahaha! Gerçekten mi?!?',
            'Pfft.',
            'Üzgünüm dostum.',
            'Kesinlikle evet.',
            'Kesinlikle hayır.',
            'Gelecek karanlık.',
            'Gelecek belirsiz.',
            'Bunu söylemeyi tercih etmem.',
            'Kimin umurunda?',
            'Muhtemelen.',
            'Asla, asla, asla.',
            'Küçük bir ihtimal var.',
            'Evet!'
        ];

        let cevap = cevaplar[Math.floor(Math.random() * cevaplar.length)];

        let embed = new MessageEmbed()
            .setTitle("777!")
            .setDescription(`**Soru:** ${soru}\n**Cevap:** ${cevap}`)
            .setColor("RANDOM");

        message.channel.send({ embeds: [embed] });
    }
};

exports.help = {
    "name": "777",
    "aliases": ["fal"],
    "usage": "777 <soru>",
    "description": "Sorduğunuz soruya cevap verir. olucak veya olmıcak gibi"
};
