const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'altcheck',
    description: 'Kullanıcının hesabının ne kadar eski olduğunu kontrol eder. (Sadece yetkililer kullanabilir)',
    aliases: ['alt', 'hesapkontrol'],
    usage: 'k!altcheck @kullanıcı',

    async execute(client, message, args) {
        // YETKİ KONTROLÜ
        if (!message.member.permissions.has('MANAGE_MEMBERS') && !message.member.permissions.has('ADMINISTRATOR')) {
            return message.reply('❌ Bu komutu kullanmak için **Üyeleri Yönet** veya **Yönetici** iznine sahip olmalısın!');
        }

        let user = message.mentions.users.first() || message.author;
        let accountAge = Math.floor((Date.now() - user.createdTimestamp) / (1000 * 60 * 60 * 24));

        let status = accountAge < 30 ? '⚠ **Bu hesap çok yeni!**' : '✅ **Bu hesap eski görünüyor.**';

        const embed = new MessageEmbed()
            .setTitle(`📅 ${user.username} Hesap Bilgisi`)
            .setThumbnail(user.displayAvatarURL({ dynamic: true }))
            .addField('Hesap Açılış Tarihi', `<t:${Math.floor(user.createdTimestamp / 1000)}:D>`, true)
            .addField('Günlük Yaşı', `${accountAge} gün`, true)
            .addField('Durum', status)
            .setColor(accountAge < 30 ? 'RED' : 'GREEN');

        message.channel.send({ embeds: [embed] });
    }
};

module.exports.help = {
    name: 'altcheck',
    description: 'Kullanıcının hesabının ne kadar eski olduğunu kontrol eder.',
    aliases: ['alt', 'hesapkontrol'],
    usage: 'k!altcheck @kullanıcı'
};
