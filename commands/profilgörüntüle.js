exports.execute = async (client, message, args) => {
    // Kendi profilini görüntülemek isteyen kullanıcı
    const targetUser = args.length === 0 
        ? message.author // Kendi bilgilerini görmek isteyen kullanıcı
        : message.mentions.users.first() || client.users.cache.get(args[0]) || client.users.cache.find(user => user.username.toLowerCase() === args.join(" ").toLowerCase()); // Etiketlenen kullanıcı veya ID / İsim ile arama

    // Profil verilerini almak
    try {
        const profile = client.db.get(`profile_${targetUser.id}`);

        if (!profile) {
            return message.reply(`❌ **${targetUser.username} kullanıcısının profili bulunamadı.**`);
        }

        // Profil bilgilerini DM üzerinden göndermek
        const profileEmbed = {
            color: 0x00FF00,
            title: `${targetUser.username} Profil Bilgileri`,
            fields: [
                { name: "Yaş", value: profile.yas, inline: true },
                { name: "İsim", value: profile.isim, inline: true },
                { name: "Soyisim", value: profile.soyisim, inline: true },
                { name: "Hakkımda", value: profile.hakkimda || "Veri yok", inline: false },
                { name: "En Sevdiğim Oyuncu", value: profile.sevdiğimOyuncu || "Veri yok", inline: false },
                { name: "En Sevdiğim Yemek", value: profile.sevdiğimYemek || "Veri yok", inline: false },
                { name: "En Sevdiğim Renk", value: profile.sevdiğimRenk || "Veri yok", inline: false },
                { name: "En Sevdiğim Hobi", value: profile.sevdiğimHobi || "Veri yok", inline: false },
                { name: "En Sevdiğim Hayvan", value: profile.sevdiğimHayvan || "Veri yok", inline: false },
                { name: "En Sevdiğim Film", value: profile.sevdiğimFilm || "Veri yok", inline: false },
                { name: "En Sevdiğim Şarkı", value: profile.sevdiğimSarkı || "Veri yok", inline: false },
                { name: "Doğum Günüm", value: profile.dogumGunum || "Veri yok", inline: false },
                { name: "Aktiflik (Günlük Discord Süresi)", value: profile.aktiflik || "Veri yok", inline: false },
            ],
            timestamp: new Date(),
        };

        // Kullanıcının DM'sine gönder
        try {
            await targetUser.send({ embeds: [profileEmbed] });
            message.reply(`✅ **${targetUser.username} kullanıcısının profili DM üzerinden gönderildi.**`);

            // Mesajı sil
            await message.delete();
        } catch (error) {
            console.error("DM gönderilirken hata oluştu:", error);
            return message.reply(`❌ **${targetUser.username} kullanıcısına DM gönderilemiyor. Profil bilgilerini gösteremiyorum.**`);
        }
    } catch (error) {
        console.error("Profil bilgileri alınırken hata oluştu:", error);
        return message.reply("❌ **Profil bilgileri alınırken bir hata oluştu. Lütfen tekrar deneyin.**");
    }
};

exports.help = {
    name: "profilgörüntüle",
    aliases: ["profil", "görüntüle", "viewprofile"],
    usage: "profilgörüntüle [@kullanıcı | kullanıcıID | kullanıcıAdı]",
    description: "Belirtilen kullanıcının profil bilgilerini görüntüler. Kendi profiliniz için hiçbir şey yazmanıza gerek yok."
};
