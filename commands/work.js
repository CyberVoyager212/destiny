exports.execute = async (client, message, args) => {
    let amount = Math.floor(Math.random() * 1500) + 1000;
    
    // Kullanıcının Discord kimliğini al
    let userId = message.author.id;

    try {
        // client.eco.work metoduna geçerli kullanıcı kimliği ve miktarı sağla
        let work = await client.eco.work(userId, amount);

        if (work.onCooldown) {
            // Kullanıcı çalışmaya devam edemezse, kaldığı süreyi belirt
            return message.reply(`Şu anda yorgunsunuz. Yeniden çalışmak için ${work.time.minutes} dakika ve ${work.time.seconds} saniye sonra tekrar gelin.`);
        } else {
            // Kullanıcı başarıyla çalıştıysa, kazancını ve toplam parasını göster
            return message.reply(`**${work.workedAs}** olarak çalıştınız ve **${work.amount}** <:Destinex:1347644229333028864> kazandınız. Şimdi toplamda **${work.after}** <:Destinex:1347644229333028864> paranız var.`);
        }

    } catch (error) {
        console.error(error);

        // Hata durumunda kullanıcıya mesaj gönder
        return message.reply("Bir hata oluştu. Lütfen tekrar deneyin.");
    }
};

exports.help = {
    name: "work",
    aliases: [],
    usage: "work",
    description: "Çalışarak belirli bir miktar para kazanırsınız."
};
