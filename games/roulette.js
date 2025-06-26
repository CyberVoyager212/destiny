const { MessageEmbed, MessageActionRow, MessageButton, MessageSelectMenu } = require("discord.js");

exports.execute = async (client, message) => {
    let userBalance = await client.eco.fetchMoney(message.author.id);

    if (userBalance.amount < 10) {
        return message.channel.send("❌ Oynamak için en az 10 <:Destinex:1347644229333028864> gerekiyor!");
    }

    const embed = new MessageEmbed()
        .setTitle("🔫 Rus Ruleti")
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
        let betAmount = interaction.values[0] === "all" 
            ? Math.min(userBalance.amount, 250000) 
            : parseInt(interaction.values[0]);

        if (userBalance.amount < betAmount) {
            return interaction.update({ content: "❌ Yeterli bakiyeniz yok!", components: [] });
        }

        let roundsSurvived = 0;

        const gameEmbed = new MessageEmbed()
            .setTitle("🔫 Rus Ruleti")
            .setDescription(`Bahis başlıyor! İlk bahis: **${betAmount} <:Destinex:1347644229333028864>**\n\nTetiği çekmek için \"Tetik Çek\" butonuna bas!`)
            .setColor("DARK_RED");

        const gameRow = new MessageActionRow().addComponents(
            new MessageButton().setCustomId("shoot").setLabel("🔫 Tetik Çek").setStyle("DANGER"),
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
            let shot = Math.random() < 0.5;

            if (shot) {
                gameCollector.stop();
                await client.eco.removeMoney(message.author.id, betAmount);
                return gameInteraction.editReply({
                    content: `💥 **BANG!** Öldün ve **${betAmount} <:Destinex:1347644229333028864>** kaybettin!`,
                    embeds: [],
                    components: []
                });
            } else {
                roundsSurvived++;
                betAmount *= 2;

                if (roundsSurvived >= 3) {
                    gameCollector.stop();
                    let winnings = betAmount * 5;
                    await client.eco.addMoney(message.author.id, winnings);
                    return gameInteraction.editReply({
                        content: `🎉 **3 Tur Hayatta Kaldın!** Büyük ödülü kazandın: **${winnings} <:Destinex:1347644229333028864>**!`,
                        embeds: [],
                        components: []
                    });
                }

                const newGameEmbed = new MessageEmbed()
                    .setTitle("🔫 Rus Ruleti")
                    .setDescription(`💨 Tetik boş çıktı! Yeni bahis: **${betAmount} <:Destinex:1347644229333028864>**\n\nDevam etmek ister misin?`)
                    .setColor("GOLD");

                const newGameRow = new MessageActionRow().addComponents(
                    new MessageButton().setCustomId("shoot").setLabel("🔫 Tetik Çek").setStyle("DANGER"),
                    new MessageButton().setCustomId("leave").setLabel("🏃 Çekil").setStyle("SECONDARY")
                );

                await gameInteraction.editReply({ embeds: [newGameEmbed], components: [newGameRow] });
            }
        });
    });
};

exports.help = {
    name: "rusruleti",
    description: "Rus Ruleti oynayın ve şansınızı deneyin. Bahis miktarınızı oyunda seçebilirsiniz.",
    usage: "rusruleti",
    example: "rusruleti"
};
