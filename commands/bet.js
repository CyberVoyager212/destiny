exports.execute = async (client, message, args) => {
    let betAmount = args[0] === 'all' ? (await client.eco.fetchMoney(message.author.id)).amount : parseInt(args[0]);

    if (isNaN(betAmount) || betAmount <= 0) {
        return message.reply("⚠️ Lütfen geçerli bir bahis miktarı girin.");
    }

    betAmount = Math.min(betAmount, 250000);

    let userBalance = await client.eco.fetchMoney(message.author.id);

    if (userBalance.amount < betAmount) {
        return message.reply(`❌ Yeterli paranız yok. Mevcut paranız: **${userBalance.amount}** <:Destinex:1347644229333028864> .`);
    }

    let colorChoice = args[1]?.toLowerCase();
    if (!['kırmızı', 'beyaz', 'siyah'].includes(colorChoice)) {
        return message.reply("⚠️ Lütfen `kırmızı`, `beyaz` veya `siyah` renklerinden birini seçin.");
    }

    const bettingMessage = await message.reply(`🎰 Bahis oynanıyor... **${betAmount}** <:Destinex:1347644229333028864> oynanıyor ve ${colorChoice} topuna bahis yapılıyor...`);

    await new Promise(resolve => setTimeout(resolve, 2000));

    const colors = ['🔴', '⚪', '🔴', '⚪', '🔴', '⚪', '🔴','⚫', '🔴', '⚪', '🔴', '⚪', '🔴', '⚪'];
    let currentColors = [...colors];
    
    let animationSteps = Math.floor(Math.random() * 40) + 1;

    for (let i = 0; i < animationSteps; i++) {
        const whiteBall = currentColors.pop();
        currentColors.unshift(whiteBall);

        const updatedMessage = `🎰 Bahis oynanıyor... **${betAmount}** <:Destinex:1347644229333028864> oynanıyor ve ${colorChoice} topuna bahis yapılıyor...
        \n${currentColors.join(' ')}
        \n⬆️
        \n **Beyaz=2x** | **Kırmızı=2x** | **Siyah=3x**
        \n *Bot arada çarkı çevirmeyi kısa süre durduruyor ama gene dönmeye devam ediyor şimdiden kusura bakmayın iyi oyunlar...*`;

        await bettingMessage.edit(updatedMessage);
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    let firstBall = currentColors[0];
    let resultMessage;
    let multiplier;

    if (firstBall === '⚪' && colorChoice === 'beyaz') {
        multiplier = 2;
        resultMessage = `⚪ Top beyaz geldi! **Tebrikler!** Paranızın **2 katı** kadar kazandınız.`;
    } else if (firstBall === '🔴' && colorChoice === 'kırmızı') {
        multiplier = 2;
        resultMessage = `🔴 Top kırmızı geldi! **Tebrikler!** Paranızın **2 katı** kadar kazandınız.`;
    } else if (firstBall === '⚫' && colorChoice === 'siyah') {
        multiplier = 3;
        resultMessage = `⚫ Top siyah geldi! **Tebrikler!** Paranızın **3 katı** kadar kazandınız.`;
    } else {
        multiplier = 0; 
        resultMessage = `💔 Üzgünüz, top **${firstBall}** geldi. Kaybettiniz.`;
    }

    let winnings = betAmount * multiplier;

    if (multiplier > 0) {
        await client.eco.addMoney(message.author.id, winnings);
        resultMessage += ` Şu an toplamda **${userBalance.amount + winnings}** <:Destinex:1347644229333028864> paranız var.`;
    } else {
        await client.eco.removeMoney(message.author.id, betAmount);
        resultMessage += ` Şu an toplamda **${userBalance.amount - betAmount}** <:Destinex:1347644229333028864> paranız var.`;
    }

    await message.channel.send(resultMessage);
};

exports.help = {
    "name": "bet",
    "aliases": [],
    "usage": "bet <miktar> <renk> veya bet all <renk>",
    "description": "Bahis yapmak için kullanılır. `<miktar>` ile belirli bir miktarda bahis yapılabilir veya `bet all` ile tüm bakiye ile bahis yapılır. Renkler: kırmızı, beyaz, siyah."
};