exports.execute = async (client, message, args) => {
    try {
        const member = message.mentions.members.first() ||
                       message.guild.members.cache.get(args[0]) ||
                       message.guild.members.cache.find(m => m.user.username.toLowerCase() === args[0]?.toLowerCase()) ||
                       message.member;

        const adminCheck = message.member.permissions.has("ADMINISTRATOR");

        if (member !== message.member && !adminCheck) {
            return message.reply("🚫 | Başkasının mute süresini görmek için yetkiniz yok!");
        }

        const muteData = client.db.get(`mute_${message.guild.id}_${member.id}`);

        if (!muteData) {
            return message.reply(`🔊 | **${member.user.username}** şu anda mute'lü değil!`);
        }

        const muteStartTime = muteData.muteTime;
        const muteDurationMs = muteData.duration;
        const muteEndTime = muteStartTime + muteDurationMs;
        const remainingTime = muteEndTime - Date.now();

        const muteRole = message.guild.roles.cache.find(role => role.name === "Muted");

        if (!muteRole) {
            return message.reply("❌ | `Muted` rolü bulunamadı, lütfen bir `Muted` rolü oluşturun.");
        }

        let responseMessage = `🔇 | **${member.user.username} Mute Bilgisi** 🔇\n\n`;

        if (remainingTime > 0) {
            responseMessage += `⏳ **Kalan Süre:** ${formatDuration(remainingTime)}`;
        } else {
            responseMessage += `✅ **Mute süresi dolmuş!**`;

            if (member.roles.cache.has(muteRole.id)) {
                await member.roles.remove(muteRole);

                const previousRoles = muteData.roles || [];
                for (const roleId of previousRoles) {
                    const role = message.guild.roles.cache.get(roleId);
                    if (role) await member.roles.add(role);
                }

                client.db.delete(`mute_${message.guild.id}_${member.id}`);
                responseMessage += `\n🔓 **Mute süresi dolduğu için eski roller geri verildi!**`;
            }
        }

        return message.channel.send(responseMessage);
    } catch (error) {
        console.error("⚠️ | Mute süresi sorgulanırken hata oluştu:", error);
        return message.reply("❌ | Mute süresi sorgulanırken bir hata oluştu, lütfen tekrar deneyin.");
    }
};

function formatDuration(ms) {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));

    let result = "";
    if (days > 0) result += `${days} gün `;
    if (hours > 0) result += `${hours} saat `;
    if (minutes > 0) result += `${minutes} dakika `;
    if (seconds > 0) result += `${seconds} saniye`;

    return result.trim() || "1 saniyeden az";
}

exports.help = {
    name: "checkmute",
    aliases: ["mutekontrol"],
    usage: "checkmute <@kullanıcı / ID / isim>",
    description: "Belirtilen kullanıcının mute süresini kontrol eder ve süresi dolmuşsa eski rollerini geri verir."
};
