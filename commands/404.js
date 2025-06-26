const { WebhookClient } = require('discord.js');

module.exports = {
    name: 'voidwhisper',
    description: 'Boşluktan gelen gizemli bir mesaj gönderir.',
    aliases: ['void', 'whisper', 'shadowmsg'],
    usage: 'k!voidwhisper <mesaj>',
    
    async execute(client, message, args) {
        // Yetkili kontrolü (isteğe bağlı)
        if (!message.member.permissions.has('MANAGE_MESSAGES')) {
            return message.reply('Bu komutu kullanmak için yetkin yok.');
        }

        // Mesaj içeriğini al
        const content = args.join(' ');
        if (!content) {
            return message.reply('Lütfen göndermek istediğiniz gizli mesajı yazın.');
        }

        // Mesajı 0.5 saniye (500ms) sonra sil
        setTimeout(() => {
            message.delete().catch(() => {});
        }, 500);

        // Webhook oluştur veya mevcut olanı kullan
        const webhooks = await message.channel.fetchWebhooks();
        let webhook = webhooks.find(wh => wh.name === 'VoidWhisperBot');

        if (!webhook) {
            webhook = await message.channel.createWebhook('VoidWhisperBot', {
                avatar: 'https://cdn.glitch.global/5826ca9c-c099-4101-bc22-bb193de79a85/downloaded_image.png?v=1741870583723' // Belirtilen URL'deki resim
            });
        }

        // Webhook üzerinden anonim mesaj gönder
        await webhook.send({
            content: content,
            username: 'Void Entity', // Gönderen adı
            avatarURL: 'https://cdn.glitch.global/5826ca9c-c099-4101-bc22-bb193de79a85/downloaded_image.png?v=1741870583723' // Webhook avatarını bu URL olarak ayarla
        });
    },

    help: {
        name: 'voidwhisper',
        aliases: ['void', 'whisper', 'shadowmsg'],
        usage: 'k!voidwhisper <mesaj>',
        description: 'Webhook kullanarak boşluktan gelen bir mesaj gönderir.'
    }
};
