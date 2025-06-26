const { Permissions } = require('discord.js');

module.exports = {
    name: 'channelunhide',
    description: 'Bulunduğunuz kanalı tekrar görünür hale getirir.',
    aliases: ['cunhide', 'unhidechannel'],
    usage: 'k!channelunhide',
    
    async execute(client, message, args) {
        if (!message.member.permissions.has(Permissions.FLAGS.MANAGE_CHANNELS)) {
            return message.reply('Bu komutu kullanmak için **Kanalları Yönet** yetkisine sahip olmalısın.');
        }

        await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, {
            VIEW_CHANNEL: true
        });

        message.reply('🔓 **Kanal başarıyla açıldı!**');
    },

    help: {
        name: 'channelunhide',
        aliases: ['cunhide', 'unhidechannel'],
        usage: 'k!channelunhide',
        description: 'Bulunduğunuz kanalı tekrar görünür hale getirir.'
    }
};
