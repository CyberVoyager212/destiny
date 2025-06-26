const { Permissions } = require("discord.js");

exports.execute = async (client, message, args) => {
    // Kullanıcının mesajını silme (yetkisi varsa)
    if (message.deletable) {
        try {
            await message.delete();
        } catch (error) {
            console.log("❌ Mesaj silinirken hata oluştu:", error);
        }
    }

    try {
        const botUser = message.guild.me;

        // Botun yetkilerini al ve düzenle
        const permissions = botUser.permissions.toArray();
        const formattedPermissions = permissions.length > 0 
            ? permissions.map(perm => `✅ ${perm.replace(/_/g, " ")}`).join("\n")
            : "❌ Hiçbir izin bulunmuyor.";

        // Komut listesini al
        const commands = client.commands.size > 0 
            ? [...client.commands.keys()].map(cmd => `📌 ${cmd}`).join("\n") 
            : "❌ Hiçbir komut bulunmuyor.";

        // Mesajı oluştur
        let responseMessage = `🤖 **Bot Bilgi** 🤖\n\n` +
            `📜 **İzinler:**\n${formattedPermissions}\n\n` +
            `🛠 **Komutlar:**\n${commands}\n\n` +
            `📅 **Oluşturulma Tarihi:** ${botUser.user.createdAt.toLocaleDateString()}\n` +
            `📌 **Ping:** ${client.ws.ping}ms`;

        // Mesajı gönder
        await message.channel.send(responseMessage);
    } catch (error) {
        console.log("⚠️ Bir hata oluştu:", error);
        return message.channel.send("❌ **Bir hata oluştu, tekrar deneyin!**");
    }
};

exports.help = {
    name: "bot-bilgi",
    aliases: ["bot-info", "botbilgi", "botinfo"],
    usage: "bot-bilgi",
    description: "Botun yetkilerini ve komutlarını gösterir."
};
