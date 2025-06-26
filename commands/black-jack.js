const { MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");
const crypto = require("crypto");

exports.execute = async (client, message, args) => {
    try {
        // Kullanıcının bahis yapacağı miktarı belirle
        let betAmount = parseInt(args[0]);
        if (args[0] === 'all') {
            let userBalance = await client.eco.fetchMoney(message.author.id);
            betAmount = userBalance.amount;
        }

        if (isNaN(betAmount) || betAmount <= 0) {
            return message.reply("Lütfen geçerli bir bahis miktarı girin.");
        }

        // Kullanıcının mevcut parasını kontrol et
        let userBalance = await client.eco.fetchMoney(message.author.id);

        if (userBalance.amount < betAmount) {
            return message.reply(`Yeterli paranız yok. Mevcut paranız: **${userBalance.amount}** <:Destinex:1347644229333028864> .`);
        }

        // Kullanıcının parasını bahis için düşür
        await client.eco.removeMoney(message.author.id, betAmount);

        // Deste oluştur ve karıştır
        let deck = [];
        let suits = ["♠", "♥", "♦", "♣"];
        let values = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

        for (let suit of suits) {
            for (let value of values) {
                deck.push({ suit: suit, value: value });
            }
        }

        function shuffle(array) {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
            return array;
        }

        deck = shuffle(deck);

        function calculateHandValue(hand) {
            let value = 0;
            let aceCount = 0;

            for (let card of hand) {
                if (["J", "Q", "K"].includes(card.value)) {
                    value += 10;
                } else if (card.value === "A") {
                    aceCount++;
                    value += 11;
                } else {
                    value += parseInt(card.value);
                }
            }

            while (value > 21 && aceCount > 0) {
                value -= 10;
                aceCount--;
            }

            return value;
        }

        let userHand = [deck.pop(), deck.pop()];
        let dealerHand = [deck.pop(), deck.pop()];

        let gameId = crypto.randomBytes(3).toString('hex'); // 5 haneli oyun kodu

        await client.db.set(`blackjack_${gameId}`, {
            userId: message.author.id,
            betAmount: betAmount,
            deck: deck,
            userHand: userHand,
            dealerHand: dealerHand,
            timestamp: Date.now()
        });

        let embed = new MessageEmbed()
            .setTitle("Blackjack Oyunu Başladı!")
            .setDescription(`Oyun kodunuz: **${gameId}**\nKartlarınız: ${userHand.map(card => `${card.value}${card.suit}`).join(" ")}\nToplam değer: **${calculateHandValue(userHand)}**\nDağıtıcı'nın açık kartı: ${dealerHand[0].value}${dealerHand[0].suit}`)
            .setColor("GREEN");

        const hitButton = new MessageButton()
            .setCustomId('hit')
            .setLabel('Çek')
            .setStyle('PRIMARY');

        const stayButton = new MessageButton()
            .setCustomId('stay')
            .setLabel('Dur')
            .setStyle('DANGER');

        const row = new MessageActionRow().addComponents(hitButton, stayButton);

        let gameMessage = await message.channel.send({ embeds: [embed], components: [row] });

        // Tepki toplama (butonlar)
        const filter = i => {
            return i.user.id === message.author.id;
        };

        const collector = gameMessage.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async (interaction) => {
            let gameState = await client.db.get(`blackjack_${gameId}`);
            if (!gameState) {
                interaction.reply({ content: "Oyun sona erdi.", ephemeral: true });
                return;
            }

            if (interaction.customId === 'hit') {
                let newCard = gameState.deck.pop();
                gameState.userHand.push(newCard);

                let userValue = calculateHandValue(gameState.userHand);
                if (userValue > 21) {
                    // Kullanıcı kaybetti
                    await client.db.delete(`blackjack_${gameId}`);
                    return interaction.reply(`Büst! Toplam değeriniz: **${userValue}**. Bahis miktarınız **${betAmount}** <:Destinex:1347644229333028864> kaybedildi.`);
                }

                // Güncellenmiş el durumu
                let updatedEmbed = new MessageEmbed(embed)
                    .setDescription(`Kart çektiniz: ${newCard.value}${newCard.suit}\nŞimdiki kartlarınız: ${gameState.userHand.map(card => `${card.value}${card.suit}`).join(" ")}\nToplam değer: **${userValue}**\nDağıtıcı'nın açık kartı: ${gameState.dealerHand[0].value}${gameState.dealerHand[0].suit}`);
                await gameMessage.edit({ embeds: [updatedEmbed] });

            } else if (interaction.customId === 'stay') {
                let dealerValue = calculateHandValue(gameState.dealerHand);

                // Dağıtıcı kart çekme mantığı
                while (dealerValue < 17) {
                    gameState.dealerHand.push(gameState.deck.pop());
                    dealerValue = calculateHandValue(gameState.dealerHand);
                }

                let userValue = calculateHandValue(gameState.userHand);
                if (dealerValue > 21 || userValue > dealerValue) {
                    // Kullanıcı kazandı
                    let winnings = gameState.betAmount * 2;
                    await client.eco.addMoney(message.author.id, winnings);
                    await client.db.delete(`blackjack_${gameId}`);
                    return interaction.reply(`Tebrikler! Toplam değeriniz: **${userValue}**, Dağıtıcı'nın değeri: **${dealerValue}**. Bahis kazandınız ve **${winnings}** <:Destinex:1347644229333028864> kazandınız.`);
                } else {
                    // Kullanıcı kaybetti
                    await client.db.delete(`blackjack_${gameId}`);
                    return interaction.reply(`Üzgünüm! Toplam değeriniz: **${userValue}**, Dağıtıcı'nın değeri: **${dealerValue}**. Bahis miktarınız **${betAmount}** <:Destinex:1347644229333028864> kaybedildi.`);
                }
            }

            await client.db.set(`blackjack_${gameId}`, gameState);
            interaction.deferUpdate();
        });

        collector.on('end', collected => {
            gameMessage.edit({ components: [] }); // Butonları kaldır
        });
    } catch (error) {
        console.error(error);
        return message.reply("Bir hata oluştu, lütfen tekrar deneyin.");
    }
};

exports.help = {
        "name": "blackjack",
        "aliases": [
            "bj"
        ],
        "usage": "blackjack <miktar> veya blackjack all",
        "description": "Blackjack oyununu oynatır. `<miktar>` ile belirli bir miktarda bahis yapılabilir veya `blackjack all` ile tüm bakiye ile oyun oynanır."
};
