exports.execute = async (client, message, args) => {
    // Kullanıcının "BAN_MEMBERS" yetkisini kontrol et
    if (!message.member.permissions.has('BAN_MEMBERS')) {
        return message.reply("🚫 **Bu komutu kullanmak için `Ban Üyeler` yetkiniz yok.**");
    }

    // Etiketlenen üyeyi al
    const member = message.mentions.members.first();
    if (!member) {
        return message.reply("⚠️ **Lütfen banlanacak kullanıcıyı etiketleyin.**");
    }

    // Sebep kısmı
    let reason = args.slice(1).join(" ");
    if (!reason) reason = "Belirtilmemiş";

    // Kullanıcının kendisiyle ilgili ban işlemi yapıp yapamayacağımızı kontrol et
    if (member.id === message.author.id) {
        return message.reply("⚠️ **Kendi kendinizi banlayamazsınız.**");
    }

    // Sunucu sahibini banlama kontrolü
    if (member.id === message.guild.ownerId) {
        return message.reply("🚫 **Sunucu sahibini banlayamazsınız.**");
    }

    // Kullanıcının yetkilerini kontrol et
    if (member.permissions.has('ADMINISTRATOR')) {
        return message.reply("🚫 **Bu kullanıcının yetkileri benden yüksek, banlayamam.**");
    }

    try {
        // Ban işlemini gerçekleştir
        await member.ban({ reason });
        // Kullanıcıya başarı mesajı gönder
        message.channel.send(`✅ **${member.user.tag}** başarıyla banlandı.\nSebep: **${reason}**`);

    } catch (error) {
        console.error(error);
        // Hata mesajı
        message.reply("❌ **Kullanıcı banlanırken bir hata oluştu. Lütfen tekrar deneyin.**");
    }
};

exports.help = {
        "name": "ban",
        "aliases": [],
        "usage": "ban <@kullanıcı> [sebep]",
        "description": "Bir kullanıcıyı sunucudan yasaklar."
};
