const { MessageAttachment } = require('discord.js');
const Jimp = require('jimp');

module.exports.help = {
    name: 'avatarfusion',
    aliases: ['afusion', 'fusion'],
    description: 'İki kullanıcının avatarlarını birleştirir.',
    usage: 'avatarfusion [@kullanıcı1] [@kullanıcı2]'
};

module.exports.execute = async (bot, message, args) => {
    if (!message.guild.me.permissions.has('ATTACH_FILES')) {
        return message.channel.send("**Gerekli yetki eksik: `ATTACH_FILES`!**");
    }

    if (!args[0] || !args[1]) {
        return message.channel.send("**Lütfen iki kullanıcı etiketleyin!**");
    }

    let base = message.mentions.members.first() || 
        message.guild.members.cache.get(args[0]) || 
        message.guild.members.cache.find(r => r.user.username.toLowerCase() === args[0].toLowerCase()) || 
        message.guild.members.cache.find(r => r.displayName.toLowerCase() === args[0].toLowerCase());

    let overlay = message.mentions.members.at(1) || 
        message.guild.members.cache.get(args[1]) || 
        message.guild.members.cache.find(r => r.user.username.toLowerCase() === args[1].toLowerCase()) || 
        message.guild.members.cache.find(r => r.displayName.toLowerCase() === args[1].toLowerCase());

    if (!base || !overlay) {
        return message.channel.send("**Geçerli iki kullanıcı bulunamadı!**");
    }

    const baseAvatarURL = base.user.displayAvatarURL({ format: 'png', size: 512, dynamic: false });
    const overlayAvatarURL = overlay.user.displayAvatarURL({ format: 'png', size: 512, dynamic: false });

    try {
        const baseAvatar = await Jimp.read(baseAvatarURL);
        const overlayAvatar = await Jimp.read(overlayAvatarURL);

        baseAvatar.resize(512, 512);
        overlayAvatar.resize(512, 512);
        overlayAvatar.opacity(0.5); // Şeffaflık ayarı (0.5 = %50)

        baseAvatar.composite(overlayAvatar, 0, 0, {
            mode: Jimp.BLEND_SOURCE_OVER,
            opacitySource: 0.5
        });

        const buffer = await baseAvatar.getBufferAsync(Jimp.MIME_PNG);
        const attachment = new MessageAttachment(buffer, 'avatarfusion.png');

        return message.channel.send({ files: [attachment] });

    } catch (err) {
        console.error(err);
        return message.channel.send(`Bir hata oluştu: \`${err.message}\`. Lütfen tekrar deneyin!`);
    }
};
