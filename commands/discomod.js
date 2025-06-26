const { MessageEmbed } = require('discord.js');

// Rastgele renk kodu üretme fonksiyonu
const generateRandomColor = () => {
    const r = Math.floor(Math.random() * 256); // Kırmızı
    const g = Math.floor(Math.random() * 256); // Yeşil
    const b = Math.floor(Math.random() * 256); // Mavi

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

let interval;  // interval'ı global olarak tanımlıyoruz

exports.execute = async (client, message, args) => {
    try {
        // Admin kontrolü
        if (!message.member.permissions.has('ADMINISTRATOR')) {
            return message.reply("⛔ **Bu komutu kullanmak için** `Yönetici (Administrator)` **iznine sahip olmalısın!**");
        }

        // Hedef rolü belirleme
        const role = message.mentions.roles.first();
        if (!role) {
            return message.reply("Lütfen bir rol etiketleyin. Örn: `!discomod @rol`");
        }

        // Eğer interval zaten çalışıyorsa, işlemi durdur
        if (interval) {
            clearInterval(interval); // Renk değiştirmeyi durdur
            interval = null;  // interval'ı sıfırla
            const embed = new MessageEmbed()
                .setColor('#ff0000')
                .setTitle("Rol Rengi Değiştirme Durduruldu")
                .setDescription(`Rol rengi değiştirme işlemi durduruldu.`)
                .addField("Hedef Rol", role.name);

            return message.channel.send({ embeds: [embed] });
        }

        // 6 saniyede bir rol rengini değiştir
        interval = setInterval(async () => {
            const randomColor = generateRandomColor(); // Rastgele renk oluştur
            await role.setColor(randomColor); // Rol rengini değiştir
            console.log(`Rol rengi değiştirildi: ${role.name} -> ${randomColor}`);
        }, 6000); // 6 saniyede bir

        // Komut başlatıldığında bilgi mesajı gönder
        const embed = new MessageEmbed()
            .setColor('#00ff00')
            .setTitle("Rol Rengi Değiştirme Başlatıldı")
            .setDescription(`Rol rengi başarıyla değiştirilmeye başlandı. Bu işlem her 6 saniyede bir gerçekleşecek!`)
            .addField("Hedef Rol", role.name);

        message.channel.send({ embeds: [embed] });

    } catch (error) {
        console.error("⚠️ Hata oluştu:", error);
        message.reply("❌ **Komut çalıştırılırken bir hata oluştu.**");
    }
};

exports.help = {
    name: "discomod",
    description: "Belirtilen rolün rengini her 6 saniyede bir rastgele değiştirir. Yalnızca adminler kullanabilir. Aynı komut ile açıp kapatılabilir.",
    usage: "discomod @rol"
};
