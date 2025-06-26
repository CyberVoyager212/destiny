const { MessageEmbed } = require('discord.js');

exports.help = {
    name: "zombi",
    description: "Zombi kıyametinde hayatta kalma şansını hesaplar.",
    usage: "k!zombi",
    example: "k!zombi"
};

exports.execute = async (client, message, args) => {
    const şans = Math.floor(Math.random() * 101); // %0 - %100 arası rastgele sayı
    const yorumlar = [
        "Üzgünüm ama ilk 5 dakikada ısırıldın... 🧟‍♂️",
        "Şansın pek yok, saklanacak yer bulmalısın! 😨",
        "Ortalama bir şansın var, dikkatli ol! ⚠️",
        "Güçlü ve zekisin, bayağı dayanırsın! 🔥",
        "Sen tam bir hayatta kalma ustasısın! 💪"
    ];

    let yorum = "";
    if (şans < 20) yorum = yorumlar[0];
    else if (şans < 40) yorum = yorumlar[1];
    else if (şans < 60) yorum = yorumlar[2];
    else if (şans < 80) yorum = yorumlar[3];
    else yorum = yorumlar[4];

    const embed = new MessageEmbed()
        .setTitle("🧟‍♂️ Zombi Kıyameti Testi 🧟‍♀️")
        .setDescription(`Hayatta kalma şansın: **%${şans}**\n${yorum}`)
        .setColor("#ff0000");

    message.channel.send({ embeds: [embed] });
};
