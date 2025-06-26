const { Permissions, MessageEmbed } = require('discord.js');

exports.execute = async (client, message, args) => {
    // Admin yetkisi kontrolü
    if (!message.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) {
        return message.reply("Bu komutu kullanmak için yetkiniz yok.");
    }

    // Kazanan sayısı ve çekiliş süresi kontrolü
    const winnersCount = parseInt(args[0], 10);
    const duration = args[1];
    const prize = args.slice(2).join(' ');

    if (isNaN(winnersCount) || winnersCount < 1) {
        return message.reply("Lütfen geçerli bir kazanan sayısı belirtin.");
    }

    if (!duration) {
        return message.reply("Lütfen geçerli bir süre belirtin.");
    }

    const timeUnit = duration.slice(-3);
    const timeValue = parseInt(duration.slice(0, -3), 10);

    if (isNaN(timeValue) || timeValue <= 0) {
        return message.reply("Lütfen geçerli bir süre değeri belirtin.");
    }

    let msDuration;
    switch (timeUnit) {
        case 'san':
            msDuration = timeValue * 1000; // saniyeler
            break;
        case 'dak':
            msDuration = timeValue * 60 * 1000; // dakikalar
            break;
        case 'saa':
            msDuration = timeValue * 60 * 60 * 1000; // saatler
            break;
        case 'gün':
            msDuration = timeValue * 24 * 60 * 60 * 1000; // günler
            break;
        default:
            return message.reply("Geçersiz süre birimi. Kullanılabilir birimler: san (saniye), dak (dakika), saa (saat), gün (gün).");
    }

    if (!msDuration || msDuration <= 0) {
        return message.reply("Lütfen geçerli bir süre belirtin.");
    }

    if (!prize) {
        return message.reply("Lütfen kazanılacak şeyi belirtin.");
    }

    // Çekiliş embed mesajı oluşturma
    const giveawayEmbed = new MessageEmbed()
        .setColor('#0099ff')
        .setTitle('🎉 Çekiliş Başladı! 🎉')
        .addFields(
            { name: 'Ödül:', value: prize || 'Belirtilmemiş', inline: true },
            { name: 'Kazanan Sayısı:', value: winnersCount.toString(), inline: true },
            { name: 'Süre:', value: `${timeValue} ${timeUnit === 'san' ? 'saniye' : timeUnit === 'dak' ? 'dakika' : timeUnit === 'saa' ? 'saat' : 'gün'}`, inline: true }
        )
        .setFooter('Çekilişe katılmak için 🎉 emojisine tıklayın!');

    const giveawayMessage = await message.channel.send({ embeds: [giveawayEmbed] });

    await giveawayMessage.react('🎉');

    setTimeout(async () => {
        // Katılımcıları al
        const reactions = await giveawayMessage.reactions.cache.get('🎉').users.fetch();
        const participants = reactions.filter(user => !user.bot).map(user => user);

        if (participants.length < winnersCount) {
            return message.channel.send("Yeterli katılım olmadı, çekiliş iptal edildi.");
        }

        // Kazananları belirleme
        const winners = participants.sort(() => 0.5 - Math.random()).slice(0, winnersCount);

        // Kazanan embed mesajı oluşturma
        const winnersEmbed = new MessageEmbed()
            .setColor('#00ff00')
            .setTitle('🎉 Çekiliş Sonuçları! 🎉')
            .addFields(
                { name: 'Ödül:', value: prize || 'Belirtilmemiş' },
                { name: 'Kazananlar:', value: winners.map(user => user.tag).join('\n') || 'Hiç kimse kazanamadı.' }
            );

        message.channel.send({ embeds: [winnersEmbed] });
    }, msDuration);
};

exports.help = {
    name: "çekiliş",
 aliases: ["cekilis", "giveaway"],
    usage: `çekiliş <kazanan sayısı> <süre> <ödül>`,
    description: "Belirtilen süre boyunca çekiliş düzenler."
};