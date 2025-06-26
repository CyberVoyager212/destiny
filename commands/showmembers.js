module.exports = {
    async execute(client, message, args) {
        try {
            // Yetki kontrolü
            if (!message.member.permissions.has('VIEW_AUDIT_LOG')) {
                return message.reply("❌ Bu komutu kullanmak için yeterli yetkiniz yok.");
            }

            // Üyeleri al
            const members = message.guild.members.cache.map(member => `${member.user.tag} (${member.id})`);
            
            // Eğer üyeler boşsa
            if (!members.length) {
                return message.reply("❌ Sunucuda hiç üye bulunamadı.");
            }

            // Chunk fonksiyonu (2000 karakterden uzun olanları bölmek için)
            function chunkArray(array, maxLength) {
                let chunks = [];
                let currentChunk = "";
                
                array.forEach(item => {
                    if ((currentChunk + item + "\n").length > maxLength) {
                        chunks.push(currentChunk);
                        currentChunk = "";
                    }
                    currentChunk += item + "\n";
                });

                if (currentChunk) chunks.push(currentChunk);
                return chunks;
            }

            // Mesajı 2000 karakterlik parçalara böl
            const chunks = chunkArray(members, 1000);

            // Parça parça mesaj gönder
            for (const chunk of chunks) {
                await message.channel.send(`\`\`\`${chunk}\`\`\``);
            }

        } catch (error) {
            console.error(error);
            // Hata durumunda kullanıcıya bildirim gönder
            message.reply("❌ Üyeler listelenirken bir hata oluştu. Lütfen tekrar deneyin.");
        }
    },

    help: {
        name: "showmembers",
        aliases: ["üyeler"],
        usage: "showmembers",
        description: "Sunucudaki tüm üyelerin tag ve ID bilgilerini 2000 karakter sınırına uygun şekilde listeler."
    }
};
