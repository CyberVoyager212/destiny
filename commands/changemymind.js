const { MessageEmbed } = require('discord.js');

module.exports.help = {
    name: 'changemymind',
    aliases: ['cmm'],
    description: 'Belirtilen metni Change My Mind meme formatında oluşturur.',
    usage: 'changemymind <yazı>'
};

module.exports.execute = async (bot, message, args) => {
    if (!args.length) return message.channel.send("**Lütfen bir metin girin!**");

    let change = encodeURIComponent(args.join(" "));
    let imageUrl = `https://vacefron.nl/api/changemymind?text=${change}`;

    const embed = new MessageEmbed()
        .setTitle("Fikrimi Değiştir?")
        .setImage(imageUrl)
        .setColor("RANDOM")
        .setFooter({ text: `İsteyen: ${message.member.displayName}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) });

    return message.channel.send({ embeds: [embed] });
};
