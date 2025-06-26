const fs = require("fs");
const path = require("path");
// events klasöründeki mesajlar.json dosyasının tam yolunu belirtiyoruz.
const filtersPath = path.join(__dirname, "..", "events", "mesajlar.json");

exports.execute = async (client, message, args) => {
    if (!message.member.permissions.has("MANAGE_CHANNELS")) {
        return message.reply("Bu komutu kullanmak için `KANALLARI_YÖNET` yetkisine sahip olmalısın.");
    }

    // Alt komut: ekle, sil, liste
    const subcommand = args[0]?.toLowerCase();
    if (!subcommand || !["ekle", "sil", "liste"].includes(subcommand)) {
        return message.reply("Lütfen geçerli bir alt komut belirtin: `ekle`, `sil`, `liste`.");
    }

    // Filtreleri JSON dosyasından okuyalım
    let filters = [];
    try {
        const data = fs.readFileSync(filtersPath, "utf8");
        filters = JSON.parse(data);
    } catch (error) {
        console.error("mesajlar.json okunurken hata oluştu:", error);
    }

    if (subcommand === "ekle") {
        const mentionedChannel = message.mentions.channels.first();
        if (!mentionedChannel) {
            return message.reply("Lütfen bir kanal etiketleyin. **Örnek:** `k!engel ekle #kanal kelime`");
        }

        const filterParam = args.slice(2).join(" ");
        if (!filterParam) {
            return message.reply("Lütfen eklemek istediğiniz filtre(leri) belirtin. **Örnek:** `k!engel ekle #kanal kelime, #sayı#`");
        }

        // Virgülle ayrılmış filtreleri diziye çeviriyoruz.
        let newFilters = filterParam.split(",").map(x => x.trim()).filter(x => x.length > 0);
        if (newFilters.length === 0) {
            return message.reply("Lütfen geçerli filtre(ler) girin.");
        }

        const existingFilter = filters.find(f => f.channelId === mentionedChannel.id);
        if (existingFilter) {
            // Eğer mevcut filtre string ise diziye çevir.
            if (!Array.isArray(existingFilter.allowedMessage)) {
                existingFilter.allowedMessage = [existingFilter.allowedMessage];
            }
            // Yeni filtre(leri) ekle (tekrarlı eklemeyi engelle)
            newFilters.forEach(f => {
                if (!existingFilter.allowedMessage.includes(f)) {
                    existingFilter.allowedMessage.push(f);
                }
            });
        } else {
            filters.push({ channelId: mentionedChannel.id, allowedMessage: newFilters });
        }

        try {
            fs.writeFileSync(filtersPath, JSON.stringify(filters, null, 4));
            return message.reply(`✅ **${mentionedChannel}** kanalına filtre olarak \`${newFilters.join(", ")}\` eklendi.`);
        } catch (error) {
            console.error("mesajlar.json kaydedilirken hata oluştu:", error);
            return message.reply("❌ Bir hata oluştu. Lütfen tekrar deneyin.");
        }
    }
    else if (subcommand === "sil") {
        const mentionedChannel = message.mentions.channels.first();
        if (!mentionedChannel) {
            return message.reply("Lütfen bir kanal etiketleyin. **Örnek:** `k!engel sil #kanal`");
        }

        const filterIndex = filters.findIndex(f => f.channelId === mentionedChannel.id);
        if (filterIndex === -1) {
            return message.reply(`**${mentionedChannel}** kanalında ayarlı bir filtre bulunmuyor.`);
        }

        // Opsiyonel olarak silinecek filtre(ler) belirtilmişse sadece onları kaldır.
        const filterParamToRemove = args.slice(2).join(" ").trim();
        if (filterParamToRemove) {
            let removeFilters = filterParamToRemove.split(",").map(x => x.trim()).filter(x => x.length > 0);
            let channelFilter = filters[filterIndex];
            if (!Array.isArray(channelFilter.allowedMessage)) {
                channelFilter.allowedMessage = [channelFilter.allowedMessage];
            }
            channelFilter.allowedMessage = channelFilter.allowedMessage.filter(f => !removeFilters.includes(f));
            // Eğer tüm filtreler kaldırıldıysa, silinen filtre satırını tamamen kaldır.
            if (channelFilter.allowedMessage.length === 0) {
                filters.splice(filterIndex, 1);
            }
            try {
                fs.writeFileSync(filtersPath, JSON.stringify(filters, null, 4));
                return message.reply(`✅ **${mentionedChannel}** kanalından belirtilen filtre(ler) kaldırıldı.`);
            } catch (error) {
                console.error("mesajlar.json kaydedilirken hata oluştu:", error);
                return message.reply("❌ Bir hata oluştu. Lütfen tekrar deneyin.");
            }
        } else {
            // Hiçbir filtre parametresi verilmemişse, tüm filtreleri kaldır.
            filters.splice(filterIndex, 1);
            try {
                fs.writeFileSync(filtersPath, JSON.stringify(filters, null, 4));
                return message.reply(`✅ **${mentionedChannel}** kanalındaki tüm filtreler kaldırıldı.`);
            } catch (error) {
                console.error("mesajlar.json kaydedilirken hata oluştu:", error);
                return message.reply("❌ Bir hata oluştu. Lütfen tekrar deneyin.");
            }
        }
    }
    else if (subcommand === "liste") {
        // İsteğe bağlı olarak kanal belirtilebilir
        const mentionedChannel = message.mentions.channels.first();
        if (mentionedChannel) {
            const channelFilter = filters.find(f => f.channelId === mentionedChannel.id);
            if (!channelFilter) {
                return message.reply(`**${mentionedChannel}** kanalında filtre ayarlı değil.`);
            } else {
                let filtersDisplay = Array.isArray(channelFilter.allowedMessage)
                    ? channelFilter.allowedMessage.join(", ")
                    : channelFilter.allowedMessage;
                return message.reply(`**${mentionedChannel}** kanalında ayarlı filtre: \`${filtersDisplay}\``);
            }
        } else {
            if (filters.length === 0) {
                return message.reply("Herhangi bir filtre ayarlı değil.");
            }
            const listStr = filters.map(f => {
                let display = Array.isArray(f.allowedMessage)
                    ? f.allowedMessage.join(", ")
                    : f.allowedMessage;
                return `<#${f.channelId}>: \`${display}\``;
            }).join("\n");
            return message.reply("Ayarlanan filtreler:\n" + listStr);
        }
    }
};

exports.help = {
    "name": "engel",
    "aliases": ["mesajengel"],
    "usage": "engel <ekle/sil/liste> #kanal [filtre]",
    "description": "Belirtilen kanalda sadece belirli mesajların yazılmasını sağlar."
};
