const { MessageActionRow, MessageButton } = require('discord.js');

exports.execute = async (client, message, args) => {
    if (!message.member.permissions.has('MANAGE_CHANNELS')) {
        return message.reply("❌ **Bu komutu kullanmak için 'Kanal Yönetimi' iznine sahip olmalısınız.**");
    }

    const member = message.mentions.members.first();
    if (!member) {
        return message.reply("⚠️ **Lütfen görüntüleme iznini kaldırmak istediğiniz kullanıcıyı etiketleyin.**");
    }

    try {
        // Kullanıcının iznini kaldır
        await message.channel.permissionOverwrites.edit(member, { VIEW_CHANNEL: false });

        // Başarı mesajı
        await message.channel.send(`✅ **${member.user.tag}** artık bu kanalı görüntüleyemeyecek.`);
    } catch (error) {
        console.error("İzin değiştirilirken hata:", error);
        return message.reply("❌ **İzinler değiştirilirken bir hata oluştu.**");
    }
};

exports.help = {
        "name": "denyview",
        "aliases": [],
        "usage": "denyview <@kullanıcı>",
        "description": "Belirtilen kullanıcı için belirli bir görünürlük engellemesi yapar."
};
