exports.execute = async (client, message, args) => {
    try {
        if (!message.member.permissions.has('ADMINISTRATOR')) {
            return message.reply("⛔ **Bu komutu kullanmak için** `Yönetici (Administrator)` **iznine sahip olmalısın!**");
        }

        const botId = client.user.id;
        const inviteLink = `https://discord.com/oauth2/authorize?client_id=${botId}&permissions=8&scope=bot`;

        return message.reply(`🤖 **Botu sunucuna eklemek için aşağıdaki bağlantıya tıkla:**\n🔗 [Davet linki](${inviteLink})`);
    } catch (error) {
        console.error("⚠️ Davet linki gönderilirken bir hata oluştu:", error);
        return message.reply("❌ **Davet linki oluşturulurken bir hata meydana geldi, lütfen tekrar dene!**");
    }
};

exports.help = {
    name: "bot-davet",
    aliases: ["davet"],
    usage: "bot-davet",
    description: "Botun davet linkini oluşturur."
};
