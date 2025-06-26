exports.execute = async (client, message, args) => {
    // Kullanıcının 'ADMINISTRATOR' yetkisini kontrol et
    if (!message.member.permissions.has('ADMINISTRATOR')) {
        return message.reply("❌ **Bu komutu kullanmak için `Yönetici` yetkiniz yok.**");
    }

    // Etiketlenen üye olup olmadığını kontrol et
    const member = message.mentions.members.first();
    if (!member) {
        return message.reply("⚠️ **Lütfen adını değiştirmek istediğiniz kullanıcıyı etiketleyin.**");
    }

    // Yeni kullanıcı adı verilip verilmediğini kontrol et
    const newNickname = args.slice(1).join(' ');
    if (!newNickname) {
        return message.reply("⚠️ **Lütfen geçerli bir yeni ad belirtin.**");
    }

    // Kullanıcının kendisinin adı değiştirilip değiştirilemeyeceğini kontrol et
    if (member.user.id === message.author.id) {
        return message.reply("⚠️ **Kendi adınızı değiştiremezsiniz.**");
    }

    // Kullanıcının yetkilerini kontrol et
    if (member.permissions.has('ADMINISTRATOR')) {
        return message.reply("🚫 **Bu kullanıcının yetkileri benden yüksek, ismini değiştiremem.**");
    }

    // Sunucu sahibinin adı değiştirilemiyor
    if (member.user.id === message.guild.ownerId) {
        return message.reply("🚫 **Sunucu sahibinin adı değiştirilemez.**");
    }

    try {
        await member.setNickname(newNickname);

        return message.channel.send(`✅ **${member.user.tag}** kullanıcısının adı başarıyla değiştirildi!`);
    } catch (error) {
        console.error(error);

        // Hata türüne göre mesaj gösterimi
        if (error.code === 50013) {
            return message.reply("🚫 **Bu kullanıcıyı tanımlayamadım, veya yeterli yetkim yok.**");
        }
        return message.reply("❌ **Kullanıcının adı değiştirilirken bir hata oluştu. Lütfen tekrar deneyin.**");
    }
};

exports.help = {
       "name": "ad-değiş",
        "aliases": [
            "ad"
        ],
        "usage": "ad-değiş <@kullanıcı> (yeni adı)",
        "description": "Bir kullanıcının adını değiştirir."
};
