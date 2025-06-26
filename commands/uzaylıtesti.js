const { MessageEmbed } = require('discord.js');

exports.help = {
    name: "uzaylıtesti",
    description: "Senin bir uzaylı olup olmadığını analiz eder.",
    usage: "k!uzaylıtesti",
    example: "k!uzaylıtesti"
};

exports.execute = async (client, message, args) => {
    const sonuçlar = [
        "Sen tamamen bir insansın! 👤",
        "Biyolojik olarak insansın ama bazı şüpheli hareketlerin var! 👽🤨",
        "Sen %50 uzaylısın! Belki bir hükümet deneyisin... 🛸",
        "Açıkça bir uzaylısın ama iyi saklanıyorsun! 🛸👀",
        "SEN TAM BİR UZAYLISIN! NEDEN BİZE YALAN SÖYLÜYORSUN?! 👽🚨"
    ];

    const sonuç = sonuçlar[Math.floor(Math.random() * sonuçlar.length)];

    const embed = new MessageEmbed()
        .setTitle("👽 Uzaylı Testi 🛸")
        .setDescription(`${message.author.username}, analiz edildi ve sonuç:\n**${sonuç}**`)
        .setColor("#00ffcc");

    message.channel.send({ embeds: [embed] });
};
