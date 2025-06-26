const { Client, GatewayIntentBits, MessageAttachment } = require('discord.js');
const fetch = require('node-fetch');
const DIG = require("discord-image-generation");

module.exports = {
    config: {
        name: 'rip',
        description: 'RIP efekti uygular.',
        aliases: ["rip"],
        usage: '',
        accessableby: "everyone",
    },

    // V13'te komutun çalışma fonksiyonu execute olarak adlandırılmalı
    execute: async (client, message, args) => {
        let user = await message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.guild.members.cache.find(r => r.user.username.toLowerCase() === args.join(' ').toLocaleLowerCase()) || message.guild.members.cache.find(r => r.displayName.toLowerCase() === args.join(' ').toLocaleLowerCase()) || message.member;
        
        let m = await message.channel.send("**Lütfen bekleyin...**");

        let avatar = user.user.displayAvatarURL({
            dynamic: false,
            format: "png",
        });

        // 'Rip' efekti oluşturma
        let img = await new DIG.Rip().getImage(avatar);

        // MessageAttachment ile resmi gönderme
        let attachment = new MessageAttachment(img, "rip.png");

        // Mesajı gönderme
        m.delete({ timeout: 5000 });
        message.channel.send({ files: [attachment] });
    },

    help: {
        name: 'rip',
        description: 'Bir kullanıcının avatarından RIP resmi oluşturur.',
        usage: '[mention | kullanıcı adı]',
    },
};
