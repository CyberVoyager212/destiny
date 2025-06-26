const { MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");

exports.execute = async (client, message) => {
    let userBalance = await client.eco.fetchMoney(message.author.id);

    const embed = new MessageEmbed()
        .setTitle("🎲 Baccarat Bahis")
        .setDescription(`Ne kadar bahis yapmak istiyorsun? 💰 (Mevcut paran: **${userBalance.amount.toLocaleString()}** <:Destinex:1347644229333028864>)\n\n⏳ **1 dakika içinde bahis miktarını gir!**\n\n**Max:** 250.000 <:Destinex:1347644229333028864>\n**Min:** 10 <:Destinex:1347644229333028864>\nVeya "all" yazabilirsin!`)
        .setColor("GOLD");

    await message.channel.send({ embeds: [embed] });

    const filter = response => response.author.id === message.author.id;
    const collector = message.channel.createMessageCollector({ filter, time: 60000 });

    collector.on("collect", async (msg) => {
        let betAmount = msg.content.toLowerCase() === "all" ? Math.min(userBalance.amount, 250000) : parseInt(msg.content);

        if (isNaN(betAmount) || betAmount < 10 || betAmount > 250000) {
            return msg.reply("❌ Geçersiz bahis miktarı! En az **10 <:Destinex:1347644229333028864>**, en fazla **250.000 <:Destinex:1347644229333028864>**.");
        }

        if (userBalance.amount < betAmount) {
            return msg.reply("❌ Yetersiz bakiyen var!");
        }

        collector.stop();

        // Bahis seçimi için butonlar
        const row = new MessageActionRow().addComponents(
            new MessageButton().setCustomId("player").setLabel("🟦 Oyuncuya Bahis").setStyle("PRIMARY"),
            new MessageButton().setCustomId("banker").setLabel("🟥 Bankere Bahis").setStyle("DANGER"),
            new MessageButton().setCustomId("tie").setLabel("🟩 Beraberlik").setStyle("SUCCESS")
        );

        const betEmbed = new MessageEmbed()
            .setTitle("🎲 Baccarat Bahis Seçimi")
            .setDescription(`Hangi tarafa bahis yapacaksın? 💰 **${betAmount}** <:Destinex:1347644229333028864>\n\n🟦 Oyuncu (2x)\n🟥 Banker (1.95x, %5 komisyon)\n🟩 Beraberlik (8x)`)
            .setColor("GOLD");

        let betMessage = await message.channel.send({ embeds: [betEmbed], components: [row] });

        const buttonCollector = betMessage.createMessageComponentCollector({ filter: i => i.user.id === message.author.id, time: 30000, max: 1 });

        buttonCollector.on("collect", async (interaction) => {
            await interaction.deferUpdate();

            let betChoice = interaction.customId; // player, banker veya tie

            // Kartları oluştur
            const deck = [
                "A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K",
                "A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"
            ];

            const getCardValue = (card) => {
                if (["J", "Q", "K", "10"].includes(card)) return 0;
                if (card === "A") return 1;
                return parseInt(card);
            };

            // Rastgele kart seçme fonksiyonu
            const drawCard = () => deck[Math.floor(Math.random() * deck.length)];

            // Kartları çekelim
            let playerCards = [drawCard(), drawCard()];
            let bankerCards = [drawCard(), drawCard()];

            // Puanları hesaplayalım
            let playerScore = (getCardValue(playerCards[0]) + getCardValue(playerCards[1])) % 10;
            let bankerScore = (getCardValue(bankerCards[0]) + getCardValue(bankerCards[1])) % 10;

            let result = "**🤔 Berabere!**";
            let winnings = 0;

            if (playerScore > bankerScore) {
                result = "**🟦 Oyuncu kazandı!**";
                if (betChoice === "player") {
                    winnings = betAmount * 2;
                }
            } else if (playerScore < bankerScore) {
                result = "**🟥 Banker kazandı!**";
                if (betChoice === "banker") {
                    winnings = betAmount * 1.95; // %5 komisyon kesintisi
                }
            } else {
                result = "**🟩 Beraberlik!**";
                if (betChoice === "tie") {
                    winnings = betAmount * 8;
                }
            }

            // Kazanç işlemleri
            if (winnings > 0) {
                await client.eco.addMoney(message.author.id, winnings);
            } else {
                await client.eco.removeMoney(message.author.id, betAmount);
            }

            // Sonuç embed
            const resultEmbed = new MessageEmbed()
                .setTitle("🎲 Baccarat Sonuç")
                .setDescription(`${result}\n\n🟦 Oyuncu: **${playerCards.join(" - ")}** (**${playerScore}**)  
                🟥 Banker: **${bankerCards.join(" - ")}** (**${bankerScore}**)  
                \n💰 **Kazanç: ${winnings.toLocaleString()} <:Destinex:1347644229333028864>**`)
                .setColor(winnings > 0 ? "GREEN" : "RED");

            await interaction.editReply({ embeds: [resultEmbed], components: [] });
        });
    });

    collector.on("end", (collected, reason) => {
        if (reason === "time") {
            message.channel.send("⏳ **Süre doldu!** Bahis girmediğin için oyun iptal edildi.");
        }
    });
};

exports.help = {
    name: "baccarat",
    description: "Baccarat oyununu oynayın.",
    usage: "baccarat",
    example: "baccarat"
};
