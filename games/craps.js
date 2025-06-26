const { MessageEmbed, MessageActionRow, MessageButton, MessageSelectMenu } = require("discord.js");

exports.execute = async (client, message) => {
    let userBalance = await client.eco.fetchMoney(message.author.id);

    if (userBalance.amount < 10) {
        return message.channel.send("❌ Oynamak için en az 10 <:Destinex:1347644229333028864> gerekiyor!");
    }

    const embed = new MessageEmbed()
        .setTitle("🎲 Craps Oyunu")
        .setDescription("Lütfen bahis miktarınızı seçin:")
        .setColor("BLUE");

    const row = new MessageActionRow().addComponents(
        new MessageSelectMenu()
            .setCustomId("bet_amount")
            .setPlaceholder("Bahis miktarı seçin")
            .addOptions([
                { label: "10", value: "10" },
                { label: "50", value: "50" },
                { label: "100", value: "100" },
                { label: "1.000", value: "1000" },
                { label: "10.000", value: "10000" },
                { label: "50.000", value: "50000" },
                { label: "75.000", value: "75000" },
                { label: "100.000", value: "100000" },
                { label: "250.000", value: "250000" }
            ])
    );

    let gameMessage = await message.channel.send({ embeds: [embed], components: [row] });

    const filter = i => i.user.id === message.author.id;
    const collector = gameMessage.createMessageComponentCollector({ filter, time: 60000, max: 1 });

    collector.on("collect", async (interaction) => {
        let betAmount = parseInt(interaction.values[0]);

        if (userBalance.amount < betAmount) {
            return interaction.update({ content: "❌ Yeterli bakiyeniz yok!", components: [] });
        }

        let point = null;
        let gameOver = false;

        const gameEmbed = new MessageEmbed()
            .setTitle("🎲 Craps Oyunu")
            .setDescription(`İlk zar atılıyor! Bahis: **${betAmount} <:Destinex:1347644229333028864>**\n\n🎲 \"Zar At\" butonuna bas!`)
            .setColor("BLUE");

        const gameRow = new MessageActionRow().addComponents(
            new MessageButton().setCustomId("roll").setLabel("🎲 Zar At").setStyle("PRIMARY"),
            new MessageButton().setCustomId("leave").setLabel("🏃 Çekil").setStyle("SECONDARY")
        );

        await interaction.update({ embeds: [gameEmbed], components: [gameRow] });

        const gameCollector = gameMessage.createMessageComponentCollector({ filter, time: 60000 });

        gameCollector.on("collect", async (gameInteraction) => {
            if (gameInteraction.customId === "leave") {
                gameCollector.stop();
                return gameInteraction.update({ content: `🏃 Oyundan çekildin! **${betAmount} <:Destinex:1347644229333028864>** paranı geri aldın.`, embeds: [], components: [] });
            }

            await gameInteraction.deferUpdate();

            if (gameOver) return;

            let dice1 = Math.floor(Math.random() * 6) + 1;
            let dice2 = Math.floor(Math.random() * 6) + 1;
            let roll = dice1 + dice2;

            if (!point) {
                if (roll === 7 || roll === 11) {
                    gameOver = true;
                    await client.eco.addMoney(message.author.id, betAmount * 2);
                    return gameInteraction.editReply({
                        content: `🎉 **Kazandın!** Zar: **${dice1} + ${dice2} = ${roll}** 🎲\n💰 Kazanç: **${betAmount * 2} <:Destinex:1347644229333028864>**`,
                        embeds: [],
                        components: []
                    });
                } else if (roll === 2 || roll === 3 || roll === 12) {
                    gameOver = true;
                    await client.eco.removeMoney(message.author.id, betAmount);
                    return gameInteraction.editReply({
                        content: `💀 **Kaybettin!** Zar: **${dice1} + ${dice2} = ${roll}** 🎲\n<:Destinex:1347644229333028864> Kaybedilen bahis: **${betAmount} <:Destinex:1347644229333028864>**`,
                        embeds: [],
                        components: []
                    });
                } else {
                    point = roll;
                    const newGameEmbed = new MessageEmbed()
                        .setTitle("🎲 Craps Oyunu")
                        .setDescription(`Point belirlendi: **${point}** 🎯\nŞimdi **${point}** atarsan kazanırsın, **7** atarsan kaybedersin!`)
                        .setColor("GOLD");

                    await gameInteraction.editReply({ embeds: [newGameEmbed] });
                }
            } else {
                if (roll === point) {
                    gameOver = true;
                    await client.eco.addMoney(message.author.id, betAmount * 2);
                    return gameInteraction.editReply({
                        content: `🎉 **Point'i tutturdun! Kazandın!** 🎯 Zar: **${dice1} + ${dice2} = ${roll}** 🎲\n💰 Kazanç: **${betAmount * 2} <:Destinex:1347644229333028864>**`,
                        embeds: [],
                        components: []
                    });
                } else if (roll === 7) {
                    gameOver = true;
                    await client.eco.removeMoney(message.author.id, betAmount);
                    return gameInteraction.editReply({
                        content: `💀 **7 Geldi! Kaybettin!** Zar: **${dice1} + ${dice2} = ${roll}** 🎲\n<:Destinex:1347644229333028864> Kaybedilen bahis: **${betAmount} <:Destinex:1347644229333028864>**`,
                        embeds: [],
                        components: []
                    });
                } else {
                    const newGameEmbed = new MessageEmbed()
                        .setTitle("🎲 Craps Oyunu")
                        .setDescription(`🎲 **${dice1} + ${dice2} = ${roll}** 🎲\nHedef: **${point}** 🎯\nDevam etmek için tekrar zar at!`)
                        .setColor("YELLOW");

                    await gameInteraction.editReply({ embeds: [newGameEmbed] });
                }
            }
        });
    });
};

exports.help = {
    name: "craps",
    description: "Craps zar oyunu oynayın ve şansınızı deneyin. Bahis miktarınızı oyunda seçebilirsiniz.",
    usage: "craps",
    example: "craps"
};
