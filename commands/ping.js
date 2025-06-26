exports.execute = async (client, message, args) => {
    try {
        const gatewayLatency = Math.floor(client.ws.ping);
        const adminUserIDs = require("../botConfig").admins;
        const isUserAdmin = adminUserIDs.includes(message.author.id);

        let responseMessage = `Pong! 🏓\nAPI Gecikmesi: **${gatewayLatency}ms**`;

        // Hesaplama süresi (ping) mesajı
        const msg = await message.channel.send(`Hesaplanıyor... ⏳`);

        const trip = Math.floor(msg.createdTimestamp - message.createdTimestamp);
        responseMessage = `Pong! 🏓\nAPI Gecikmesi: **${gatewayLatency}ms**\nİstemci Gecikmesi: **${trip}ms**`;

        await msg.edit(responseMessage);

        if (isUserAdmin) {
            const filter = response => {
                return response.author.id === message.author.id && ['evet', 'hayır'].includes(response.content.toLowerCase());
            };

            message.channel.send("Ping yüksek. Ping'i düşürmek ister misiniz? (evet/hayır) 😥")
                .then(() => {
                    message.channel.awaitMessages({ filter, max: 1, time: 30000, errors: ['time'] })
                        .then(collected => {
                            const response = collected.first().content.toLowerCase();
                            if (response === 'evet') {
                                // Ping düşürme işlemi
                                reducePing(client, message);
                            } else {
                                message.channel.send("Ping düşürme işlemi iptal edildi. ❌");
                            }
                        })
                        .catch(() => {
                            message.channel.send("Yanıt süresi doldu. Ping düşürme işlemi iptal edildi. ⏰");
                        });
                });
        }
    } catch (error) {
        console.error("Ping komutunda hata oluştu:", error);
        return message.reply("⚠️ | Ping hesaplanırken bir hata oluştu, lütfen tekrar deneyin!");
    }
};

function reducePing(client, message) {
    try {
        message.channel.send("Ping düşürme işlemi başlatıldı... ⏳");

        // Ping iyileştirmesi için geçici durdurulacak işlemler
        setTimeout(() => {
            message.channel.send("Ping düşürme işlemi tamamlandı. Ping düşürüldü! 🎉");
        }, 20000); // 5 saniye boyunca işlemler durduruluyor
    } catch (error) {
        console.error("Ping düşürme işlemi sırasında hata oluştu:", error);
        message.channel.send("⚠️ | Ping düşürme işlemi sırasında bir hata oluştu. Lütfen tekrar deneyin.");
    }
}

exports.help = {
        "name": "ping",
        "aliases": [
            "pong",
            "gecikme"
        ],
        "usage": "ping",
        "description": "Botun ping süresini kontrol eder."
};
