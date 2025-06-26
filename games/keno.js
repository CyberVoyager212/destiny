const { MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");

exports.execute = async (client, message) => {
    let userBalance = await client.eco.fetchMoney(message.author.id);

    const embed = new MessageEmbed()
        .setTitle("🎲 Keno Bahis")
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
            new MessageButton().setCustomId("keno").setLabel("🎲 Keno Oyna!").setStyle("PRIMARY")
        );

        const betEmbed = new MessageEmbed()
            .setTitle("🎲 Keno Bahis Seçimi")
            .setDescription(`**Bahis miktarı: ${betAmount} <:Destinex:1347644229333028864>**\n\nŞimdi, **1 ile 80 arasında** sayılardan **en fazla 10 tane** seçebilirsin.\n\n**Kazanç Detayları:**\n- **1-3 eşleşme:** 2x kazanç\n- **4-6 eşleşme:** 5x kazanç\n- **7-9 eşleşme:** 10x kazanç\n- **10 eşleşme:** 100x kazanç`)
            .setColor("GOLD");

        let betMessage = await message.channel.send({ embeds: [betEmbed], components: [row] });

        const buttonCollector = betMessage.createMessageComponentCollector({ filter: i => i.user.id === message.author.id, time: 30000, max: 1 });

        buttonCollector.on("collect", async (interaction) => {
            await interaction.deferUpdate();

            const kenoEmbed = new MessageEmbed()
                .setTitle("🎲 Keno Sayıları Seç")
                .setDescription("Lütfen **1 ile 80 arasında** bahis yapmak istediğiniz **sayılara** karar verin.\n**En fazla 10 sayı seçebilirsiniz!**")
                .setColor("GOLD");

            await interaction.followUp({ embeds: [kenoEmbed] });

            const numberFilter = response => response.author.id === message.author.id;
            const numberCollector = message.channel.createMessageCollector({ filter: numberFilter, time: 30000 });

            numberCollector.on("collect", async (numberMsg) => {
                let selectedNumbers = numberMsg.content.split(" ").map(num => parseInt(num)).filter(num => num >= 1 && num <= 80);

                if (selectedNumbers.length === 0 || selectedNumbers.length > 10) {
                    return numberMsg.reply("❌ Lütfen **1 ile 80 arasında** ve **en fazla 10 sayı** seçin.");
                }

                numberCollector.stop();

                // Çekiliş yapmak
                let drawnNumbers = [];
                while (drawnNumbers.length < 20) {
                    let randomNum = Math.floor(Math.random() * 80) + 1;
                    if (!drawnNumbers.includes(randomNum)) {
                        drawnNumbers.push(randomNum);
                    }
                }

                // Kazananları hesaplama
                let matchedNumbers = selectedNumbers.filter(num => drawnNumbers.includes(num));
                let winnings = 0;

                if (matchedNumbers.length === 0) {
                    winnings = 0;
                } else if (matchedNumbers.length <= 3) {
                    winnings = betAmount * 2; // 1-3 eşleşme => 2x kazanç
                } else if (matchedNumbers.length <= 6) {
                    winnings = betAmount * 5; // 4-6 eşleşme => 5x kazanç
                } else if (matchedNumbers.length <= 9) {
                    winnings = betAmount * 10; // 7-9 eşleşme => 10x kazanç
                } else if (matchedNumbers.length === 10) {
                    winnings = betAmount * 100; // 10 eşleşme => 100x kazanç
                }

                // Kazanç işlemleri
                if (winnings > 0) {
                    await client.eco.addMoney(message.author.id, winnings);
                } else {
                    await client.eco.removeMoney(message.author.id, betAmount);
                }

                // Sonuç embed
                const resultEmbed = new MessageEmbed()
                    .setTitle("🎲 Keno Sonuçları")
                    .setDescription(`**Çekilen Sayılar:** ${drawnNumbers.join(", ")}\n\n**Seçilen Sayılar:** ${selectedNumbers.join(", ")}\n\n**Kazandığınız Sayılar:** ${matchedNumbers.join(", ")}\n\n💰 **Kazanç: ${winnings.toLocaleString()} <:Destinex:1347644229333028864>**`)
                    .setColor(winnings > 0 ? "GREEN" : "RED");

                await interaction.followUp({ embeds: [resultEmbed] });
            });
        });
    });

    collector.on("end", (collected, reason) => {
        if (reason === "time") {
            message.channel.send("⏳ **Süre doldu!** Bahis girmediğin için oyun iptal edildi.");
        }
    });
};

exports.help = {
    name: "keno",
    description: "Keno oyununu oynayın.",
    usage: "keno",
    example: "keno"
};
