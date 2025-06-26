// 3 basamakta bir nokta ekleyen fonksiyon
function formatNumber(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

exports.execute = async (client, message, args) => {
    // Kullanıcıyı etiketlemişse, o kullanıcının bakiyesi sorgulanacak, etiketlememişse kendi bakiyesi
    let user = message.mentions.users.first() || message.author;

    try {
        // Kullanıcının bakiyesini al
        let userBalance = await client.eco.fetchMoney(user.id);
        
        // Sayıyı özel formatla biçimlendir
        let formattedBalance = formatNumber(userBalance.amount);

        // Mesajı düz bir şekilde göndermek
        message.channel.send(`💰 | **Bakiye Bilgisi**\n\n` +
            `📌 | **Kullanıcı:** <@${user.id}>\n` +
            `💳 | **Sahip olduğun Destinex sayısı:** \`${formattedBalance}\` <:Destinex:1347644229333028864> \n` +
            `🏆 | **Sıralama:** \`${userBalance.position}\``
        );
    } catch (error) {
        console.error(error);
        // Eğer bir hata oluşursa, hata mesajı verilir
        message.reply("❌ **Bakiye alınırken bir hata oluştu. Lütfen tekrar deneyin.**");
    }
};

exports.help = {
    "name": "bal",
    "aliases": ["para", "bakiye"],
    "usage": "bal",
    "description": "Kullanıcının bakiyesini gösterir."
};
