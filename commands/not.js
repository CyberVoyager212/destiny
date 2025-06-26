exports.execute = async (client, message, args) => {
    // Kullanıcıdan gelen alt komut (ekle, sil, düzenle, göster)
    const subcommand = args[0];
    
    if (!subcommand) {
        return message.reply("⚠️ **Lütfen bir alt komut belirtin: ekle, sil, düzenle, veya göster.**");
    }

    // **Ekleme** Komutu (not ekleme)
    if (subcommand.toLowerCase() === "ekle") {
        const note = args.slice(1).join(" ");
        if (!note) {
            return message.reply("⚠️ **Lütfen bir not girin!**");
        }

        try {
            client.db.set(`note_${message.author.id}`, note);
            return message.reply(`✅ **Notunuz başarıyla kaydedildi!**`);
        } catch (error) {
            console.error("Not eklenirken hata oluştu:", error);
            return message.reply("❌ **Not eklenirken bir hata oluştu. Lütfen tekrar deneyin.**");
        }
    }

    // **Silme** Komutu (not silme)
    else if (subcommand.toLowerCase() === "sil") {
        try {
            client.db.delete(`note_${message.author.id}`);
            return message.reply("✅ **Notunuz başarıyla silindi!**");
        } catch (error) {
            console.error("Not silinirken hata oluştu:", error);
            return message.reply("❌ **Not silinirken bir hata oluştu. Lütfen tekrar deneyin.**");
        }
    }

    // **Düzenleme** Komutu (3 alt komuta ayrılmıştır)
    else if (subcommand.toLowerCase() === "düzenle") {
        // ikinci argüman: ekle, sil veya değiştir
        const editAction = args[1];
        if (!editAction) {
            return message.reply("⚠️ **Lütfen düzenleme işlemi için bir alt komut belirtin: ekle, sil, veya değiştir.**");
        }

        // Öncelikle mevcut notu alıyoruz; yoksa boş string olarak düşünüyoruz.
        let note = client.db.get(`note_${message.author.id}`) || "";
        
        // Alt komutları ayırıyoruz
        if (editAction.toLowerCase() === "ekle") {
            // Kullanıcının eklemek istediği metin
            const appendText = args.slice(2).join(" ");
            if (!appendText) {
                return message.reply("⚠️ **Lütfen eklemek için bir metin girin!**");
            }
            try {
                // Not boşsa doğrudan metni, doluysa boşluk ile ayırarak ekle
                note = note ? note + " " + appendText : appendText;
                client.db.set(`note_${message.author.id}`, note);
                return message.reply(`✅ **Notunuza başarıyla eklendi!**\nYeni Not: ${note}`);
            } catch (error) {
                console.error("Not düzenlenirken hata oluştu:", error);
                return message.reply("❌ **Not düzenlenirken bir hata oluştu. Lütfen tekrar deneyin.**");
            }
        } 
        else if (editAction.toLowerCase() === "sil") {
            // Kullanım: k!not düzenle sil <kelime|harf> <değer>
            const silTip = args[2];
            const target = args.slice(3).join(" ");
            if (!silTip || !target) {
                return message.reply("⚠️ **Lütfen 'sil' için tür (kelime veya harf) ve silinecek değeri girin!**");
            }
            try {
                if (silTip.toLowerCase() === "kelime") {
                    // Kelimeleri boşluklardan ayırarak filtreliyoruz
                    const words = note.split(" ");
                    // Tüm eşleşen kelimeleri kaldırıyoruz
                    const filteredWords = words.filter(word => word !== target);
                    note = filteredWords.join(" ");
                } else if (silTip.toLowerCase() === "harf") {
                    // Tüm eşleşen harfleri kaldırmak için replace kullanıyoruz
                    // RegExp oluştururken global ve case insensitive seçeneklerini ekleyebilirsiniz
                    const regex = new RegExp(target, "gi");
                    note = note.replace(regex, "");
                } else {
                    return message.reply("⚠️ **Lütfen 'sil' için geçerli bir tür belirtin: kelime veya harf.**");
                }
                client.db.set(`note_${message.author.id}`, note);
                return message.reply(`✅ **Notunuzdan başarıyla silindi!**\nYeni Not: ${note}`);
            } catch (error) {
                console.error("Not düzenlenirken hata oluştu:", error);
                return message.reply("❌ **Not düzenlenirken bir hata oluştu. Lütfen tekrar deneyin.**");
            }
        } 
        else if (editAction.toLowerCase() === "değiştir") {
            // Kullanım: k!not düzenle değiştir <kelime|harf> <index> <yeni değer>
            const degistirTip = args[2];
            const index = args[3];
            const newValue = args.slice(4).join(" ");
            if (!degistirTip || index === undefined || !newValue) {
                return message.reply("⚠️ **Lütfen 'değiştir' için tür (kelime veya harf), index ve yeni değeri girin!**");
            }
            try {
                if (degistirTip.toLowerCase() === "kelime") {
                    // Notu boşluklardan ayırıyoruz
                    let words = note.split(" ");
                    const idx = parseInt(index);
                    if (isNaN(idx) || idx < 0 || idx >= words.length) {
                        return message.reply("⚠️ **Geçersiz kelime index'i!**");
                    }
                    words[idx] = newValue;
                    note = words.join(" ");
                } else if (degistirTip.toLowerCase() === "harf") {
                    // Stringi diziye çevirip indexteki harfi değiştiriyoruz
                    let chars = note.split("");
                    const idx = parseInt(index);
                    if (isNaN(idx) || idx < 0 || idx >= chars.length) {
                        return message.reply("⚠️ **Geçersiz harf index'i!**");
                    }
                    chars[idx] = newValue;
                    note = chars.join("");
                } else {
                    return message.reply("⚠️ **Lütfen 'değiştir' için geçerli bir tür belirtin: kelime veya harf.**");
                }
                client.db.set(`note_${message.author.id}`, note);
                return message.reply(`✅ **Notunuz başarıyla güncellendi!**\nYeni Not: ${note}`);
            } catch (error) {
                console.error("Not düzenlenirken hata oluştu:", error);
                return message.reply("❌ **Not düzenlenirken bir hata oluştu. Lütfen tekrar deneyin.**");
            }
        } else {
            return message.reply("⚠️ **Geçersiz düzenleme alt komutu! Lütfen 'ekle', 'sil' veya 'değiştir' kullanın.**");
        }
    }

    // **Gösterme** Komutu (notu gösterme)
    else if (subcommand.toLowerCase() === "göster") {
        const note = client.db.get(`note_${message.author.id}`);
        if (!note) {
            return message.reply("⚠️ **Henüz kaydedilmiş bir notunuz yok.**");
        }
        return message.reply(`📄 **Notunuz:** ${note}`);
    }

    // Geçersiz alt komut
    else {
        return message.reply("⚠️ **Geçersiz alt komut! Lütfen 'ekle', 'sil', 'düzenle' veya 'göster' kullanın.**");
    }
};

exports.help = {
    name: "not",
    aliases: ["notlar", "kaydet"],
    usage: "k!not <ekle | sil | düzenle | göster> [not]",
    description: "Kullanıcıların notlarını eklemelerine, silmelerine, düzenlemelerine ve görüntülemelerine olanak sağlar. Düzenle komutu 'ekle', 'sil' ve 'değiştir' alt komutlarına ayrılmıştır."
};
