module.exports.help = {
    name: "coinflip",
    aliases: ["flip", "yazıtura"],
    description: "Yazı veya tura atar.",
    usage: "coinflip"
};

module.exports.execute = async (bot, message, args) => {
    // Sunucuya ait emoji ID'lerini buraya ekleyin
    const emoji1 = "<a:dnyor:1347887102951686285>"; // İlk mesaj için (örn: yükleniyor efekti)
    const emoji2 = "<:Destinex:1347644229333028864>"; // Heads sonucu için emoji
    const emoji3 = "<:Destinex2:1347874034020257792>"; // Tails sonucu için emoji

  // İlk olarak bekleme emojisini gönder
    const msg = await message.channel.send(`${emoji1} Para havaya fırlatılıyor...`);

    // 5 saniye bekle
    setTimeout(() => {
        const isHeads = Math.random() < 0.5; // Yazı mı tura mı belirlensin
        const resultEmoji = isHeads ? emoji2 : emoji3; // Hangi emoji gösterilecek
        const resultText = isHeads ? "**Sonuç: Yazı!**" : "**Sonuç: Tura!**"; // Yazı mı tura mı?

        // Mesajı güncelle
        msg.edit(`${resultEmoji} ${resultText}`);
    }, 5000);
};
