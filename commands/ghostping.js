module.exports = {
    name: 'ghostping',
    description: 'Belirtilen kullanıcıya hayalet ping atar ve mesajı hemen siler. (Sadece yetkililer kullanabilir)',
    aliases: ['hayaletping', 'gp'],
    usage: 'k!ghostping <@kullanıcı | KullanıcıAdı | KullanıcıID>',

    async execute(client, message, args) {
        // YETKİ KONTROLÜ
        if (!message.member.permissions.has('MANAGE_MESSAGES')) {
            return message.reply('❌ Bu komutu kullanmak için **Mesajları Yönet** iznine sahip olmalısın!');
        }

        // Kullanıcıyı belirleme
        let user =
            message.mentions.members.first() || // @Kullanıcı ile
            message.guild.members.cache.get(args[0]) || // Kullanıcı ID ile
            message.guild.members.cache.find(m => m.user.username.toLowerCase() === args.join(" ").toLowerCase()); // Kullanıcı adı ile

        if (!user) return message.reply('❌ Geçerli bir kullanıcı belirtmelisin! (Etiket, Kullanıcı Adı veya ID)');

        // Kullanıcıyı etiketleyip mesajı silme
        message.channel.send(`${user}`).then(sentMessage => {
            setTimeout(() => {
                sentMessage.delete().catch(() => {});
            }, 1000);
        });

        message.delete().catch(() => {});
    }
};

module.exports.help = {
    name: 'ghostping',
    description: 'Belirtilen kullanıcıya hayalet ping atar ve mesajı hemen siler.',
    aliases: ['hayaletping', 'gp'],
    usage: 'k!ghostping <@kullanıcı | KullanıcıAdı | KullanıcıID>'
};
