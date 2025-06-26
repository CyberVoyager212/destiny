const { MessageEmbed } = require('discord.js');
const fetch = require('node-fetch');

exports.execute = async (client, message, args) => {
    try {
        const res = await fetch("https://meme-api.com/gimme");
        const meme = await res.json();

        if (!meme || !meme.url) {
            return message.channel.send("❌ **Meme bulunamadı! Lütfen tekrar deneyin.**");
        }

        const embed = new MessageEmbed()
            .setTitle(meme.title || "Meme")
            .setURL(meme.postLink || "")
            .setColor("RANDOM")
            .setImage(meme.url)
            .setFooter({ text: `👍 ${meme.ups || 0} || 💬 ${meme.comment || 0}` });

        message.channel.send({ embeds: [embed] });
    } catch (error) {
        console.error("Meme alma hatası:", error);
        return message.channel.send("❌ **Bir hata oluştu, lütfen daha sonra tekrar deneyin.**");
    }
};

exports.help = {
    "name": "komik", // Alternatif isim: caps, guldur, mizah
    "aliases": ["caps", "guldur", "mizah"],
    "usage": "komik",
    "description": "Rastgele bir meme gönderir."
};
