exports.execute = async (client, message, args) => {
    const subcommand = args[0];
    if (!subcommand) {
        return message.reply("⚠️ **Lütfen bir alt komut belirtin: işleme veya sil.**");
    }

    if (subcommand.toLowerCase() === "işleme") {
        // Tüm verileri subcommand'tan sonraki argümanları tek string olarak al
        let dataString = args.slice(1).join(" ");
        // Noktalı virgül (;) ile ayırıp her parçayı temizle
        let parts = dataString.split(";").map(p => p.trim());
        
        // 13 adet alan bekliyoruz: 
        // [0]=yaş, [1]=isim, [2]=soyisim, [3]=hakkımda, [4]=en sevdiğim oyuncu,
        // [5]=en sevdiğim yemek, [6]=en sevdiğim renk, [7]=en sevdiğim hobi,
        // [8]=en sevdiğim hayvan, [9]=en sevdiğim film, [10]=en sevdiğim şarkı,
        // [11]=doğum günüm, [12]=aktiflik
        if (parts.length < 13) {
            return message.reply("⚠️ **Lütfen tüm alanları girin. Eksik alanları boş bırakmak için sadece noktalı virgül (;) kullanın.**");
        }

        const userInfo = {
            yas: parts[0] || "Veri yok",
            isim: parts[1] || "Veri yok",
            soyisim: parts[2] || "Veri yok",
            hakkimda: parts[3] || "Veri yok",
            sevdiğimOyuncu: parts[4] || "Veri yok",
            sevdiğimYemek: parts[5] || "Veri yok",
            sevdiğimRenk: parts[6] || "Veri yok",
            sevdiğimHobi: parts[7] || "Veri yok",
            sevdiğimHayvan: parts[8] || "Veri yok",
            sevdiğimFilm: parts[9] || "Veri yok",
            sevdiğimSarkı: parts[10] || "Veri yok",
            dogumGunum: parts[11] || "Veri yok",
            aktiflik: parts[12] || "Veri yok",
        };

        // Kontroller
        if (userInfo.yas !== "Veri yok" && !/^\d{1,3}$/.test(userInfo.yas)) {
            return message.reply("⚠️ **Yaş, yalnızca sayı olmalı ve en fazla 3 haneli olmalıdır.**");
        }
        if (userInfo.isim !== "Veri yok" && (!/^[a-zA-Z\s]+$/.test(userInfo.isim) || userInfo.isim.length > 50)) {
            return message.reply("⚠️ **İsim yalnızca harflerden oluşmalı ve en fazla 50 karakter olmalıdır.**");
        }
        if (userInfo.soyisim !== "Veri yok" && (!/^[a-zA-Z\s]+$/.test(userInfo.soyisim) || userInfo.soyisim.length > 50)) {
            return message.reply("⚠️ **Soyisim yalnızca harflerden oluşmalı ve en fazla 50 karakter olmalıdır.**");
        }
        if (userInfo.hakkimda.length > 250) {
            return message.reply("⚠️ **Hakkımda bölümü 250 karakteri geçemez.**");
        }
        if (userInfo.aktiflik !== "Veri yok" && !/^\d{1,2}$/.test(userInfo.aktiflik)) {
            return message.reply("⚠️ **Aktiflik yalnızca sayı olmalı ve en fazla 2 haneli olmalıdır.**");
        }

        try {
            client.db.set(`profile_${message.author.id}`, userInfo);
            return message.reply("✅ **Profil bilgileri başarıyla kaydedildi!**");
        } catch (error) {
            console.error("Profil bilgileri kaydedilirken hata oluştu:", error);
            return message.reply("❌ **Profil bilgileri kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.**");
        }
    } else if (subcommand.toLowerCase() === "sil") {
        try {
            client.db.delete(`profile_${message.author.id}`);
            return message.reply("✅ **Profil bilgileri başarıyla silindi!**");
        } catch (error) {
            console.error("Profil bilgileri silinirken hata oluştu:", error);
            return message.reply("❌ **Profil bilgileri silinirken bir hata oluştu. Lütfen tekrar deneyin.**");
        }
    } else {
        return message.reply("⚠️ **Geçersiz alt komut! Lütfen 'işleme' veya 'sil' kullanın.**");
    }
};

exports.help = {
    name: "hakkımda",
    aliases: ["profile", "kimlik"],
    usage: "hakkımda işleme <yaş> ; <isim> ; <soyisim> ; <hakkımda> ; <en sevdiğim oyuncu> ; <en sevdiğim yemek> ; <en sevdiğim renk> ; <en sevdiğim hobi> ; <en sevdiğim hayvan> ; <en sevdiğim film> ; <en sevdiğim şarkı> ; <doğum günü> ; <aktiflik> | hakkımda sil",
    description: "Kullanıcı hakkında bilgileri kaydeder, günceller veya siler."
};
