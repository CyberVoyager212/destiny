const { Permissions } = require('discord.js');

module.exports = {
    name: 'channelhide',
    description: 'Bulunduğunuz kanalı herkes için gizler.',
    aliases: ['chide', 'hidechannel'],
    usage: 'k!channelhide',
    
    async execute(client, message, args) {
        if (!message.member.permissions.has(Permissions.FLAGS.MANAGE_CHANNELS)) {
            return message.reply('Bu komutu kullanmak için **Kanalları Yönet** yetkisine sahip olmalısın.');
        }

        await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, {
            VIEW_CHANNEL: false
        });

        message.reply('🔒 **Kanal başarıyla gizlendi!**');
    },

    help: {
        name: 'channelhide',
        aliases: ['chide', 'hidechannel'],
        usage: 'k!channelhide',
        description: 'Bulunduğunuz kanalı herkes için gizler.'
    }
};
