const { Client, Message, MessageEmbed } = require('discord.js');
const fetch = require('node-fetch');

module.exports.help = {
    name: 'eject',
    aliases: ['ejected', 'impostor'],
    description: 'Belirtilen kullanıcıyı Among Us tarzında fırlatır.',
    usage: 'eject [@kullanıcı]'
};

module.exports.execute = async (bot, message, args) => {
    try {
        const user = message.mentions.users.first() || 
            message.guild.members.cache.find(member => member.user.username.toLowerCase().includes(args.join(" ").toLowerCase()))?.user ||
            message.author;
        
        const imposter = Math.random() < 0.5;
        const crewColors = ["black", "blue", "brown", "cyan", "darkgreen", "lime", "orange", "pink", "purple", "red", "white", "yellow"];
        const crewmate = crewColors[Math.floor(Math.random() * crewColors.length)];
        
        const response = await fetch(`https://vacefron.nl/api/ejected?name=${encodeURIComponent(user.username)}&impostor=${imposter}&crewmate=${crewmate}`);
        
        if (!response.ok) throw new Error(`API Hatası: ${response.status} ${response.statusText}`);
        
        const embed = new MessageEmbed()
            .setAuthor(`${message.author.username}#${message.author.discriminator}`, message.author.displayAvatarURL())
            .setTitle(`${message.author.username}, ${user.username} adlı kişiyi uzaya fırlattı!`)
            .setColor("#FF0000")
            .setImage(response.url);
        
        message.channel.send({ embeds: [embed] });
    } catch (err) {
        console.error(err);
        const embedError = new MessageEmbed()
            .setTitle(`❌ Bir hata oluştu.`)
            .setDescription("Kullanıcının adında özel karakterler varsa API düzgün çalışmayabilir.")
            .setColor("#FF0000");
        message.channel.send({ embeds: [embedError] });
    }
};
