const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');

exports.execute = async (client, message) => {
    let userBalance = await client.eco.fetchMoney(message.author.id);
    let entryFee = 500 + Math.floor(userBalance.amount * 0.007);

    if (userBalance.amount < entryFee) {
        return message.reply(`❌ Kumarhaneye giriş için yeterli paranız yok. Giriş ücreti: **${entryFee}** <:Destinex:1347644229333028864> .`);
    }

    const confirmationEmbed = new MessageEmbed()
        .setTitle("🏦 Kumarhane Girişi")
        .setDescription(`Kumarhaneye girmek için **${entryFee}** <:Destinex:1347644229333028864> ödemeniz gerekiyor. Kabul ediyor musunuz?`)
        .setColor("GOLD");

    const row = new MessageActionRow().addComponents(
        new MessageButton().setCustomId("accept").setLabel("✅ Kabul Et").setStyle("SUCCESS"),
        new MessageButton().setCustomId("decline").setLabel("❌ Vazgeç").setStyle("DANGER")
    );

    let confirmMessage = await message.channel.send({ embeds: [confirmationEmbed], components: [row] });

    const filter = (interaction) => interaction.user.id === message.author.id;
    const collector = confirmMessage.createMessageComponentCollector({ filter, time: 30000 });

    collector.on("collect", async (interaction) => {
        if (interaction.customId === "accept") {
            await client.eco.removeMoney(message.author.id, entryFee);

            const gamesEmbed = new MessageEmbed()
                .setTitle("🎰 Kumarhane Oyunları")
                .setDescription("Bir oyun seçmek için butonlara tıklayın.")
                .addFields(
                    { name: "🃏 Poker", value: "Texas Hold'em poker oynayın.", inline: true },
                    { name: "🎡 Rulet", value: "Bahis yaparak rulet çevirin.", inline: true },
                    { name: "🎲 Craps", value: "Zar atarak kazanmaya çalışın.", inline: true },
                    { name: "🎴 Baccarat", value: "Kartlarla baccarat oynayın.", inline: true },
                    { name: "🔢 Keno", value: "Rastgele sayı seçerek ödül kazanın.", inline: true },
                    { name: "🎲 Sic Bo", value: "Zar kombinasyonlarına bahis yapın.", inline: true },
                    { name: "🤑 Big Six Wheel", value: "Çarkı çevirin ve kazanın.", inline: true }
                )
                .setColor("GREEN");

            // Butonları iki satıra bölüyoruz (5+2)
            const gameRow1 = new MessageActionRow().addComponents(
                new MessageButton().setCustomId("poker").setLabel("🃏 Poker").setStyle("PRIMARY"),
                new MessageButton().setCustomId("roulette").setLabel("🎡 Rulet").setStyle("PRIMARY"),
                new MessageButton().setCustomId("craps").setLabel("🎲 Craps").setStyle("PRIMARY"),
                new MessageButton().setCustomId("baccarat").setLabel("🎴 Baccarat").setStyle("PRIMARY"),
                new MessageButton().setCustomId("keno").setLabel("🔢 Keno").setStyle("PRIMARY")
            );

            const gameRow2 = new MessageActionRow().addComponents(
                new MessageButton().setCustomId("sicbo").setLabel("🎲 Sic Bo").setStyle("PRIMARY"),
                new MessageButton().setCustomId("bigsix").setLabel("🤑 Big Six Wheel").setStyle("PRIMARY")
            );

            await interaction.update({ embeds: [gamesEmbed], components: [gameRow1, gameRow2] });

            const gameCollector = confirmMessage.createMessageComponentCollector({ filter, time: 60000 });

            gameCollector.on("collect", async (gameInteraction) => {
                const game = gameInteraction.customId;

                await gameInteraction.update({ content: `🎮 **${game}** oyununa katıldınız!`, embeds: [], components: [] });

                require(`../games/${game}.js`).execute(client, message);
            });

        } else if (interaction.customId === "decline") {
            await interaction.update({ content: "Kumarhaneye giriş iptal edildi.", embeds: [], components: [] });
        }
    });
};

exports.help = {
    name: "kumarhane",
    description: "Kumarhane oyunlarına katılmanızı sağlar.",
    usage: "k!kumarhane",
    example: "k!kumarhane"
};
