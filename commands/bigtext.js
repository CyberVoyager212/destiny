module.exports = {
    async execute(client, message, args) {
        if (!args.length) return message.reply('❌ Lütfen bir metin girin!');

        let text = args.join(' ').toLowerCase();
        let alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');
        let bigText = '';

        for (let char of text) {
            if (alphabet.includes(char)) {
                bigText += `:regional_indicator_${char}: `;
            } else {
                bigText += char + ' ';
            }
        }

        message.channel.send(bigText);
    },

    help: {
        name: 'bigtext',
        aliases: ['büyükmetin'],
        usage: 'k!bigtext <metin>',
        description: 'Girilen metni büyük harfli emojilere çevirir.'
    }
};
