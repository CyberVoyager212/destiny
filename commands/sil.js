const { Permissions } = require("discord.js");

module.exports = {
    name: "sil",
    description: "Belirtilen sayıda mesajı siler. (14 günden eski mesajlar için seçenek sunar)",
    usage: "sil <sayı>",
    aliases: [],

    async execute(client, message, args) {
        try {
            // 0️⃣ Komut mesajını sil (kullanıcı tarafından gönderilen komut mesajı)
            await message.delete();

            // 1️⃣ Yetki Kontrolü
            if (!message.member.permissions.has(Permissions.FLAGS.MANAGE_MESSAGES)) {
                return message.reply("❌ Bu komutu kullanmak için **Mesajları Yönet** yetkisine sahip olmalısın!")
                    .then(msg => setTimeout(() => msg.delete(), 5000));
            }

            // 2️⃣ Argüman Kontrolü ve Değer Alma
            const deleteCountOriginal = parseInt(args[0], 10);
            if (!deleteCountOriginal || deleteCountOriginal < 1) {
                return message.reply("❌ Lütfen silmek istediğiniz geçerli bir sayı belirtin.")
                    .then(msg => setTimeout(() => msg.delete(), 5000));
            }

            let remainingToDelete = deleteCountOriginal;
            let totalDeleted = 0;
            let now = Date.now();
            let deleteOldMessages = false;

            // 3️⃣ Mesajları Önce Çek (sonrasındaki bulkDelete işleminde komut mesajı ve bot mesajları zaten yok)
            const initialFetch = await message.channel.messages.fetch({ limit: Math.min(remainingToDelete, 100) });
            let oldMessages = initialFetch.filter(msg => (now - msg.createdTimestamp) >= 1209600000);

            if (oldMessages.size > 0) {
                const warningMsg = await message.channel.send(
                    `⚠️ **${deleteCountOriginal}** mesaj arasında **14 günden eski** mesajlar var. Bunları silmek istiyor musunuz? (**evet** / **hayır**)`
                );

                const filter = m => m.author.id === message.author.id;
                const collected = await message.channel.awaitMessages({ filter, max: 1, time: 15000 });

                if (collected.size && ["evet", "e"].includes(collected.first().content.toLowerCase())) {
                    deleteOldMessages = true;
                }

                await warningMsg.delete();
                if (collected.size) await collected.first().delete();
            }

            // 4️⃣ Yeni Mesajları Toplu Olarak Silme (bulkDelete yöntemi 14 günden yeni mesajlar için)
            while (remainingToDelete > 0) {
                try {
                    const fetchLimit = Math.min(remainingToDelete, 100);
                    const fetchedMessages = await message.channel.messages.fetch({ limit: fetchLimit });
                    now = Date.now();

                    // Kullanıcının seçimine göre eski mesajları filtrele
                    let messagesToDelete = fetchedMessages.filter(msg => (now - msg.createdTimestamp) < 1209600000);
                    if (deleteOldMessages) {
                        messagesToDelete = fetchedMessages;
                    }

                    if (messagesToDelete.size > 0) {
                        await message.channel.bulkDelete(messagesToDelete, true);
                        totalDeleted += messagesToDelete.size;
                        remainingToDelete -= messagesToDelete.size;
                        await new Promise(resolve => setTimeout(resolve, 500)); // 0.5 saniye bekle
                    } else {
                        break;
                    }
                } catch (error) {
                    if (error.code === 429) {
                        console.log(`⏳ Rate limit aşıldı. Bekleme süresi: ${error.retry_after}ms`);
                        await new Promise(resolve => setTimeout(resolve, error.retry_after));
                    } else {
                        throw error;
                    }
                }
            }

            // 5️⃣ 14 Günden Eski Mesajları Yavaşça Silme (kullanıcı izin verdiyse)
            if (deleteOldMessages && remainingToDelete > 0) {
                let deleteDelay = 500;

                while (remainingToDelete > 0) {
                    const fetchedMessages = await message.channel.messages.fetch({ limit: Math.min(remainingToDelete, 10) });
                    now = Date.now();

                    const oldMessages = fetchedMessages.filter(msg => (now - msg.createdTimestamp) >= 1209600000);
                    if (oldMessages.size === 0) break;

                    for (const msg of oldMessages.values()) {
                        try {
                            await msg.delete();
                            totalDeleted++;
                            remainingToDelete--;

                            // Dinamik bekleme süresi ayarı
                            if (totalDeleted % 5 === 0) deleteDelay += 100;
                            if (totalDeleted % 10 === 0) deleteDelay += 200;

                            await new Promise(resolve => setTimeout(resolve, deleteDelay));
                        } catch (error) {
                            if (error.code === 50013) { // Yetki Hatası
                                return message.reply("❌ Mesajları silmek için yeterli yetkim yok!")
                                    .then(msg => setTimeout(() => msg.delete(), 5000));
                            } else if (error.code === 429) { // Rate limit durumu
                                console.log(`⏳ Rate limit aşıldı. Bekleme süresi: ${error.retry_after}ms`);
                                await new Promise(resolve => setTimeout(resolve, error.retry_after));
                            } else {
                                throw error;
                            }
                        }
                    }
                }
            }

            // 6️⃣ Sonuç Mesajı (otomatik 5 saniye sonra silinir)
            await message.channel.send(`✅ Toplam **${totalDeleted}** mesaj başarıyla silindi!`)
                .then(msg => setTimeout(() => msg.delete(), 5000));

        } catch (error) {
            console.error(error);
            return message.reply("❌ Mesajlar silinirken bir hata oluştu.")
                .then(msg => setTimeout(() => msg.delete(), 5000));
        }
    },

    help: {
        name: "sil",
        aliases: [],
        usage: "sil <sayı>",
        description: "Belirtilen sayıda mesajı siler. 14 günden eski mesajlar için seçenek sunar."
    }
};
