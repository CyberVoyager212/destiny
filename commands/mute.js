exports.execute = async (client, message, args) => {
    try {
        if (!message.member.permissions.has('MANAGE_ROLES')) {
            return message.reply("🚫 | Bu komutu kullanmak için `MANAGE_ROLES` yetkiniz yok.");
        }

        const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.guild.members.cache.find(m => m.user.username.toLowerCase() === args[0]?.toLowerCase());
        if (!member) {
            return message.reply("⚠️ | Lütfen susturulacak kullanıcıyı belirtin. (@kullanıcı / ID / isim)");
        }

        const muteRole = message.guild.roles.cache.find(role => role.name === "Muted");
        if (!muteRole) {
            return message.reply("❌ | 'Muted' rolü bulunamadı, lütfen sunucuda bir 'Muted' rolü oluşturun.");
        }

        const duration = args[1];
        if (!duration || !/^\d+[smhd]$/.test(duration)) {
            return message.reply("🕒 | Lütfen geçerli bir süre girin (örnek: `5m`, `1h`, `1d`).");
        }

        const durationMs = parseDuration(duration);
        if (!durationMs) {
            return message.reply("❌ | Geçerli bir süre girmediniz.");
        }

        const muteTime = Date.now();
        const roles = member.roles.cache.filter(role => role.id !== message.guild.id).map(role => role.id);

        // Kullanıcının mevcut rollerini veritabanına kaydet
        client.db.set(`mute_${message.guild.id}_${member.id}`, {
            roles,
            muteTime,
            duration: durationMs
        });

        await member.roles.remove(roles);
        await member.roles.add(muteRole);

        message.channel.send(`🔇 | **${member.user.tag}** kullanıcısı **${duration}** süreyle susturuldu.`);

        setTimeout(async () => {
            await unmuteUser(client, member, muteRole, message.channel);
        }, durationMs);

    } catch (error) {
        console.error("❌ | Susturma komutunda hata oluştu:", error);
        return message.reply("⚠️ | Komut çalıştırılırken bir hata oluştu, lütfen tekrar deneyin.");
    }
};

function parseDuration(duration) {
    const units = {
        s: 1000, // saniye
        m: 60 * 1000, // dakika
        h: 60 * 60 * 1000, // saat
        d: 24 * 60 * 60 * 1000 // gün
    };
    const unit = duration.slice(-1);
    const time = parseInt(duration.slice(0, -1), 10);
    return time * (units[unit] || 0);
}

async function unmuteUser(client, member, muteRole, channel) {
    try {
        const muteData = client.db.get(`mute_${channel.guild.id}_${member.id}`);
        if (!muteData) return;

        await member.roles.remove(muteRole);

        // Önceki rollerini geri yükle
        for (const roleId of muteData.roles) {
            const role = channel.guild.roles.cache.get(roleId);
            if (role) {
                await member.roles.add(role);
            }
        }

        channel.send(`🔊 | **${member.user.tag}** kullanıcısının susturması otomatik olarak kaldırıldı.`);

        // Veritabanından susturma verisini sil
        client.db.delete(`mute_${channel.guild.id}_${member.id}`);
    } catch (error) {
        console.error("⚠️ | Otomatik unmute hatası:", error);
    }
}

exports.help = {
    "name": "mute",
    "aliases": [],
    "usage": "mute <@kullanıcı / ID / isim> <süre (örn: 5m, 1h, 1d)>",
    "description": "Belirtilen kullanıcıyı belirli bir süre boyunca susturur ve rollerini saklar."
};
