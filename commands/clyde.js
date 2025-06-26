const { MessageAttachment } = require('discord.js');
const fetch = require('node-fetch');

module.exports = {
    config: {
        name: 'clyde',
        description: "Clyde'ın mesaj gibi yazmasını sağlar.",
        aliases: ["clyde"],
        usage: 'clyde <mesaj>',
    },
    run: async (client, message, args) => {
        const text = args.join(' '); 
        if (!text) {
            return message.reply('❎ Lütfen Clyde\'ın yazması için bir mesaj girin.');
        }

        try {
            const response = await fetch(`https://nekobot.xyz/api/imagegen?type=clyde&text=${encodeURIComponent(text)}`);
            const data = await response.json();

            if (!data || !data.message) {
                return message.reply('❎ API\'den geçerli bir yanıt alınamadı, lütfen tekrar deneyin.');
            }

            const attachment = new MessageAttachment(data.message, 'clyde.png');
            return message.channel.send({ files: [attachment] });

        } catch (error) {
            console.error(error);
            return message.reply('❎ Bir hata oluştu, lütfen tekrar deneyin.');
        }
    }
};

// `execute` hatasını önlemek için:
module.exports.execute = module.exports.run;
module.exports.help = {
    name: "clyde",
    description: "Clyde botunun mesajı gibi bir resim oluşturur.",
    usage: "clyde <metin>"
};