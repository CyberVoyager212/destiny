const moment = require("moment-timezone");

// Ödeme Komutu
exports.execute = async (client, message, args) => {
    if (!args[0] || isNaN(args[0]) || parseInt(args[0]) <= 0) {
        return message.reply("⚠️ Lütfen geçerli bir ödeme miktarı girin.");
    }
    
    let userId = message.author.id;
    let paymentAmount = parseInt(args[0]);
    let userBalance = (await client.eco.fetchMoney(userId)).amount;
    let loanData = await client.db.get(`loan_${userId}`) || { amount: 0, time: null };
    let creditScore = (await client.db.get(`credit_${userId}`)) || 100;
    
    if (loanData.amount <= 0) {
        return message.reply("✅ Mevcut bir borcunuz bulunmamaktadır!");
    }
    
    // Faiz hesaplama
    let lastLoanTime = moment(loanData.time);
    let currentTime = moment().tz("Europe/Istanbul");
    let daysPassed = currentTime.diff(lastLoanTime, 'days');
    let interestRate = 0.05; // Günlük %5 faiz
    let totalInterest = Math.floor(loanData.amount * Math.pow(1 + interestRate, daysPassed) - loanData.amount);
    
    if (daysPassed > 0) {
        loanData.amount += totalInterest;
        creditScore -= daysPassed * 2; // Her gün için 2 puan düşsün
    }
    
    paymentAmount = Math.min(paymentAmount, loanData.amount, userBalance);
    let remainingLoan = loanData.amount - paymentAmount;
    await client.eco.removeMoney(userId, paymentAmount);
    
    if (remainingLoan <= 0) {
        await client.db.set(`loan_${userId}`, { amount: 0, time: null });
        let loanDuration = currentTime.diff(lastLoanTime, 'hours');
        
        // Kredi puanı artırma faktörleri
        if (loanDuration < 24 && loanData.amount >= 100000) {
            creditScore += 15;
        } else if (loanDuration < 48) {
            creditScore += 10;
        }
        
        if (paymentAmount >= loanData.amount / 2) { // Büyük miktarda ödeme yaptıysa
            creditScore += 5;
        }
        
        if (daysPassed === 0) { // Aynı gün ödendiyse
            creditScore += 10;
        }
        
        await client.db.set(`credit_${userId}`, creditScore);
        return message.reply(`✅ Borcunuzu tamamen ödediniz! Faiz dahil toplam ödeme: **${paymentAmount + totalInterest}** <:Destinex:1347644229333028864> . Kredi puanınız **${creditScore}** oldu.`);
    } else {
        await client.db.set(`loan_${userId}`, { amount: remainingLoan, time: loanData.time });
        await client.db.set(`credit_${userId}`, creditScore);
        return message.reply(`✅ **${paymentAmount}** <:Destinex:1347644229333028864> ödeme yaptınız. Kalan borcunuz: **${remainingLoan}** <:Destinex:1347644229333028864> . Güncel kredi puanınız: **${creditScore}**.`);
    }
};

exports.help = {
    "name": "ödeme",
    "aliases": [],
    "usage": "ödeme <miktar>",
    "description": "Mevcut borcunuzdan ödeme yaparak bakiyenizden düşersiniz. Ödeme geciktikçe faiz işler ve kredi puanınız düşer." 
};