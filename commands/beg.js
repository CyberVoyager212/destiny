exports.execute = async (client, message, args) => {
    // Kullanıcılar listesi
    let users = [
        "PewDiePie",
        "T-Series",
        "Sans",
        "Zero",
        "Ninja",
        "Jacksepticeye",
        "Markiplier",
        "Dream",
        "Pokimane",
        "Ariana Grande"
    ];

    // Rastgele miktar belirleme
    let amount = Math.floor(Math.random() * 50) + 10;

    // Mesaj yazan kullanıcının ID'sini al
    let userId = message.author.id;

    // Dilenme metodunu çağır
    let beg = await client.eco.beg(userId, amount, { canLose: true });

    // Eğer dilenme süresi dolmamışsa
    if (beg.onCooldown) {
        let timeLeft = beg.time.seconds;
        let minutes = Math.floor(timeLeft / 60);
        let seconds = timeLeft % 60;
        return message.reply(`🚫 **Dilenme süresi henüz dolmadı!** ${minutes} dakika ve ${seconds} saniye sonra tekrar deneyin.`);
    }

    // Eğer dilenme kaybedilmişse
    if (beg.lost) {
        return message.channel.send(`❌ **${users[Math.floor(Math.random() * users.length)]}** dilenme zamanını kaybettiniz. Daha sonra tekrar deneyin.`);
    }

    // Başarıyla dilenildiğinde
    return message.reply(`🎉 **${users[Math.floor(Math.random() * users.length)]}** size **${beg.amount}** <:Destinex:1347644229333028864> bağışladı! Şu anda toplamda **${beg.after}** <:Destinex:1347644229333028864> paranız var.`);
};

exports.help = {
        "name": "beg",
        "aliases": [],
        "usage": "beg",
        "description": "Yardım dilenmek için kullanılır. Kullanıcılar bir miktar para kazanabilir."
};
