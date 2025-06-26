const { MessageEmbed } = require('discord.js');

module.exports.help = {
    name: 'roast',
    aliases: ['dalga', 'sataş'],
    description: 'Bir kullanıcıyı rastgele bir espriyle kızdır!',
    usage: 'roast [@kullanıcı]'
};

module.exports.execute = async (bot, message, args) => {
    const roasts = [
        "Senin IQ seviyen, oda sıcaklığından düşük olabilir mi?",
        "Bir duvara çarpsan, duvar bile daha zeki görünürdü.",
        "Eğer bir zeka yarışması olsaydı, sen izleyici olurdun.",
        "Meyve suyu kutusundaki pipetten daha faydasızsın.",
        "Senin esprilerin, uykusuz geceler kadar sıkıcı.",
        "Senin hakkında konuşmak yerine duvar izlemeyi tercih ederim."
    ];

    let member = message.mentions.members.first() ||
        message.guild.members.cache.get(args[0]) ||
        message.guild.members.cache.find(r => r.user.username.toLowerCase() === args.join(' ').toLowerCase()) ||
        message.guild.members.cache.find(r => r.displayName.toLowerCase() === args.join(' ').toLowerCase());

    let roast = roasts[Math.floor(Math.random() * roasts.length)];

    if (!args[0]) {
        const sembed = new MessageEmbed()
            .setAuthor({ name: message.guild.name, iconURL: message.guild.iconURL() })
            .setColor("GREEN")
            .setDescription("**Kendine mi sataşmak istiyorsun?** 😂")
            .setFooter({ text: message.member.displayName, iconURL: message.author.displayAvatarURL() })
            .setTimestamp();

        return message.channel.send({ embeds: [sembed] });
    }

    if (member) {
        const embed = new MessageEmbed()
            .setAuthor({ name: message.guild.name, iconURL: message.guild.iconURL() })
            .setTitle(`${message.author.username} -` )
            .setColor("GREEN")
            .setDescription(`${roast}`)
            .setFooter({ text: member.displayName, iconURL: member.user.displayAvatarURL() })
            .setTimestamp();

        return message.channel.send({ embeds: [embed] });
    } else {
        return message.channel.send("**Geçerli bir kullanıcı etiketleyin!**");
    }
};
