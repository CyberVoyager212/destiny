const figlet = require("figlet");

module.exports.help = {
    name: "ascii",
    aliases: ["textart", "ascii-art"],
    description: "Verilen metni ASCII sanatı olarak dönüştürür.",
    usage: "ascii <metin>"
};

module.exports.execute = async (bot, message, args) => {
    if (!args[0]) return message.channel.send("Lütfen bir metin girin!");

    const msg = args.join(" ");

    figlet.text(msg, (err, data) => {
        if (err) {
            console.log("Bir hata oluştu:", err);
            return message.channel.send("Bir hata oluştu, lütfen tekrar deneyin.");
        }

        if (data.length <= 2000) {
            return message.channel.send("```" + data + "```");
        }

        const chunks = data.match(/.{1,2000}/g); // Mesajı 2000 karakterlik parçalara ayırır.
        chunks.forEach(chunk => {
            message.channel.send("```" + chunk + "```");
        });
    });
};
