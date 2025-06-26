module.exports.execute = async (client, message, args) => {
    try {
        let amount = Math.floor(Math.random() * 500) + 100;
        let userId = message.author.id;

        // Günlük ödül kontrolü
        let addMoney = client.eco.daily(userId, amount);

        if (addMoney.onCooldown) {
            return message.reply(`⏳ **Günlük ödülünü zaten aldın!**\n🕒 **Tekrar alabilmen için:** \`${addMoney.time.hours} saat, ${addMoney.time.minutes} dakika, ${addMoney.time.seconds} saniye\` beklemelisin.`);
        } else {
            return message.reply(`💰 **Günlük ödülünü aldın!**\n <:Destinex:1347644229333028864> **Miktar:** \`${addMoney.amount}\`\n📈 **Toplam paran:** \`${addMoney.after}\``);
        }
    } catch (error) {
        console.error("⚠️ Hata:", error);
        return message.reply("❌ **Bir hata oluştu, lütfen tekrar deneyin!**");
    }
};

module.exports.help = {
    name: "daily",
    aliases: [],
    usage: "daily",
    description: "Günlük para ödülü alırsınız."
};
