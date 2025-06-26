const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'securityscan',
    description: 'Kullanıcının güvenlik seviyesini kontrol eder.',
    aliases: ['scan', 'secscan'],
    usage: 'k!securityscan @user',
    
    async execute(client, message, args) {
        const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        if (!member) return message.reply('Lütfen bir kullanıcı etiketleyin.');

        const accountAge = (Date.now() - member.user.createdTimestamp) / (1000 * 60 * 60 * 24);
        let riskLevel = 'Düşük ✅';

        if (accountAge < 7) {
            riskLevel = 'Yüksek 🚨 (Yeni Hesap)';
        } else if (accountAge < 30) {
            riskLevel = 'Orta ⚠️';
        }

        const embed = new MessageEmbed()
            .setTitle(`${member.user.tag} - Güvenlik Taraması`)
            .addField('Hesap Yaşı', `${Math.floor(accountAge)} gün`)
            .addField('Risk Seviyesi', riskLevel)
            .setColor('ORANGE')
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }));

        message.channel.send({ embeds: [embed] });
    },

    help: {
        name: 'securityscan',
        aliases: ['scan', 'secscan'],
        usage: 'k!securityscan @user',
        description: 'Belirtilen kullanıcının hesap güvenliğini kontrol eder.'
    }
};
