const { MessageEmbed, Permissions } = require("discord.js");

exports.execute = async (client, message, args) => {
    // Yetki kontrolü
    if (!message.member.permissions.has(Permissions.FLAGS.MANAGE_MESSAGES)) {
        return message.reply("🚫 Bu komutu kullanmak için **'Mesajları Yönet'** yetkiniz olmalı!");
    }

    // Kanal kontrolü
    const channelMention = message.mentions.channels.first();
    if (!channelMention) {
        return message.reply("ℹ️ **Lütfen embed mesajının gönderileceği kanalı etiketleyin!**");
    }

    const filter = response => response.author.id === message.author.id;
    
    try {
        // Kullanıcıdan başlık alımı
        await message.channel.send("📝 **Lütfen embed için bir başlık girin.** _(İptal etmek için 'iptal' yazın)_");
        const titleResponse = await message.channel.awaitMessages({ filter, max: 1, time: 30000, errors: ['time'] });
        const title = titleResponse.first().content;
        if (title.toLowerCase() === 'iptal') return message.channel.send("❌ **Embed oluşturma işlemi iptal edildi.**");

        // Kullanıcıdan açıklama alımı
        await message.channel.send("📖 **Lütfen embed için bir açıklama girin.** _(İptal etmek için 'iptal' yazın)_");
        const descriptionResponse = await message.channel.awaitMessages({ filter, max: 1, time: 30000, errors: ['time'] });
        const description = descriptionResponse.first().content;
        if (description.toLowerCase() === 'iptal') return message.channel.send("❌ **Embed oluşturma işlemi iptal edildi.**");

        // Rastgele renk oluşturma
        const randomColor = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;

        // Embed oluşturma
        const embed = new MessageEmbed()
            .setTitle(title)
            .setDescription(description)
            .setColor(randomColor)
            .setTimestamp()
            .setFooter(`Oluşturan: ${message.author.tag}`, message.author.displayAvatarURL({ dynamic: true }));

        // Embed belirtilen kanala gönderilir
        await channelMention.send({ embeds: [embed] });
        await message.channel.send(`✅ **Embed başarıyla** ${channelMention} **kanalına gönderildi!**`);

    } catch (error) {
        console.error("Embed oluşturma hatası:", error);
        return message.reply("❌ **Embed oluşturma sırasında bir hata oluştu veya zaman aşımı oldu!** ⏳");
    }
};

exports.help = {
        "name": "embed",
        "aliases": [
            "embedyap",
            "embedolustur"
        ],
        "usage": "k!embed #kanal",
        "description": "Verilen kanalda bir embed mesajı oluşturur."
};
