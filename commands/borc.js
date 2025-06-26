const moment = require("moment-timezone");

exports.execute = async (client, message, args) => {
    if (!args[0] || isNaN(args[0]) || parseInt(args[0]) <= 0) {
        return message.reply("⚠️ Lütfen geçerli bir miktar girin.");
    }
    
    let userId = message.author.id;
    let borrowAmount = parseInt(args[0]);
    let userCredit = (await client.db.get(`credit_${userId}`)) || 100;
    let existingLoan = await client.db.get(`loan_${userId}`) || { amount: 0, time: null };
    let maxLoan = userCredit * 1000;
    
    if (existingLoan.amount > 0) {
        return message.reply("❌ Önce mevcut borcunuzu ödemelisiniz!");
    }
    
    if (borrowAmount > maxLoan) {
        return message.reply(`⚠️ Maksimum çekebileceğiniz miktar **${maxLoan}** <:Destinex:1347644229333028864> .`);
    }
    
    await client.db.set(`loan_${userId}`, { amount: borrowAmount, time: moment().tz("Europe/Istanbul").format() });
    await client.eco.addMoney(userId, borrowAmount);
    
    let creditScore = userCredit;
    if (borrowAmount >= 50000) {
        creditScore -= 5;
    } else if (borrowAmount >= 100000) {
        creditScore -= 10;
    }
    
    await client.db.set(`credit_${userId}`, creditScore);
    return message.reply(`✅ **${borrowAmount}** <:Destinex:1347644229333028864> borç aldınız. Kredi puanınız şimdi **${creditScore}**. Borcunuzu zamanında ödemeye dikkat edin 5 gün içinde ödenmeyen borçlar yüzünden bot kullanımınız kapanabilir!`);
};

exports.help = {
    "name": "paraçek",
    "aliases": [],
    "usage": "paraçek <miktar>",
    "description": "Borç alarak bakiyenizi artırırsınız. Kredi puanınıza bağlı olarak maksimum çekebileceğiniz miktar değişir."
};