const { MessageAttachment } = require('discord.js');
const DIG = require("discord-image-generation");
const config = require('../botConfig');

module.exports = {
    config: {
        name: "blur",
        category: "Image",
        description: "Converts a user's avatar to a blur effect.",
        example: `${config.Prefix}blur @Dinav`,
    },
    run: async (client, message, args) => {

        const user = message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.member;

        if (!user)
            return message.reply("❌ Please provide a valid user!");

        const avatar = user.user.displayAvatarURL({ dynamic: false, format: 'png', size: 1024 });

        // Generate the blur effect
        let img = await new DIG.Blur().getImage(avatar);

        let attach = new MessageAttachment(img, "blurred-avatar.png");

        message.channel.send({ files: [attach] });
    }
};

// `execute` hatasını engellemek için:
module.exports.execute = module.exports.run;

module.exports.help = {
    name: "blur",
    description: "fotoğraf blurlar",
    usage: "blur"
};