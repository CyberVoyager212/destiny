const { MessageActionRow, MessageButton } = require("discord.js"); // Button kullanımı için
const femaleNames = [
    'Ayşe', 'Fatma', 'Elif', 'Merve', 'Zeynep', 'Hatice', 'Emine', 'Rabia', 'Aylin', 'Derya',
    'Gül', 'Bahar', 'Melike', 'Gamze', 'Pelin', 'Sibel', 'Selin', 'Ebru', 'Esra', 'Burcu',
    'Hande', 'Deniz', 'Tuğba', 'Büşra', 'Şeyma', 'Özge', 'Nazlı', 'Aslı', 'Ceren', 'Ece',
    'Dilara', 'Aysel', 'Feride', 'Filiz', 'Aysu', 'Aydan', 'Seda', 'Sevda', 'Sevim', 'Serap',
    'Naz', 'Beyza', 'Gizem', 'Leyla', 'İpek', 'Aylin', 'Yeşim', 'Funda', 'Nil', 'Nazan',
    'Neşe', 'Dilek', 'Çağla', 'Yasemin', 'Gülsüm', 'Sevil', 'Suna', 'Elvan', 'Canan', 'Seher',
    'Gülşen', 'Hale', 'Jale', 'Zehra', 'Serra', 'Özlem', 'Gonca', 'Gülcan', 'Nur', 'Betül',
    'Işıl', 'Zeliha', 'Açelya', 'Esen', 'Gaye', 'Gülay', 'Hilal', 'Melis', 'Eylül', 'Başak',
    'Sevgi', 'Şirin', 'Suna', 'Yonca', 'Şeyda', 'Elvan', 'Güliz', 'Irmak', 'Berrin', 'Esin',
    'Nihan', 'Belgin', 'Bengü', 'Ceyda', 'Gülseren', 'Hicran', 'İnci', 'Nurcan', 'Pelin', 'Reyhan',
    'Sevinç', 'Sibel', 'Simge', 'Şermin', 'Tülay', 'Ülkü', 'Yelda', 'Zehra', 'Ahu', 'Aysun',
    'Berna', 'Çağrı', 'Demet', 'Dilan', 'Eda', 'Esma', 'Feyza', 'Gülnur', 'Hümeyra', 'Ilgın',
    'Jülide', 'Leman', 'Melike', 'Nalan', 'Nazife', 'Necla', 'Neval', 'Perran', 'Saadet', 'Sahra',
    'Şükriye', 'Tansu', 'Ümmü', 'Yasemin', 'Zeyno', 'Aydan', 'Bade', 'Beril', 'Cansel', 'Çiğdem',
    'Derya', 'Eylem', 'Feray', 'Gülbin', 'Hanzade', 'İlayda', 'Jale', 'Kübra', 'Lale', 'Mehlika'
];

const maleNames = [
    'Ahmet', 'Mehmet', 'Ali', 'Mustafa', 'Murat', 'Hasan', 'Hüseyin', 'İbrahim', 'Yusuf', 'Ömer',
    'Emre', 'Can', 'Kemal', 'Mahmut', 'Rıza', 'Serkan', 'Cem', 'Furkan', 'Uğur', 'Onur',
    'Burak', 'Kaan', 'Hakan', 'Volkan', 'Tamer', 'Barış', 'Eren', 'Arda', 'Okan', 'Ege',
    'Yunus', 'Gökhan', 'Sinan', 'Deniz', 'Metin', 'Salih', 'Rıdvan', 'Sefa', 'Mert', 'Fırat',
    'Kadir', 'Süleyman', 'Bekir', 'Ferhat', 'Tuna', 'Tuncay', 'Cihan', 'Levent', 'Erdem', 'Cengiz',
    'Tayfun', 'Tolga', 'Görkem', 'Anıl', 'Oğuz', 'Ertuğrul', 'Erhan', 'Efe', 'Yılmaz', 'Veysel',
    'Veli', 'Vedat', 'Mehmet Ali', 'Ahmet Can', 'Mustafa Kemal', 'Kemalettin', 'Ali Kemal', 'Fatih', 'Zafer', 'Engin',
    'Aydın', 'Adnan', 'Şahin', 'Özcan', 'Alper', 'Samet', 'Halil', 'Harun', 'Kürşat', 'Cemal',
    'Zafer', 'Ramazan', 'Recep', 'Mevlüt', 'Fuat', 'Bora', 'Ata', 'Ufuk', 'Tuncer', 'Rüstem',
    'Melih', 'Sami', 'Serdar', 'Ferdi', 'Cevdet', 'Ender', 'Cemil', 'Orhan', 'Erkan', 'Kamil',
    'Tahir', 'Kazım', 'Cemalettin', 'Sabri', 'Sadi', 'Emin', 'Nihat', 'Nevzat', 'Nurettin', 'Şükrü',
    'Bülent', 'Burhan', 'Turgut', 'Suat', 'Sabahattin', 'Fikret', 'Alpay', 'Gökay', 'Tayyar', 'Behçet',
    'Hikmet', 'Atilla', 'Selçuk', 'İlker', 'Koray', 'Sarp', 'Korhan', 'Nejat', 'Ozan', 'Utku',
    'Hüsnü', 'Orçun', 'Tufan', 'Bünyamin', 'Naci', 'Hasan Hüseyin', 'Osman', 'Bilal', 'Necati', 'Nazım'
];

exports.execute = async (client, message, args) => {
    try {
        // Check if the message author has the "Hang | Unregistered" role
        let unregisteredRole = message.guild.roles.cache.find(role => role.name === "Hang | Unregistered");
        let femaleRole = message.guild.roles.cache.find(role => role.name === "Hang | Female");
        let maleRole = message.guild.roles.cache.find(role => role.name === "Hang | Male");

        if (!unregisteredRole || !femaleRole || !maleRole) {
            return message.reply("⚠️ Gerekli roller bulunamadı. Lütfen sunucu yöneticisi ile iletişime geçin.");
        }

        let unregisteredMembers = message.guild.members.cache.filter(member => member.roles.cache.has(unregisteredRole.id));
        
        if (unregisteredMembers.size === 0) {
            return message.reply("❌ Kayıt edilecek '' rolüne sahip üye bulunamadı.");
        }

        unregisteredMembers.forEach(async (member) => {
            try {
                // Remove the "Hang | Unregistered" role
                await member.roles.remove(unregisteredRole);

                // Assign a random role and update the username
                let age = Math.floor(Math.random() * 7) + 15; // Random age between 15 and 21
                let newName;

                if (Math.random() < 0.5) {
                    // Assign female role
                    await member.roles.add(femaleRole);
                    newName = `${femaleNames[Math.floor(Math.random() * femaleNames.length)]} | ${age}`;
                } else {
                    // Assign male role
                    await member.roles.add(maleRole);
                    newName = `${maleNames[Math.floor(Math.random() * maleNames.length)]} | ${age}`;
                }

                // Change the user's nickname
                await member.setNickname(newName);
            } catch (error) {
                console.error(`Kullanıcı ${member.user.tag} için hata: ${error}`);
            }
        });

        return message.reply(`✅ Toplam ${unregisteredMembers.size} üye başarıyla kaydedildi.`);
    } catch (error) {
        console.error("Genel hata:", error);
        return message.reply("❌ Bir hata oluştu, lütfen tekrar deneyin.");
    }
};

exports.help = {
    name: "registerAll",
    aliases: ["ra"],
    usage: "registerAll",
    description: "Kayıtsız üyeleri random olarak kaydeder ve isimlerini günceller."
};
