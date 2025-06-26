const { MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");

// Big Six Wheel Segmentleri, Ödeme Oranları ve Olasılıkları (placeholder %0)
const wheelSegments = [
    { label: '⚀', payout: 1, chance: '%70' },
    { label: '⚁', payout: 2, chance: '%50' },
    { label: '⚂', payout: 5, chance: '%40' },
    { label: '⚃', payout: 10, chance: '%30' },
    { label: '⚄', payout: 20, chance: '%20' },
    { label: '⚅', payout: 50, chance: '%10' },
    { label: '$', payout: 100, chance: '%5' }
];

// Buton customId değerlerini bahis simgelerine eşleyelim
const betMapping = {
    '1x': '⚀',
    '2x': '⚁',
    '5x': '⚂',
    '10x': '⚃',
    '20x': '⚄',
    '50x': '⚅',
    '100x': '$'
};

exports.execute = async (client, message) => {
    // Kullanıcı bakiyesini kontrol et
    const userBalance = await client.eco.fetchMoney(message.author.id);
    if (userBalance.amount < 10)
        return message.reply("❌ Bahis oynamak için en az 10 <:Destinex:1347644229333028864> gerekli!");

    // Bahis miktarını al
    const betAmount = await getValidBet(message, userBalance.amount);
    if (!betAmount) return;

    // Bahis tipini seç
    const betSegment = await selectBetSegment(message);
    if (!betSegment) return;

    // Bahsi kes
    await client.eco.removeMoney(message.author.id, betAmount);

    // Çarkı döndürme efektinde kullanıcının seçtiği segment simgesini gösterelim
    await spinWheelWithEffect(message, betMapping[betSegment]);

    // Çarkı döndür ve sonucu hesapla
    const resultSegment = await spinWheel();
    const winnings = calculateWinnings(betSegment, resultSegment, betAmount);

    // Kazancı hesapla ve güncelle
    if (winnings > 0) await client.eco.addMoney(message.author.id, winnings);

    // Sonuçları göster
    showResult(message, betAmount, resultSegment, winnings, betMapping[betSegment]);
};

// Yardımcı Fonksiyonlar

async function getValidBet(message, balance) {
    const embed = new MessageEmbed()
        .setTitle("🎡 Big Six Wheel Bahis")
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
        const amount = parseInt(input);
        
        if (isNaN(amount) || amount < 10 || amount > 250000)
            throw new Error('Geçersiz miktar!');
        return amount;
    } catch {
        message.channel.send("⏳ Süre doldu veya geçersiz miktar!");
        return null;
    }
}

async function selectBetSegment(message) {
    // Butonları iki satıra böldük
    const row1 = new MessageActionRow().addComponents(
        new MessageButton()
            .setCustomId('segment_1x')
            .setLabel('⚀ (Ödeme: 1x)')
            .setStyle('PRIMARY'),
        new MessageButton()
            .setCustomId('segment_2x')
            .setLabel('⚁ (Ödeme: 2x)')
            .setStyle('PRIMARY'),
        new MessageButton()
            .setCustomId('segment_5x')
            .setLabel('⚂ (Ödeme: 5x)')
            .setStyle('PRIMARY'),
        new MessageButton()
            .setCustomId('segment_10x')
            .setLabel('⚃ (Ödeme: 10x)')
            .setStyle('PRIMARY')
    );

    const row2 = new MessageActionRow().addComponents(
        new MessageButton()
            .setCustomId('segment_20x')
            .setLabel('⚄ (Ödeme: 20x)')
            .setStyle('PRIMARY'),
        new MessageButton()
            .setCustomId('segment_50x')
            .setLabel('⚅ (Ödeme: 50x)')
            .setStyle('PRIMARY'),
        new MessageButton()
            .setCustomId('segment_100x')
            .setLabel('$ (Ödeme: 100x)')
            .setStyle('PRIMARY')
    );

    const embed = new MessageEmbed()
        .setTitle("Big Six Wheel - Bahis Segmenti Seç")
        .setDescription("Lütfen çark üzerinde hangi segment için bahis oynamak istediğini seçin.")
        .setColor("YELLOW");

    const msg = await message.channel.send({ embeds: [embed], components: [row1, row2] });
    
    try {
        const interaction = await msg.awaitMessageComponent({ time: 30000 });
        await interaction.deferUpdate();
        return interaction.customId.split('_')[1]; // Örneğin: '1x', '2x', vb.
    } catch {
        message.channel.send("⏳ Bahis tipi seçilmedi!");
        return null;
    }
}

async function spinWheelWithEffect(message, selectedSymbol) {
    const spinningMessage = await message.channel.send(`🎡 Çark dönüyor... - Seçimin: ${selectedSymbol}`);
    const animationFrames = [
        "🎡 Çark dönüyor |",
        "🎡 Çark dönüyor /",
        "🎡 Çark dönüyor -",
        "🎡 Çark dönüyor \\"
    ];
    
    let frameIndex = 0;
    const interval = setInterval(() => {
        spinningMessage.edit(`${animationFrames[frameIndex]} - Seçimin: ${selectedSymbol}`);
        frameIndex = (frameIndex + 1) % animationFrames.length;
    }, 500);

    // Dönme süresi 3 ile 9 saniye arasında rastgele belirlensin
    const spinDuration = Math.floor(Math.random() * (9000 - 3000 + 1)) + 3000;
    await new Promise(resolve => setTimeout(resolve, spinDuration));

    clearInterval(interval);
    // Son mesajı, animasyon framelerinden rastgele bir tanesini göstererek tamamla
    const finalFrame = animationFrames[Math.floor(Math.random() * animationFrames.length)];
    spinningMessage.edit(`${finalFrame} - Seçimin: ${selectedSymbol}`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    spinningMessage.delete();
}

async function spinWheel() {
    // Her segmentin ödeme oranı ile ters orantılı kazanma şansı
    const weightedSegments = [];
    
    wheelSegments.forEach(segment => {
        const weight = 100 / segment.payout; // Ödeme oranı ile ters orantılı şans
        for (let i = 0; i < weight; i++) {
            weightedSegments.push(segment);
        }
    });
    
    // Rastgele bir segment seç
    const randomIndex = Math.floor(Math.random() * weightedSegments.length);
    return weightedSegments[randomIndex]; // Segment objesini döndür
}

function calculateWinnings(betSegment, resultSegment, betAmount) {
    // Bahis segmentini simgeye çevirip karşılaştırıyoruz
    if (betMapping[betSegment] === resultSegment.label) {
        const payout = wheelSegments.find(segment => segment.label === resultSegment.label).payout;
        return betAmount * payout;
    }
    return 0;
}

function showResult(message, betAmount, resultSegment, winnings, selectedSymbol) {
    const resultEmbed = new MessageEmbed()
        .setTitle("🎡 Big Six Wheel Sonuçları")
        .setDescription(`Çark döndü ve **${resultSegment.label}** segmentine düştü!\n\n**${winnings > 0 ? 'Kazandınız!' : 'Kaybettiniz!'}**\n\n**Bahis Miktarı:** ${betAmount} <:Destinex:1347644229333028864>\n**Kazanç:** ${winnings > 0 ? winnings + " <:Destinex:1347644229333028864>" : "Kaybettiniz!"}\n**Seçiminiz:** ${selectedSymbol}`)
        .setColor(winnings > 0 ? "GREEN" : "RED");

    message.channel.send({ embeds: [resultEmbed] });
}

module.exports.help = {
    name: "bigsix",
    description: "Big Six Wheel oyununu oynayın.",
    usage: "bigsix"
};
