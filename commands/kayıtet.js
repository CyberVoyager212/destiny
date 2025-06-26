exports.execute = async (client, message, args) => {
    try {
        // Yetki kontrolü
        if (!message.member.permissions.has('MANAGE_ROLES')) {
            return message.reply("⛔ **Bu komutu kullanmak için gerekli iznin yok!**");
        }

        // Komutun doğru formatta kullanıldığını kontrol etme
        if (args.length !== 4) {
            return message.reply("⚠ **Komutun doğru kullanımı:** `k!kayıt @kullanıcı isim yaş cinsiyet`\n\n📝 **Örnek:** `k!kayıt @Ahmet Ahmet 18 male`");
        }

        // Kullanıcıyı al
        const member = message.mentions.members.first();
        if (!member) {
            return message.reply("👤 **Lütfen kayıt edilecek kullanıcıyı etiketleyin!**\n\n📝 **Örnek:** `k!kayıt @Ahmet Ahmet 18 male`");
        }

        // Parametreleri al
        const isim = args[1];
        const yas = args[2];
        const cinsiyet = args[3].toLowerCase();

        if (!isim || !yas || !cinsiyet || isNaN(yas)) {
            return message.reply("⚠ **Lütfen geçerli bir isim, yaş ve cinsiyet belirtin!**\n\n📝 **Örnek:** `k!kayıt @Ahmet Ahmet 18 male`");
        }

        // Geçerli cinsiyet kontrolü
        const validGenders = { male: "Erkek", female: "Kadın" };
        if (!validGenders[cinsiyet]) {
            return message.reply("⚠ **Lütfen geçerli bir cinsiyet girin:** `male` veya `female`.\n\n📝 **Örnek:** `k!kayıt @Ahmet Ahmet 18 male`");
        }

        const genderRoleName = validGenders[cinsiyet];

        // Rolleri al
        const kayitsizRol = message.guild.roles.cache.find(r => r.name.toLowerCase() === 'kayıtsız');
        const genderRole = message.guild.roles.cache.find(r => r.name === genderRoleName);
        const misafirRole = message.guild.roles.cache.find(r => r.name.toLowerCase() === 'misafir');

        if (!kayitsizRol || !genderRole || !misafirRole) {
            return message.reply("⚠ **Bazı roller eksik!** Lütfen `kayıtsız`, `misafir` ve `Erkek/Kadın` rollerinin sunucuda tanımlandığını kontrol edin.");
        }

        // Botun izinlerini kontrol etme
        if (!message.guild.me.permissions.has('MANAGE_NICKNAMES')) {
            return message.reply("⚠ **Botun kullanıcı adlarını değiştirme izni yok!** Lütfen gerekli izinleri verin.");
        }

        if (!message.guild.me.permissions.has('MANAGE_ROLES')) {
            return message.reply("⚠ **Botun rolleri yönetme izni yok!** Lütfen gerekli izinleri verin.");
        }

        // Kullanıcının ismini güncelleme
        const newNickname = `${isim.charAt(0).toUpperCase() + isim.slice(1)} | ${yas}`;
        await member.setNickname(newNickname);

        // Kayıtsız rolünü kaldır
        if (member.roles.cache.has(kayitsizRol.id)) {
            await member.roles.remove(kayitsizRol);
        }

        // Yeni roller ekle
        await member.roles.add([genderRole, misafirRole]);

        // Başarı mesajı
        return message.channel.send(`✅ **Başarıyla kayıt edildi!** 🎉\n\n👤 **Kullanıcı:** ${member}\n📛 **Yeni Ad:** \`${newNickname}\`\n🎭 **Verilen Roller:** \`${genderRole.name}\`, \`${misafirRole.name}\``);

    } catch (error) {
        console.error(error);
        if (error.message.includes('Missing Permissions')) {
            return message.reply("❌ **Botun gerekli izinleri yok!** Lütfen sunucu yöneticinize danışın.");
        }
        return message.reply("❌ **Kayıt işlemi sırasında bir hata oluştu.** Lütfen tekrar deneyin!");
    }
};

exports.help = {
        "name": "kayıt",
        "aliases": [
            "k"
        ],
        "usage": "kayıt <@kullanıcı> <isim> <yaş> <cinsiyet>",
        "description": "Kullanıcıyı sisteme kaydeder, isim, yaş ve cinsiyet bilgisi girer."
};
