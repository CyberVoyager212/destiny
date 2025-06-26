exports.execute = async (client, message, args) => {
    try {
        const user = message.mentions.users.first() || message.author;

        // HuntBot verilerini sıfırlıyoruz
        client.db.set(`cooldownTime_${user.id}`, 1);
        client.db.set(`amountUpgrade_${user.id}`, 1);
        client.db.set(`qualityUpgrade_${user.id}`, 1);
        client.db.set(`cooldownReduction_${user.id}`, 0);
        client.db.set(`costUpgrade_${user.id}`, 1); // Maliyet seviyesi de sıfırlandı

        message.reply(`${user.tag} kullanıcısının HuntBot verileri başarıyla sıfırlandı. ✅`);
    } catch (error) {
        console.error("Hata oluştu:", error);
        message.reply("⚠️ Bir hata oluştu, lütfen tekrar deneyin.");
    }
};

exports.help = {
        "name": "resethuntbot",
        "aliases": [
            "rhb"
        ],
        "usage": "resethuntbot [@kullanıcı]",
        "description": "Huntbot verilerini sıfırlamak için kullanılır."
};
