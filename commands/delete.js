const { MessageAttachment } = require('discord.js');
const DIG = require("discord-image-generation");

module.exports.help = {
    name: 'delete',
    aliases: [],
    description: 'Belirtilen kullanıcının avatarını silinmiş gibi gösteren bir resim oluşturur.',
    usage: 'delete [@kullanıcı]'
};

module.exports.execute = async (bot, message, args) => {
    let user = message.mentions.members.first() || 
               message.guild.members.cache.get(args[0]) || 
               message.guild.members.cache.find(r => r.user.username.toLowerCase() === args.join(' ').toLowerCase()) || 
               message.guild.members.cache.find(r => r.displayName.toLowerCase() === args.join(' ').toLowerCase()) || 
               message.member;

    if (!user) return message.channel.send("**Lütfen geçerli bir kullanıcı belirtin!**");

    let m = await message.channel.send("**Lütfen bekleyin...**");

    let avatar = user.user.displayAvatarURL({ dynamic: false, format: "png" });

    try {
        let img = await new DIG.Delete().getImage(avatar);
        let attach = new MessageAttachment(img, "delete.png");

        await m.delete();
        return message.channel.send({ files: [attach] });
    } catch (err) {
        console.error(err);
        return message.channel.send("**Bir hata oluştu! Lütfen tekrar deneyin.**");
    }
};
