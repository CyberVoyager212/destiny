const { MessageEmbed, MessageActionRow, MessageSelectMenu } = require("discord.js");

exports.execute = async (client, message) => {
    // Kullanıcı bakiyesini kontrol et
    const userBalance = await client.eco.fetchMoney(message.author.id);
    if (userBalance.amount < 10) return message.reply("❌ Bahis oynamak için en az 10 <:Destinex:1347644229333028864> gerekli!");

    // Bahis miktarını al
    const betAmount = await getValidBet(message, userBalance.amount);
    if (!betAmount) return;

    // Bahsi kes
    await client.eco.removeMoney(message.author.id, betAmount);

    // Bahis tipini seç
    const betType = await selectBetType(message);
    if (!betType) return;

    // Bahis detaylarını al
    const betDetails = await getBetDetails(message, betType);
    if (!betDetails) return;

    // Zarları at ve sonucu hesapla
    const { dice, diceSum } = rollDice();
    const result = calculateResult(betType, betDetails, dice, diceSum);

    // Kazancı hesapla ve güncelle
    const winnings = result.win ? Math.floor(betAmount * sicboPayouts[betType]) : 0;
    if (winnings > 0) await client.eco.addMoney(message.author.id, winnings);

    // Sonuçları göster
    showResult(message, betAmount, dice, diceSum, result, winnings);
};

// Yardımcı Fonksiyonlar
async function getValidBet(message, balance) {
    const embed = new MessageEmbed()
        .setTitle("🎲 Sic Bo Bahis")
        .setDescription(`Bahis miktarını gir (10-250,000):\nMevcut bakiye: ${balance.toLocaleString()} <:Destinex:1347644229333028864>`)
        .setColor("BLUE");

    const msg = await message.channel.send({ embeds: [embed] });
    
    try {
        const collected = await message.channel.awaitMessages({
            filter: m => m.author.id === message.author.id,
            max: 1,
            time: 60000,
            errors: ['time']
        });
        
        const input = collected.first().content.toLowerCase();
        const amount = parseBetAmount(input, balance);
        
        if (amount < 10 || amount > 250000) throw new Error('Geçersiz miktar!');
        return amount;
    } catch {
        message.channel.send("⏳ Süre doldu veya geçersiz miktar!");
        return null;
    }
}

// parseBetAmount fonksiyonu
function parseBetAmount(input, balance) {
    const amount = parseInt(input);
    if (isNaN(amount) || amount < 10 || amount > balance) {
        return null;
    }
    return amount;
}

async function selectBetType(message) {
    const row = new MessageActionRow().addComponents(
        new MessageSelectMenu()
            .setCustomId('bet_type')
            .setPlaceholder('Bahis tipini seç')
            .addOptions([
                { label: 'Zar Toplamı', value: 'total' },
                { label: 'Tek/Çift', value: 'parity' },
                { label: 'Kombinasyon', value: 'combination' },
                { label: 'Tek Zar', value: 'single' }
            ])
    );

    const embed = new MessageEmbed()
        .setTitle("Bahis Tipini Seç")
        .setColor("YELLOW");

    const msg = await message.channel.send({ embeds: [embed], components: [row] });
    
    try {
        const interaction = await msg.awaitMessageComponent({ time: 30000 });
        await interaction.deferUpdate();
        return interaction.values[0];
    } catch {
        message.channel.send("⏳ Bahis tipi seçilmedi!");
        return null;
    }
}

async function getBetDetails(message, betType) {
    let betDetails = {};

    if (betType === 'total') {
        const embed = new MessageEmbed()
            .setTitle("Zar Toplamı Bahisi")
            .setDescription("Lütfen 3 ile 18 arasında bir toplam seçin.")
            .setColor("BLUE");

        const msg = await message.channel.send({ embeds: [embed] });

        try {
            const collected = await message.channel.awaitMessages({
                filter: m => m.author.id === message.author.id,
                max: 1,
                time: 30000,
                errors: ['time']
            });

            const total = parseInt(collected.first().content);
            if (total < 3 || total > 18) throw new Error('Geçersiz toplam!');
            betDetails = { total };
        } catch {
            message.channel.send("⏳ Süre doldu veya geçersiz toplam!");
            return null;
        }
    } else if (betType === 'parity') {
        const embed = new MessageEmbed()
            .setTitle("Tek/Çift Bahisi")
            .setDescription("Lütfen 'tek' veya 'çift' seçin.")
            .setColor("BLUE");

        const msg = await message.channel.send({ embeds: [embed] });

        try {
            const collected = await message.channel.awaitMessages({
                filter: m => m.author.id === message.author.id,
                max: 1,
                time: 30000,
                errors: ['time']
            });

            const parity = collected.first().content.toLowerCase();
            if (parity !== 'tek' && parity !== 'çift') throw new Error('Geçersiz seçim!');
            betDetails = { parity: parity === 'tek' ? 'odd' : 'even' };
        } catch {
            message.channel.send("⏳ Süre doldu veya geçersiz seçim!");
            return null;
        }
    } else if (betType === 'combination') {
        const embed = new MessageEmbed()
            .setTitle("Kombinasyon Bahisi")
            .setDescription("Lütfen 2 zar kombinasyonu girin (örneğin: 1-2, 3-4).")
            .setColor("BLUE");

        const msg = await message.channel.send({ embeds: [embed] });

        try {
            const collected = await message.channel.awaitMessages({
                filter: m => m.author.id === message.author.id,
                max: 1,
                time: 30000,
                errors: ['time']
            });

            const combination = collected.first().content.split('-').map(n => parseInt(n));
            if (combination.length !== 2 || combination.some(n => isNaN(n) || n < 1 || n > 6)) throw new Error('Geçersiz kombinasyon!');
            betDetails = { numbers: combination };
        } catch {
            message.channel.send("⏳ Süre doldu veya geçersiz kombinasyon!");
            return null;
        }
    } else if (betType === 'single') {
        const embed = new MessageEmbed()
            .setTitle("Tek Zar Bahisi")
            .setDescription("Lütfen bir zar numarası seçin (1-6).")
            .setColor("BLUE");

        const msg = await message.channel.send({ embeds: [embed] });

        try {
            const collected = await message.channel.awaitMessages({
                filter: m => m.author.id === message.author.id,
                max: 1,
                time: 30000,
                errors: ['time']
            });

            const number = parseInt(collected.first().content);
            if (isNaN(number) || number < 1 || number > 6) throw new Error('Geçersiz zar numarası!');
            betDetails = { number };
        } catch {
            message.channel.send("⏳ Süre doldu veya geçersiz numara!");
            return null;
        }
    }

    return betDetails;
}

function rollDice() {
    const dice = Array.from({ length: 3 }, () => Math.floor(Math.random() * 6) + 1);
    return { dice, diceSum: dice.reduce((a, b) => a + b, 0) };
}

function calculateResult(betType, details, dice, sum) {
    switch(betType) {
        case 'total':
            return { win: details.total === sum };
        case 'parity':
            return { win: details.parity === (sum % 2 === 0 ? 'even' : 'odd') };
        case 'combination':
            return { win: details.numbers.every(num => dice.includes(num)) };
        case 'single':
            return { win: dice.some(d => d === details.number) };
        default:
            return { win: false };
    }
}

const sicboPayouts = {
    total: 1.5,
    parity: 1.8,
    combination: 5,
    single: 3
};

function showResult(message, betAmount, dice, diceSum, result, winnings) {
    const resultEmbed = new MessageEmbed()
        .setTitle("🎲 Sic Bo Sonuçları")
        .setDescription(`Zarlar: ${dice.join(", ")} (Toplam: ${diceSum})\n\n**${result.win ? 'Kazandınız!' : 'Kaybettiniz!'}**\n\n**Kazanç:** ${winnings > 0 ? winnings + " <:Destinex:1347644229333028864>" : "Kaybettiniz!"}`)
        .setColor(result.win ? "GREEN" : "RED");

    message.channel.send({ embeds: [resultEmbed] });
}

module.exports.help = {
    name: "sicbo",
    description: "Gelişmiş Sic Bo oyunu",
    usage: "sicbo"
};
