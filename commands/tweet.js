const { MessageEmbed } = require('discord.js');

exports.execute = async (client, message, args) => {
    const target = message.mentions.users.first() || message.author; // Etiketlenen kullanıcı veya komutu yazan kişi
    const randomStats = [
        "Gaylik", "Pro oyunculuk", "Zeka seviyesi", "Youtuber olma ihtimali", "Güçlü olma oranı", "Çalışkanlık", 
        "Hızlılık", "Tavuk sevgisi", "Şans", "Karizma", "Müzik yeteneği", "Dans yeteneği", "Yazılım bilgisi", 
        "Varlıklı olma oranı", "Dost canlısı olma", "Araba kullanma yeteneği", "Futbol yeteneği", "Sinir seviyen", 
        "Yalnızlık oranı", "En iyi yemek yapan kişi olma oranı", "Bir iş yapma başarı oranı"
    ];

    // Her biri için rastgele % değeri oluşturuluyor
    const stats = randomStats.map(stat => {
        const randomValue = Math.floor(Math.random() * 101); // 0-100 arası rastgele sayı
        return `${stat}: %${randomValue}`;
    }).join("\n");

    // Embed mesajı ile kullanıcıya göster
    const embed = new MessageEmbed()
        .setTitle(`${target.username}'in Özellikleri`)
        .setDescription(stats)
        .setColor('RANDOM');

    message.channel.send({ embeds: [embed] });
};

exports.help = {
    "name": "randomstatus",
    "aliases": ["rastgeleözellikler", "stats","ne-kadar-nesin","nkn","nekadarnesin","nekadarn","nekn","nkadarn","nknesin"],
    "usage": "randomstatus [@kullanıcı]",
    "description": "Kullanıcının rastgele özelliklerini yüzdelik olarak gösterir."
};
