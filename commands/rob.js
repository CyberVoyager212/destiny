exports.execute = async (client, message, args) => {
    try {
        let target = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        if (!target) {
            return message.reply("❌ Kimi soymaya çalışıyorsunuz? Lütfen geçerli bir kullanıcı etiketleyin.");
        }
        if (target.id === message.author.id) {
            return message.reply("❌ Kendini soyamazsın!");
        }

        let targetInventory = client.db.get(`inventory_${target.id}`) || [];
        if (targetInventory.length === 0) {
            return message.reply("Hedefin çalacak hiçbir eşyası yok!");
        }

        const chosenIndex = Math.floor(Math.random() * targetInventory.length);
        const chosenItem = targetInventory[chosenIndex];
        const roll = Math.random();

        let robberMoneyObj = await client.eco.fetchMoney(message.author.id);
        let robberMoney = Number(robberMoneyObj.amount); // Sayıya çevirdik!

        let outcomeMessage = "";

        if (roll < 0.25) {
            outcomeMessage = `🚨 Soygun iptal edildi! ${target} seni fark etti ve soygun yapmana izin vermedi.`;
        } else if (roll < 0.5) {
            outcomeMessage = `😢 Çalmaya çalıştığın ${chosenItem.emoji} **${chosenItem.name}** kırıldı! Yine de ${Math.floor(chosenItem.value / 2)} <:Destinex:1347644229333028864> elde ettin.`;
            targetInventory.splice(chosenIndex, 1);
            client.db.set(`inventory_${target.id}`, targetInventory);
            robberMoney += Math.floor(chosenItem.value / 2);
        } else if (roll < 0.75) {
            let brokenItem = null;
            targetInventory.splice(chosenIndex, 1);
            if (targetInventory.length > 0) {
                const randomIndex = Math.floor(Math.random() * targetInventory.length);
                brokenItem = targetInventory[randomIndex];
                targetInventory.splice(randomIndex, 1);
            }
            client.db.set(`inventory_${target.id}`, targetInventory);
            robberMoney += chosenItem.value;
            if (brokenItem) {
                outcomeMessage = `✅ Soygun başarılı! ${chosenItem.emoji} **${chosenItem.name}** çaldın ve satıp ${chosenItem.value} <:Destinex:1347644229333028864> kazandın. Ancak ${brokenItem.emoji} **${brokenItem.name}** kırıldı.`;
            } else {
                outcomeMessage = `✅ Soygun başarılı! ${chosenItem.emoji} **${chosenItem.name}** çaldın ve satıp ${chosenItem.value} <:Destinex:1347644229333028864> kazandın.`;
            }
        } else {
            targetInventory.splice(chosenIndex, 1);
            client.db.set(`inventory_${target.id}`, targetInventory);
            robberMoney += chosenItem.value;
            outcomeMessage = `🎉 Soygun başarılı! ${chosenItem.emoji} **${chosenItem.name}** çaldın ve satıp tam değerinde ${chosenItem.value} <:Destinex:1347644229333028864> kazandın.`;
        }

        await client.eco.setMoney(message.author.id, Number(robberMoney)); // Sayıya çevirdik!

        return message.reply(outcomeMessage);
    } catch (error) {
        console.error("Soygun komutunda hata oluştu:", error);
        return message.reply("⚠️ Bir hata oluştu, lütfen tekrar deneyin.");
    }
};

exports.help = {
    name: "rob",
    aliases: ["soy", "çal"],
    usage: "rob <kullanıcı>",
    description: "Başka bir kullanıcının eşyalarını soymaya çalışır. Soygun sırasında ev sahibi fark edilebilir, eşya kırılabilir veya başarıyla çalınarak satılabilir."
};
