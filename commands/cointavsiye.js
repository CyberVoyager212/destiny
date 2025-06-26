const { MessageActionRow, MessageButton, MessageEmbed } = require("discord.js");

exports.execute = async (client, message, args) => {
  // Coin ismini kontrol et
  let coinName = args[0];
  if (!coinName) {
    return message.channel.send("❌ **Lütfen coin ismi belirtin!**");
  }

  // Coin verilerini al (client.db'de coins kaydı olmalı)
  let coins = client.db.get("coins");
  if (!coins || !coins[coinName]) {
    return message.channel.send("❌ **Geçerli bir coin ismi belirtin!**");
  }

  let userId = message.author.id;
  let userMoney = client.db.get(`money_${userId}`) || 1000000;
  const cost = 10000;

  if (userMoney < cost) {
    return message.channel.send(`❌ **Tavsiye almak için ${cost} <:Destinex:1347644229333028864> ödemeniz gerekmektedir. Yeterli paranız yok!**`);
  }

  // Onay için butonlu mesaj gönder
  const row = new MessageActionRow().addComponents(
    new MessageButton()
      .setCustomId("confirm_yes")
      .setLabel("Evet")
      .setStyle("SUCCESS"),
    new MessageButton()
      .setCustomId("confirm_no")
      .setLabel("Hayır")
      .setStyle("DANGER")
  );

  const confirmMessage = await message.channel.send({
    content: `Tavsiye almak için ${cost} <:Destinex:1347644229333028864> ödemeniz gerekmektedir. Kabul ediyor musunuz?`,
    components: [row],
  });

  const filter = (i) => i.user.id === message.author.id;
  const collector = confirmMessage.createMessageComponentCollector({ filter, time: 30000 });

  collector.on("collect", async (interaction) => {
    if (interaction.customId === "confirm_yes") {
      // Ödeme işlemi: kullanıcının parasından düş
      userMoney -= cost;
      client.db.set(`money_${userId}`, userMoney);

      await interaction.update({ content: `Ödeme alındı, tavsiye hazırlanıyor...`, components: [] });

      let coinData = coins[coinName];
      let history = coinData.history;
      if (!history || history.length < 2) {
        return message.channel.send("❌ **Coin verisi yetersiz, tavsiye verilemiyor!**");
      }

      let currentPrice = history[history.length - 1];
      const tolerance = 0.05; // ±%5 tolerans

      // Skor hesaplamaları için
      let riseScore = 0;
      let fallScore = 0;
      let predictionParts = [];

      // Koşul 1: Düşüş ve toparlanma analizi
      let dropIndex = -1;
      for (let i = history.length - 2; i >= 0; i--) {
        let price = history[i];
        if (price >= currentPrice * (1 - tolerance) && price <= currentPrice * (1 + tolerance)) {
          dropIndex = i;
          break;
        }
      }
      if (dropIndex !== -1) {
        let stepsToRecovery = null;
        for (let i = dropIndex + 1; i < history.length; i++) {
          if (history[i] > history[dropIndex] * 1.05) { // %5 toparlanma eşiği
            stepsToRecovery = i - dropIndex;
            break;
          }
        }
        if (stepsToRecovery !== null) {
          predictionParts.push(`**Koşul 1:** Geçmişte, ${coinName} fiyatı **${currentPrice}** civarına düştükten sonra **${stepsToRecovery}** adımda toparlanma göstermiş; bu, kısa vadede toparlanma potansiyeline işaret edebilir.`);
          riseScore++;
        } else {
          predictionParts.push(`**Koşul 1:** Geçmiş verilerinde belirgin toparlanma paterni tespit edilemedi.`);
          fallScore++;
        }
      } else {
        predictionParts.push(`**Koşul 1:** Geçmiş verilerinde mevcut fiyata yakın belirgin bir düşüş tespit edilmedi.`);
      }

      // Koşul 2: Tarihi maksimum analizi (mevcut hariç)
      let historicalMax = Math.max(...history.slice(0, history.length - 1));
      if (historicalMax > currentPrice) {
        predictionParts.push(`**Koşul 2:** Geçmişte ${coinName} **${historicalMax}** seviyesine ulaşmış; mevcut fiyat **${currentPrice}**'ün altında. Bu, yükseliş potansiyelini destekleyebilir.`);
        riseScore++;
      } else {
        predictionParts.push(`**Koşul 2:** Coin, geçmişte ulaştığı değerlere yakın veya onları aşmış durumda; bu, yükseliş için sınırlı potansiyel gösterebilir.`);
        fallScore++;
      }

      // Koşul 3: Hareketli Ortalama (son 5 veri noktası)
      let recent5 = history.slice(-5);
      let avg5 = recent5.reduce((a, b) => a + b, 0) / recent5.length;
      if (currentPrice < avg5) {
        predictionParts.push(`**Koşul 3:** Son 5 verinin ortalaması **${avg5.toFixed(2)}**. Mevcut fiyat **${currentPrice}** ortalamanın altında; bu, coin'in değerinin düşük olabileceğini ve yükseliş potansiyeline işaret edebilir.`);
        riseScore++;
      } else {
        predictionParts.push(`**Koşul 3:** Mevcut fiyat, son 5 verinin ortalaması olan **${avg5.toFixed(2)}**'nin üzerinde; bu, aşırı değerlenmiş olabileceğini düşündürebilir.`);
        fallScore++;
      }

      // Koşul 4: Son Trend Analizi (son 3 veri noktası)
      if (history.length >= 3) {
        let recent3 = history.slice(-3);
        if (recent3[0] < recent3[1] && recent3[1] < recent3[2]) {
          predictionParts.push(`**Koşul 4:** Son 3 veri noktası artış trendi gösteriyor; bu, pozitif bir momentum sinyali olabilir.`);
          riseScore++;
        } else if (recent3[0] > recent3[1] && recent3[1] > recent3[2]) {
          predictionParts.push(`**Koşul 4:** Son 3 veri noktası düşüş trendi gösteriyor; bu, olumsuz bir momentum sinyali olabilir.`);
          fallScore++;
        } else {
          predictionParts.push(`**Koşul 4:** Son trend belirgin değil; dalgalı bir seyir gözlemleniyor.`);
        }
      } else {
        predictionParts.push(`**Koşul 4:** Yeterli veri yok, trend analizi yapılamıyor.`);
      }

      // Koşul 5: Volatilite Analizi (son 10 veri noktası)
      let recent10 = history.length >= 10 ? history.slice(-10) : history;
      let mean10 = recent10.reduce((a, b) => a + b, 0) / recent10.length;
      let variance = recent10.reduce((sum, price) => sum + Math.pow(price - mean10, 2), 0) / recent10.length;
      let stdDev = Math.sqrt(variance);
      if (stdDev > mean10 * 0.05) {
        predictionParts.push(`**Koşul 5:** Son 10 veride yüksek volatilite gözlemleniyor (STD: ${stdDev.toFixed(2)}). Bu, tahminin kesinliğini azaltabilir.`);
        fallScore++;
      } else {
        predictionParts.push(`**Koşul 5:** Volatilite düşük (STD: ${stdDev.toFixed(2)}); bu, daha stabil bir trend olabileceğini düşündürüyor.`);
        riseScore++;
      }

      // Koşul 6: Destek Seviyesi Analizi (son 10 veri noktası min değeri)
      let recentMin = Math.min(...recent10);
      if ((currentPrice - recentMin) / recentMin <= 0.02) { // %2 yakınlık
        predictionParts.push(`**Koşul 6:** Mevcut fiyat, son 10 verinin minimum değeri olan **${recentMin}**'ye oldukça yakın; bu, destek seviyesine işaret edebilir ve potansiyel toparlanma sinyali olabilir.`);
        riseScore++;
      } else {
        predictionParts.push(`**Koşul 6:** Mevcut fiyat, destek seviyesinden (min: **${recentMin}**) uzakta; destek sinyali zayıf.`);
        fallScore++;
      }

      // Koşul 7: Direnç Seviyesi Analizi (son 10 veri noktası max değeri)
      let recentMax = Math.max(...recent10);
      if ((recentMax - currentPrice) / recentMax <= 0.02) { // %2 yakınlık
        predictionParts.push(`**Koşul 7:** Mevcut fiyat, son 10 verinin maksimum değeri olan **${recentMax}**'ye yakın; bu, direnç seviyesinin yaklaştığını ve fiyatın daha fazla artamayabileceğini gösterebilir.`);
        fallScore++;
      } else {
        predictionParts.push(`**Koşul 7:** Direnç seviyesi (max: **${recentMax}**) mevcut fiyattan uzak; yükseliş için daha fazla alan var.`);
        riseScore++;
      }

      // Final yüzdelik hesaplaması
      let totalScore = riseScore + fallScore;
      let risePercentage = totalScore ? ((riseScore / totalScore) * 100).toFixed(0) : 50;
      let fallPercentage = totalScore ? ((fallScore / totalScore) * 100).toFixed(0) : 50;
      predictionParts.push(`\n**Sonuç olarak:** %${risePercentage} yükselir, %${fallPercentage} düşer.`);

      // Embed ile sonucu gönder
      const embed = new MessageEmbed()
        .setTitle(`${coinName} Tavsiyesi`)
        .setDescription(predictionParts.join("\n\n"))
        .setFooter("Not: Bu tahminler kesin değildir, ayrıca oyun parasından söz edildiği unutulmamalıdır!")
        .setColor("BLUE");

      return message.channel.send({ embeds: [embed] });

    } else if (interaction.customId === "confirm_no") {
      await interaction.update({ content: "İşlem iptal edildi.", components: [] });
    }
  });

  collector.on("end", async (collected) => {
    if (collected.size === 0) {
      await confirmMessage.edit({ content: "Zaman aşımına uğradı, işlem iptal edildi.", components: [] });
    }
  });
};

exports.help = {
  name: "cointavsiye",
  description: "Belirtilen coin hakkında, geçmiş verilerine dayalı olarak artıp artmayacağına dair 7 koşulla tavsiye verir. Tavsiye almak için 10000 <:Destinex:1347644229333028864> ödemeniz gerekmektedir.",
  usage: "cointavsiye <coin ismi>"
};
