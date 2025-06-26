const { MessageAttachment } = require('discord.js');
const fetch = require('node-fetch');

module.exports = {
    config: {
        name: "captcha",
        description: "Shows Captcha Image Of A User",
        usage: "[username | nickname | mention | ID] (optional)",
        accessableby: "everyone",
    },
    run: async (bot, message, args) => {
        let user = await message.mentions.members.first() || 
            message.guild.members.cache.get(args[0]) || 
            message.guild.members.cache.find(r => r.user.username.toLowerCase() === args.join(' ').toLowerCase()) || 
            message.guild.members.cache.find(r => r.displayName.toLowerCase() === args.join(' ').toLowerCase()) || 
            message.member;

        let m = await message.channel.send("**Please Wait...**");

        try {
            let res = await fetch(encodeURI(`https://nekobot.xyz/api/imagegen?type=captcha&username=${user.user.username}&url=${user.user.displayAvatarURL({ format: "png", size: 512 })}`));
            let json = await res.json();

            if (!json.message) {
                return m.edit("❎ Could not generate captcha image, please try again.");
            }

            let attachment = new MessageAttachment(json.message, "captcha.png");
            message.channel.send({ files: [attachment] });
            m.delete();

        } catch (e) {
            console.error(e);
            m.edit("❎ Error, try again! Mention someone.");
        }
    }
};

// `execute` hatasını engellemek için:
module.exports.execute = module.exports.run;
module.exports.help = {
    name: "chaptcha",
    description: "chaptcha oluşturur",
    usage: "chaptcha "
};