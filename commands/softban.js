const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'softban',
    description: 'Kullanıcıyı yasaklayıp anında yasağını kaldırır, böylece mesajları silinir.',
    aliases: ['yumuşakban', 'silban'],
    usage: 'k!softban <@kullanıcı | kullanıcıID | kullanıcıAdı> <sebep>',
    
    async execute(client, message, args) {
        if (!message.member.permissions.has('BAN_MEMBERS')) 
            return message.reply('❌ Bu komutu kullanmak için **Üyeleri Yasakla** iznine sahip olmalısın!');
        
        let user = message.mentions.members.first() 
                   || message.guild.members.cache.get(args[0]) 
                   || message.guild.members.cache.find(m => m.user.username.toLowerCase() === args[0]?.toLowerCase());

        if (!user) return message.reply('❌ Lütfen softban uygulanacak bir kullanıcı belirtin!');

        let reason = args.slice(1).join(' ') || 'Sebep belirtilmedi';

        // Sunucu için bir davet linki oluştur
        let invite = await message.channel.createInvite({ maxAge: 0, maxUses: 1 })
            .catch(() => null);

        try {
            await user.send(`⚠️ ${message.guild.name} sunucusundan geçici olarak yasaklandınız! **Sebep:** ${reason}\n🔗 Geri katılmak için: ${invite ? invite.url : 'Davet oluşturulamadı'}`);
        } catch (err) {
            message.channel.send('❌ Kullanıcıya mesaj gönderilemedi.');
        }

        await message.guild.members.ban(user, { reason, days: 7 });
        await message.guild.members.unban(user.id);

        message.channel.send(`✅ **${user.user.tag}** kullanıcısına softban uygulandı! Mesajları silindi ve davet linki gönderildi.`);
    },

    help: {
        name: 'softban',
        aliases: ['yumuşakban', 'silban'],
        usage: 'k!softban <@kullanıcı | kullanıcıID | kullanıcıAdı> <sebep>',
        description: 'Kullanıcıyı yasaklayıp anında yasağını kaldırır, böylece mesajları silinir ve davet linki gönderilir.'
    }
};
