exports.execute = async (client, message, args) => {
    // Bot sahibi kontrolü
    if (!client.config.admins.includes(message.author.id)) {
        return message.reply("❌ **Bu komutu kullanmak için yetkiniz yok.**");
    }

    // Etiketlenen kullanıcı kontrolü
    let user = message.mentions.users.first();
    if (!user) {
        return message.reply("⚠️ **Lütfen bir kullanıcı etiketleyin.**");
    }

    // Verilen miktarın geçerli olup olmadığını kontrol et
    let amount = args[1];
    if (!amount || isNaN(amount)) {
        return message.reply("⚠️ **Lütfen geçerli bir miktar belirtin.**");
    }

    // Miktar sıfır veya negatif olamaz
    if (parseInt(amount) <= 0) {
        return message.reply("⚠️ **Miktar sıfır veya negatif olamaz.**");
    }

    try {
        // Para ekleme işlemi
        let data = client.eco.addMoney(user.id, parseInt(amount));

        // Başarılı işlem sonrası mesaj
        return message.channel.send(`✅ **${user.tag}** kullanıcısına **${amount}** <:Destinex:1347644229333028864> başarıyla eklendi! Toplam bakiye: **${data.after} 💰**`);
    } catch (error) {
        console.error(error);
        return message.reply("❌ **Para eklerken bir hata oluştu. Lütfen tekrar deneyin.**");
    }
}

exports.help = {
        "name": "addmoney",
        "aliases": [
            "addbal"
        ],
        "usage": "addmoney @kullanıcı <miktar>",
        "description": "Bir kullanıcıya belirli miktarda para ekler."
};
