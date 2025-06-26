const { MessageEmbed } = require('discord.js');

exports.execute = async (client, message, args) => {
    try {
        let betAmount = parseInt(args[0], 10);
        let userBalance = await client.eco.fetchMoney(message.author.id);
        const maxBet = 250000;

        if (args[0] === 'all') {
            betAmount = Math.min(userBalance.amount, maxBet);
        }

        if (isNaN(betAmount) || betAmount <= 0) {
            return message.reply("Lütfen geçerli bir bahis miktarı girin.");
        }

        if (betAmount > maxBet) {
            betAmount = maxBet;
        }

        if (userBalance.amount < betAmount) {
            return message.reply(`Yeterli paranız yok. Mevcut paranız: **${userBalance.amount}** <:Destinex:1347644229333028864>.`);
        }

        await client.eco.removeMoney(message.author.id, betAmount);

        const spinningEmoji = "<a:slotd:1347902950349213706>";  
        const slotEmojis = [
            "<:slot1:1347900356742352987>", // 2x
            "<:slot2:1347900360387330099>", // 3x
            "<:slot3:1347900364497883248>"  // 4x
        ];
        const multipliers = {
            "<:slot1:1347900356742352987>": 2,
            "<:slot2:1347900360387330099>": 3,
            "<:slot3:1347900364497883248>": 4
        };

        let slotMessage = await message.channel.send(`
ㅤㅤ**  ___SLOTS___  **
        | ${spinningEmoji} ${spinningEmoji} ${spinningEmoji} |
        *|ㅤ__000__ㅤ|* Oynanan Miktar: ${betAmount} <:Destinex:1347644229333028864> 
        *|ㅤ__000__ㅤ|*
        *|ㅤ__000__ㅤ|* Kullanıcı: ${message.author.username}
        `);

        await new Promise(resolve => setTimeout(resolve, 2500));

        let isWinner = Math.random() < 0.5;
        let finalSlots;
        
        if (isWinner) {
            let winningEmoji = slotEmojis[Math.floor(Math.random() * slotEmojis.length)];
            finalSlots = [winningEmoji, winningEmoji, winningEmoji];
        } else {
            finalSlots = [
                slotEmojis[Math.floor(Math.random() * slotEmojis.length)],
                slotEmojis[Math.floor(Math.random() * slotEmojis.length)],
                slotEmojis[Math.floor(Math.random() * slotEmojis.length)]
            ];
        }
        
        let revealedSlots = [spinningEmoji, spinningEmoji, spinningEmoji];
        for (let i = 0; i < 3; i++) {
            revealedSlots[i] = finalSlots[i]; 
            await slotMessage.edit(`
ㅤㅤㅤ**  ___SLOTS___  **
            |${revealedSlots[0]} ${revealedSlots[1]} ${revealedSlots[2]}|
            *|ㅤ__000__ㅤ|* Oynanan Miktar: ${betAmount} <:Destinex:1347644229333028864> 
            *|ㅤ__000__ㅤ|*
            *|ㅤ__000__ㅤ|* Kullanıcı: ${message.author.username}
            `);
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        let reward = 0;
        if (isWinner) {
            reward = betAmount * multipliers[finalSlots[0]];
            await client.eco.addMoney(message.author.id, reward);
        }

        await slotMessage.edit(`
ㅤㅤ**  ___SLOTS___  **
        |${finalSlots[0]} ${finalSlots[1]} ${finalSlots[2]}|
        *|ㅤ__000__ㅤ|* Oynanan Miktar: ${betAmount} <:Destinex:1347644229333028864> 
        *|ㅤ__000__ㅤ|*
        *|ㅤ__000__ㅤ|* Kullanıcı: ${message.author.username}
        
        ${reward > 0 ? `🎉 **Tebrikler!** +${reward} <:Destinex:1347644229333028864> kazandın!` : `😢 Kaybettin! -${betAmount} <:Destinex:1347644229333028864>`}
        `);

    } catch (error) {
        console.error(error);
        return message.reply("❌ Bir hata oluştu, lütfen tekrar deneyin.");
    }
};

exports.help = {
    name: "slot",
    aliases: [],
    usage: "slot <miktar> veya slot all",
    description: "Slot makinesi oyununu oynar. Kazanmak için semboller eşleşmeli!"
};