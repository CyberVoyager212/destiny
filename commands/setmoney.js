exports.execute = async (client, message, args) => {
    try {
        // Admin kontrolü
        if (!client.config.admins.includes(message.author.id)) {
            return message.reply("❌ Bu komutu kullanma yetkiniz yok.");
        }

        // Kullanıcıyı al
        let user = message.mentions.users.first();
        if (!user) {
            return message.reply("❌ Lütfen bir kullanıcı belirtin!");
        }

        // Miktar kontrolü
        let amount = args[1];
        if (!amount || isNaN(amount)) {
            return message.reply("❌ Lütfen geçerli bir miktar belirtin.");
        }

        // Para güncellenmesi
        let data = client.eco.setMoney(user.id, parseInt(amount));

        // Başarılı mesaj
        message.channel.send(`✅ **${user.tag}** kullanıcısının bakiyesi başarıyla **${data.after}** olarak güncellendi!`);

    } catch (error) {
        console.error(error);
        message.reply("❌ Bir hata oluştu, lütfen tekrar deneyin.");
    }
};

exports.help = {
        "name": "setmoney",
        "aliases": [
            "setbal"
        ],
        "usage": "setmoney @kullanıcı <miktar>",
        "description": "Belirtilen kullanıcıya belirli para seçer."
};
