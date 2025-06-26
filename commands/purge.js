module.exports = {
    name: 'purge',
    description: 'Belirtilen kelimeyi, embed mesajları, ek içeren mesajları veya belirli bir kullanıcının mesajlarını siler.',
    aliases: [],
    usage: 'k!purge <kelime> | k!purge #embed | k!purge #ek | k!purge #kullanıcı @kullanıcı/id/isim',

    async execute(client, message, args) {
        if (!message.member.permissions.has('MANAGE_MESSAGES')) 
            return message.reply('❌ Bu komutu kullanmak için **Mesajları Yönet** iznine sahip olmalısın!');

        if (!args.length) 
            return message.reply('❌ Lütfen silinecek mesajlardaki kelimeyi, `#embed`, `#ek` veya `#kullanıcı @kullanıcı/id/isim` yazın!');

        let keyword = args.join(' ').toLowerCase();
        let totalDeleted = 0;

        async function fetchAndDelete() {
            let deletedInLoop;

            do {
                let messages = await message.channel.messages.fetch({ limit: 100 });
                let now = Date.now();
                
                let filtered;

                if (keyword === '#embed') {
                    filtered = messages.filter(msg => msg.embeds.length > 0);
                } else if (keyword === '#ek') {
                    filtered = messages.filter(msg => msg.attachments.size > 0);
                } else if (keyword.startsWith('#kullanıcı')) {
                    let target = args.slice(1).join(' ');

                    if (!target) return message.reply('❌ Lütfen bir kullanıcı etiketleyin, ID girin veya ismini yazın!');

                    let user = 
                        message.mentions.users.first() || 
                        client.users.cache.get(target) || 
                        message.guild.members.cache.find(m => m.user.username.toLowerCase() === target.toLowerCase())?.user;

                    if (!user) return message.reply('❌ Kullanıcı bulunamadı!');

                    filtered = messages.filter(msg => msg.author.id === user.id);
                } else {
                    filtered = messages.filter(msg => msg.content.toLowerCase().includes(keyword));
                }

                // 14 günden eski mesajları filtrele
                filtered = filtered.filter(msg => (now - msg.createdTimestamp) < 1209600000);

                deletedInLoop = filtered.size;

                if (deletedInLoop > 0) {
                    try {
                        await message.channel.bulkDelete(filtered, true);
                        totalDeleted += deletedInLoop;
                        await new Promise(resolve => setTimeout(resolve, 500));
                    } catch (err) {
                        return message.reply('❌ Mesajlar silinirken bir hata oluştu. Botun **Mesajları Yönet** izni olduğundan emin olun!');
                    }
                }
            } while (deletedInLoop > 0);
        }

        await fetchAndDelete();

        if (totalDeleted > 0) {
            message.channel.send(`✅ **"${keyword}"** ile eşleşen **${totalDeleted} mesaj** başarıyla silindi!`).then(msg => {
                setTimeout(() => msg.delete(), 5000);
            });
        } else {
            message.reply(`❌ **"${keyword}"** ile eşleşen mesaj bulunamadı veya mesajlar 14 günden eski!`);
        }
    },

    help: {
        name: 'purge',
        aliases: [], 
        usage: 'k!purge <kelime> | k!purge #embed | k!purge #ek | k!purge #kullanıcı @kullanıcı/id/isim',
        description: 'Belirtilen kelimeyi içeren mesajları, embed mesajları, ek içeren mesajları veya belirli bir kullanıcının mesajlarını siler.'
    }
};
