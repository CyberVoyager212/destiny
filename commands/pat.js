const Discord = require('discord.js');
const superagent = require('superagent');

module.exports = {
    config: {
        name: 'pat',
        description: 'Birine pat yapar',
        aliases: ["pat"],
        usage: '<kullanıcı>',
    },

    execute: async (client, message, args) => {
        let victim = message.mentions.users.first() || (args.length > 0 ? message.users.cache.filter(e => e.username.toLowerCase().includes(args.join(" ").toLowerCase())).first() : message.author) || message.author;
        
        try {
            const { body } = await superagent
              .get("https://nekos.life/api/v2/img/pat");
            
            const embed = new Discord.MessageEmbed()
             .setColor("YELLOW")
             .setTitle("İşte patın, 👀")
             .setDescription(`${victim} ${message.author}'a pat yaptı`)
             .setImage(body.url)
             .setTimestamp();
  
            message.channel.send({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            message.reply("Pat resmi alınırken bir hata oluştu.");
        }
    },

    help: {
        name: 'pat',
        description: 'Birine pat yapar. Birini etiketleyerek ya da isimle bir kullanıcıyı belirterek onlara pat yapabilirsiniz.',
        usage: 'pat <kullanıcı>',
        examples: ['pat @kullanıcı', 'pat']
    }
};
