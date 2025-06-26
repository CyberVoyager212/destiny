const { Permissions } = require('discord.js');

// Zaman birimlerini milisaniyeye çeviren fonksiyon
function parseDuration(timeString) {
    const regex = /^(\d+)\s*(saniye|dakika|saat|gün|ay|yıl)$/i;
    const match = timeString.match(regex);

    if (!match) return null;

    const value = parseInt(match[1]);
    const unit = match[2].toLowerCase();

    const timeMultipliers = {
        "saniye": 1000,
        "dakika": 1000 * 60,
        "saat": 1000 * 60 * 60,
        "gün": 1000 * 60 * 60 * 24,
        "ay": 1000 * 60 * 60 * 24 * 30, // Ortalama 30 gün
        "yıl": 1000 * 60 * 60 * 24 * 365 // Ortalama 365 gün
    };

    return value * timeMultipliers[unit];
}

module.exports = {
    name: 'adminstealth',
    description: 'Adminleri çevrimdışı gösterir, görünmez yapar ve kanallara erişimini kısıtlar.',
    aliases: ['stealth', 'ghostmode'],
    usage: 'k!adminstealth [süre]', // Süre isteğe bağlı
    
    async execute(client, message, args) {
        if (!message.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) {
            return message.reply('🚫 Bu komutu kullanmak için **Yönetici** yetkisine sahip olmalısın.');
        }

        const user = message.member;
        const guild = message.guild;

        // Kullanıcının belirttiği süreyi al, eğer yoksa varsayılan olarak 20 saniye kullan
        const durationInput = args.join(" ") || "20 saniye";
        const duration = parseDuration(durationInput);

        if (!duration) {
            return message.reply('⚠️ Geçersiz süre formatı! **Örnek kullanımlar:** `10 saniye`, `2 dakika`, `1 saat`, `2 gün`, `2 ay`, `1 yıl`');
        }

        // Kullanıcının şu anki rollerini kaydet
        const savedRoles = user.roles.cache.filter(role => role.name !== '@everyone');

        // "Stealth Mode" rolünü bul veya oluştur
        let stealthRole = guild.roles.cache.find(r => r.name === "Stealth Mode");

        if (!stealthRole) {
            try {
                stealthRole = await guild.roles.create({
                    name: 'Stealth Mode',
                    color: '#2C2F33',
                    permissions: []
                });

                // Tüm kanallarda "Stealth Mode" rolünün mesaj ve görüntüleme izinlerini kapat
                guild.channels.cache.forEach(async channel => {
                    await channel.permissionOverwrites.edit(stealthRole, {
                        VIEW_CHANNEL: false, // Kanalı görüntüleyemez
                        SEND_MESSAGES: false, // Mesaj gönderemez
                        CONNECT: false // Sesli kanallara bağlanamaz
                    });
                });

            } catch (error) {
                console.error('Stealth Mode rolü oluşturulamadı:', error);
                return message.reply('⚠️ **Stealth Mode** rolü oluşturulamadı.');
            }
        }

        // Kullanıcının tüm rollerini kaldır ve sadece "Stealth Mode" rolünü ekle
        await user.roles.set([stealthRole]);

        message.reply(`🕵️ **Gizli mod aktif!** Artık tüm kanallardan gizlendin. Görünmez olmak için Discord durumunu "Görünmez" yapmayı unutma! **(${durationInput} boyunca aktif)**`);

        // Belirtilen süre sonra rolleri geri yükle
        setTimeout(async () => {
            await user.roles.set(savedRoles.map(role => role.id));
            message.reply('🚨 **Gizli mod sona erdi!** Eski rollerin geri yüklendi, artık kanalları tekrar görebilirsin.');
        }, duration);
    },

    help: {
        name: 'adminstealth',
        aliases: ['stealth', 'adminghostmode'],
        usage: 'k!adminstealth [süre]',
        description: 'Adminleri gizli moda alır, kanalları görememesini sağlar ve belirtilen süre sonunda eski rollerini geri yükler.'
    }
};
