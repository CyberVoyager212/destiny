const { MessageEmbed } = require("discord.js");
const { items = [], valuableItems = [] } = require("../index.js"); // Eşyaları içe aktarma

const createProgressBar = (current, max, length = 10) => {
  const filledLength = Math.max(
    0,
    Math.min(length, Math.round((current / max) * length))
  );
  const bar = "█".repeat(filledLength) + "░".repeat(length - filledLength);
  return `[${bar}] **${current}/${max}**`;
};

const getMaxItemValue = (qualityLevel) => 500 + (qualityLevel - 1) * 10;
const getCollectableItems = (qualityLevel) =>
  items
    .concat(valuableItems)
    .filter((item) => item.value <= getMaxItemValue(qualityLevel));
const getCollectionTime = (cooldownTimeLevel) =>
  60 * 60 * 1000 + (cooldownTimeLevel - 1) * (0.25 * 60 * 60 * 1000);

exports.execute = async (client, message, args) => {
  try {
    const user = message.author;
    const inventoryKey = `inventory_${user.id}`;
    const maxLevel = 250;
    let cooldownTimeLevel = client.db.get(`cooldownTime_${user.id}`) || 1;
    let amountUpgradeLevel = client.db.get(`amountUpgrade_${user.id}`) || 1;
    let qualityUpgradeLevel = client.db.get(`qualityUpgrade_${user.id}`) || 1;
    let costUpgradeLevel = Math.min(
      client.db.get(`costUpgrade_${user.id}`) || 1,
      10
    );

    const gatheringCostPerMinute = Math.max(
      50 - 5 * (amountUpgradeLevel + costUpgradeLevel),
      10
    );
    const minCost = cooldownTimeLevel * 60 * gatheringCostPerMinute;
    const itemsCollected = 50 * amountUpgradeLevel;
    const collectableItems = getCollectableItems(qualityUpgradeLevel);
    const collectionTime = getCollectionTime(cooldownTimeLevel);
    const collectionTimeInHours = Math.floor(collectionTime / (60 * 60 * 1000));
    const collectionTimeInMinutes = Math.floor(
      (collectionTime % (60 * 60 * 1000)) / (60 * 1000)
    );

    if (args[0] === "eşyalar") {
      const collectableItemsList = collectableItems
        .map(
          (item) =>
            `${item.emoji} **${item.name}** - Değer: **${item.value}** <:Destinex:1347644229333028864>`
        )
        .join("\n");
      const itemsEmbed = new MessageEmbed()
        .setTitle("📜 Toplanabilir Eşyalar")
        .setColor("BLUE")
        .setDescription(
          collectableItemsList || "❌ **Toplanabilir eşya bulunmuyor!**"
        )
        .setFooter("🔧 Geliştirmeler için: k!hb <süre|miktar|kalite|maliyet>")
        .setTimestamp();
      return message.channel.send({ embeds: [itemsEmbed] });
    }

    if (args.length > 0 && !isNaN(args[0])) {
      const amountToSpend = parseInt(args[0]);
      if (amountToSpend < minCost)
        return message.reply(
          `⚠️ Minimum **${minCost}** <:Destinex:1347644229333028864> harcamanız gerekiyor!`
        );
      const userBalance = client.eco.fetchMoney(user.id).amount;
      if (userBalance < amountToSpend)
        return message.reply(`❌ Yetersiz bakiye! Mevcut: ${userBalance} <:Destinex:1347644229333028864>`);

      client.eco.removeMoney(user.id, amountToSpend);
      await message.reply(
        `⏳ **HuntBot ${amountToSpend} <:Destinex:1347644229333028864> karşılığında çalıştırıldı!** Toplama süresi: **${collectionTimeInHours} saat ${collectionTimeInMinutes} dakika**...`
      );
      await new Promise((resolve) => setTimeout(resolve, collectionTime));

      let collectedItems = [];
      for (let i = 0; i < itemsCollected; i++) {
        let randomItem =
          collectableItems[Math.floor(Math.random() * collectableItems.length)];
        collectedItems.push(randomItem);
      }

      let userInventory = client.db.get(inventoryKey) || [];
      userInventory = userInventory.concat(collectedItems);
      client.db.set(inventoryKey, userInventory);

      const embed = new MessageEmbed()
        .setTitle(`📦 ${user.tag} - Toplanan Eşyalar`)
        .setColor("GREEN")
        .setDescription(
          collectedItems
            .map((item) => `${item.emoji} ${item.name} (**${item.value}** <:Destinex:1347644229333028864>)`)
            .join(", ") || "Hiçbir eşya toplanamadı."
        )
        .setFooter(
          "🔧 Geliştirme yapmak için: k!hb <süre|miktar|kalite|maliyet>"
        )
        .setTimestamp();
      return message.channel.send({ embeds: [embed] });
    }

const upgradeFeature = async (user, upgradeType, amount, client) => {
    const maxLevel = 250;
    let currentLevel = (await client.db.get(`${upgradeType}_${user.id}`)) || 1;
    let totalCost = 0;
    let newLevel = currentLevel;
    
    // Kullanıcının mevcut bakiyesini al
    let userBalance = (await client.eco.fetchMoney(user.id)).amount;
    let maxUpgradeableAmount = amount;

    for (let i = 0; i < maxUpgradeableAmount; i++) {
        let costToLevelUp = newLevel * 250; // Mevcut seviyeye göre dinamik maliyet
        if (totalCost + costToLevelUp <= userBalance && newLevel < maxLevel) {
            totalCost += costToLevelUp;
            newLevel++;
        } else {
            break;
        }
    }
    
    if (newLevel === currentLevel) {
        return `❌ Yetersiz bakiye veya maksimum seviyeye ulaşıldı! Mevcut: ${userBalance} <:Destinex:1347644229333028864>`;
    }
    
    // Kullanıcının bakiyesinden harcama yap
    await client.eco.removeMoney(user.id, totalCost);
    
    // Yeni seviye değerini kaydet
    await client.db.set(`${upgradeType}_${user.id}`, newLevel);
    
    return `✅ **${upgradeType}** seviyesi başarıyla artırıldı! Yeni seviye: **${newLevel}** 💰 Harcanan: **${totalCost}** <:Destinex:1347644229333028864>`;
};

if (args.length === 2 && !isNaN(args[1])) {
    const upgradeTypeMap = {
        "süre": "cooldownTime",
        "miktar": "amountUpgrade",
        "kalite": "qualityUpgrade",
        "maliyet": "costUpgrade"
    };

    const upgradeType = upgradeTypeMap[args[0].toLowerCase()];
    if (!upgradeType) {
        return message.reply(`⚠️ Geçersiz geliştirme türü! Geçerli türler: süre, miktar, kalite, maliyet`);
    }

    const amountToUpgrade = parseInt(args[1]);
    const resultMessage = await upgradeFeature(user, upgradeType, amountToUpgrade, client);
    return message.reply(resultMessage);
}
    const embed = new MessageEmbed()
      .setTitle(`📊 ${user.tag} - Geliştirme Durumu`)
      .setColor("GOLD")
      .setThumbnail(user.displayAvatarURL({ dynamic: true }))
      .addFields(
        {
          name: "⏳ **Toplama Süresi**",
          value: `${createProgressBar(
            cooldownTimeLevel,
            maxLevel
          )}\nSüre: **${collectionTimeInHours} saat ${collectionTimeInMinutes} dakika**`,
          inline: true,
        },
        {
          name: "📦 **Toplama Miktarı**",
          value: `${createProgressBar(
            amountUpgradeLevel,
            maxLevel
          )}\nEşyalar: **${itemsCollected}**`,
          inline: true,
        },
        {
          name: "⭐ **Eşya Kalitesi**",
          value: `${createProgressBar(
            qualityUpgradeLevel,
            maxLevel
          )}\nMaksimum değer: **${getMaxItemValue(qualityUpgradeLevel)} <:Destinex:1347644229333028864>**`,
          inline: true,
        },
        {
          name: "💰 **Maliyet**",
          value: `${createProgressBar(
            costUpgradeLevel,
            10
          )}\nMaliyet: **${gatheringCostPerMinute}** <:Destinex:1347644229333028864>/dk\nMinimum: **${minCost}** <:Destinex:1347644229333028864>`,
          inline: false,
        }
      )
      .setFooter({
        text: "🔧 Geliştirme yapmak için: k!hb <süre|miktar|kalite|maliyet> , eşyalar listesi için k!hb eşyalar yazın",
      })
      .setTimestamp();

    return message.channel.send({ embeds: [embed] });
  } catch (error) {
    console.error(error);
    return message.reply("❌ **Bir hata oluştu, lütfen tekrar deneyin!**");
  }
};

exports.help = {
  name: "huntbot",
  aliases: ["hb"],
  usage: "huntbot [para miktarı] | huntbot <süre|miktar|kalite|maliyet>",
  description:
    "Hedefli bir av sistemini başlatır ve çeşitli parametrelerle kontrol eder.",
};
