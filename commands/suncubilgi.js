const { MessageActionRow, MessageButton } = require("discord.js");

exports.execute = async (client, message, args) => {
    const { guild } = message;

    try {
        // Sunucu sahibini al
        const owner = await guild.fetchOwner();
        const createdAt = new Date(guild.createdTimestamp).toLocaleDateString('tr-TR');
        const totalMembers = guild.memberCount;
        const onlineMembers = guild.members.cache.filter(member => member.presence && member.presence.status === 'online').size;
        const boosts = guild.premiumSubscriptionCount || 0;
        const verificationLevel = guild.verificationLevel;
        const rolesCount = guild.roles.cache.size;
        const textChannelsCount = guild.channels.cache.filter(channel => channel.type === 'text').size;
        const voiceChannelsCount = guild.channels.cache.filter(channel => channel.type === 'voice').size;

        // Durum mesajını oluştur
        let infoMessage = `
        **${guild.name} Sunucu Bilgisi**\n
        :id: **Sunucu ID:** ${guild.id}\n
        :calendar: **Oluşturulma Tarihi:** ${createdAt}\n
        :crown: **Sahibi:** <@${owner.id}>\n
        :busts_in_silhouette: **Üye Sayısı:** ${totalMembers} Toplam, ${onlineMembers} Çevrimiçi\n
        :sparkles: **Takviye Sayısı:** ${boosts} Takviye\n
        :speech_balloon: **Kanal Sayısı:** ${textChannelsCount} Yazı | ${voiceChannelsCount} Ses\n
        :earth_africa: **Diğer Bilgiler:** Doğrulama Seviyesi: ${verificationLevel}\n
        :closed_lock_with_key: **Rol Sayısı:** ${rolesCount} Rol\n
        \n
        **Tüm rolleri görmek için k!roles komutunu kullanın.**\n
        **Tüm kullanıcıları görmek için k!showmembers/k!üyeler komutlarını kullanın.**`;

        // Sunucu bilgilerini gönder
        await message.channel.send(infoMessage);

    } catch (error) {
        console.error('Sunucu bilgileri alınırken hata oluştu:', error);
        return message.reply("❌ **Sunucu bilgileri alınırken bir hata oluştu.**");
    }
};

exports.help = {
    name: "sunucubilgi",
    aliases: ["sb"],
    usage: "sunucubilgi",
    description: "Sunucu bilgilerini gösterir."
};
