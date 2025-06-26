exports.execute = async (client, message, args) => {
    let amount = Math.floor(Math.random() * 1000) + 500;

    // Get the author's ID from the message
    let userId = message.author.id;

    try {
        // Call weekly method with the correct user ID
        let addMoney = await client.eco.weekly(userId, amount);

        if (addMoney.onCooldown) {
            // Kullanıcı krediyi daha önce almışsa, zaman bilgisi verelim
            return message.reply(`Haftalık kredinizi zaten aldınız. ${addMoney.time.days} gün, ${addMoney.time.hours} saat, ${addMoney.time.minutes} dakika ve ${addMoney.time.seconds} saniye sonra tekrar alabilirsiniz.`);
        } else {
            // Kullanıcıya krediyi eklediğimizde
            return message.reply(`Haftalık krediniz olarak **${addMoney.amount}** <:Destinex:1347644229333028864> aldınız ve şimdi toplamda **${addMoney.after}** <:Destinex:1347644229333028864> paranız var.`);
        }

    } catch (error) {
        console.error(error);

        // Hata durumunda
        return message.reply("Bir hata oluştu. Lütfen daha sonra tekrar deneyin.");
    }
};

exports.help = {
    name: "weekly",
    aliases: [],
    usage: "weekly",
    description: "Haftalık ödülünüzü almanızı sağlar."
};