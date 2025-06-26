const { MessageEmbed } = require("discord.js");
const { ChartJSNodeCanvas } = require("chartjs-node-canvas");

const width = 800;
const height = 400;
const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });

exports.execute = async (client, message, args) => {
  // Fiyat güncelleme interval'ini ilk çalıştırmada kuruyoruz.
  if (!client.coinPriceIntervalSet) {
    client.coinPriceIntervalSet = true;
    setInterval(() => updateCoinPrices(client), 10 * 60 * 1000); // Her 10 dakikada bir
  }

  let action = args[0];
  let coinName = args[1];
  let valueArg = args[2]; // coin alımında miktar, coin oluştururken başlangıç fiyatı olacak
  let amount = parseFloat(valueArg);
  let userId = message.author.id;

  if (!action) {
    return message.channel.send(
      "❌ **Lütfen bir işlem belirtin!** (al, sat, grafik, tablo, oluştur, sil)"
    );
  }

  // Coin verilerini al; yoksa başlat.
  let coins = client.db.get("coins") || generateInitialCoins();
  client.db.set("coins", coins);

  // Coin oluştur komutu
  if (action === "oluştur") {
    // Kullanım: coin oluştur <coin_adı> <başlangıçfiyatı>
    if (!coinName || !valueArg) {
      return message.channel.send("❌ **Lütfen coin adı ve başlangıç fiyatı belirtin!**");
    }
    let startingPrice = parseFloat(valueArg);
    if (isNaN(startingPrice) || startingPrice < 50 || startingPrice > 1000000) {
      return message.channel.send("❌ **Başlangıç fiyatı 50 ile 1000000 arasında olmalıdır!**");
    }
    if (coins[coinName]) {
      return message.channel.send("❌ **Bu coin zaten mevcut!**");
    }
    // Coin oluşturmak için kullanıcıdan 2.5 milyar para çekelim.
    let cost = 2500000000;
    let userMoney = client.db.get(`money_${userId}`) || 1000000;
    if (userMoney < cost) {
      return message.channel.send("❌ **Yeterli paranız yok coin oluşturmak için!**");
    }
    userMoney -= cost;
    client.db.set(`money_${userId}`, Math.round(userMoney));
    // Coin verisine owner ve bonus bilgisi ekliyoruz.
    coins[coinName] = {
      history: [Math.round(startingPrice)],
      owner: userId,
      unpaidDropBonus: 0
    };
    client.db.set("coins", coins);
    return message.channel.send(`✅ **${coinName} coin'i oluşturuldu! Başlangıç fiyatı: ${Math.round(startingPrice)}.**`);
  }

  // Coin sil komutu
  if (action === "sil") {
    // Kullanım: coin sil <coin_adı>
    if (!coinName) {
      return message.channel.send("❌ **Lütfen silinecek coin adını belirtin!**");
    }
    if (!coins[coinName]) {
      return message.channel.send("❌ **Belirtilen coin mevcut değil!**");
    }
    let coin = coins[coinName];
    // Sadece coin sahibi silebilir.
    if (coin.owner !== userId) {
      return message.channel.send("❌ **Sadece coin sahibi bu coin'i silebilir!**");
    }
    // Coin'i satın almış kullanıcıların coinlerini otomatik satıp paralarını iade edelim.
    let allEntries = client.db.all();
    let lastPrice = coin.history.slice(-1)[0];
    for (let entry of allEntries) {
      if (entry.ID.startsWith("balance_")) {
        let balance = entry.data;
        if (balance[coinName] && balance[coinName] > 0) {
          let amountHeld = balance[coinName];
          let totalGain = Math.round(amountHeld * lastPrice);
          let buyerId = entry.ID.replace("balance_", "");
          let buyerMoney = client.db.get(`money_${buyerId}`) || 0;
          buyerMoney += totalGain;
          client.db.set(`money_${buyerId}`, Math.round(buyerMoney));
          // Sıfırlıyoruz.
          balance[coinName] = 0;
          client.db.set(entry.ID, balance);
        }
      }
    }
    // Coin sahibine 2.5 milyar para + varsa ödenmemiş bonus iade ediliyor.
    let refund = 2500000000 + (coin.unpaidDropBonus || 0);
    let ownerMoney = client.db.get(`money_${userId}`) || 0;
    ownerMoney += refund;
    client.db.set(`money_${userId}`, Math.round(ownerMoney));
    // Coin siliniyor.
    delete coins[coinName];
    client.db.set("coins", coins);
    return message.channel.send(`✅ **${coinName} coin'i silindi ve size ${refund} para iade edildi!**`);
  }

  // Coin tablosu komutu: Her seferinde yeni bir mesaj gönderilir.
  if (action === "tablo") {
    return sendCoinTable(message, coins);
  }

  // Diğer işlemler için geçerli coin kontrolü
  if (!coinName || !coins[coinName]) {
    return message.channel.send("❌ **Geçerli bir coin ismi belirtin!**");
  }

  // Kullanıcının coin bakiyesini al.
  let userBalance = client.db.get(`balance_${userId}`) || {};
  userBalance[coinName] = userBalance[coinName] || 0;
  let currentPrice = coins[coinName].history.slice(-1)[0] || getRandomPrice();

  if (action === "al") {
    if (!amount || amount <= 0)
      return message.channel.send("❌ **Geçerli bir miktar girin!**");
    // Kesirli coin alımına izin veriyoruz, para işlemleri yuvarlanıyor.
    let totalCost = Math.round(amount * currentPrice);
    let userMoney = client.db.get(`money_${userId}`) || 1000000;
    if (userMoney < totalCost)
      return message.channel.send("❌ **Yeterli paranız yok!**");
    userMoney -= totalCost;
    userBalance[coinName] += amount;
    client.db.set(`money_${userId}`, Math.round(userMoney));
    client.db.set(`balance_${userId}`, userBalance);
    return message.channel.send(`✅ **${amount} ${coinName} satın alındı! (Maliyet: ${totalCost})**`);
  }

  if (action === "sat") {
    if (!amount || amount <= 0)
      return message.channel.send("❌ **Geçerli bir miktar girin!**");
    if (userBalance[coinName] < amount)
      return message.channel.send(`❌ **Yeterli miktarda ${coinName} yok!**`);
    let totalGain = Math.round(amount * currentPrice);
    userBalance[coinName] -= amount;
    let userMoney = client.db.get(`money_${userId}`) || 1000000;
    userMoney += totalGain;
    client.db.set(`money_${userId}`, Math.round(userMoney));
    client.db.set(`balance_${userId}`, userBalance);
    return message.channel.send(`✅ **${amount} ${coinName} satıldı! (Kazanç: ${totalGain})**`);
  }

  if (action === "grafik") {
    // Coin geçmişi yoksa veya yeterli değilse 1 aylık geçmiş oluştur.
    if (!coins[coinName].history || coins[coinName].history.length < 2) {
      coins[coinName].history = generateMonthlyHistory();
      client.db.set("coins", coins);
    }
    return sendCoinGraph(message, coins[coinName].history, coinName);
  }
};

//
// Fiyat Güncelleme & Grafik/Geçmiş Oluşturma Fonksiyonları
//

function updateCoinPrices(client) {
  // Coin verilerini al; yoksa yenisini oluştur.
  let coins = client.db.get("coins") || generateInitialCoins();
  
  Object.keys(coins).forEach((coinName) => {
    let coin = coins[coinName];
    let history = coin.history;
    let lastPrice = history[history.length - 1] || getRandomPrice();

    // Son 10 veri noktası üzerinden ortalama ve volatilite hesaplama
    const windowSize = 10;
    let recentPrices = history.slice(-windowSize);
    let average =
      recentPrices.reduce((sum, p) => sum + p, 0) / recentPrices.length || lastPrice;
    let variance =
      recentPrices.reduce((sum, p) => sum + Math.pow(p - average, 2), 0) /
      recentPrices.length;
    let stdDev = Math.sqrt(variance);

    // Temel rastgele değişim: ±%2 aralığında (yani -0.02 ile +0.02)
    let changePercentage = (Math.random() - 0.5) * 0.04;

    // Fiyat ortalaması baz alınarak bias ekle:
    if (lastPrice < average) {
      changePercentage += 0.005; // fiyat ortalamanın altındaysa hafif yukarı bias
    } else if (lastPrice > average) {
      changePercentage -= 0.005; // fiyat ortalamanın üstündeyse hafif aşağı bias
    }

    // Yüksek volatilite durumunda değişim azaltılsın:
    if (stdDev > average * 0.05) {
      changePercentage *= 0.5;
    }

    let newPrice = Math.round(lastPrice * (1 + changePercentage));

    // Yeni fiyatı, mevcut fiyatın ±%2 aralığında sınırla
    let lowerBound = Math.round(lastPrice * 0.98);
    let upperBound = Math.round(lastPrice * 1.02);
    newPrice = Math.min(upperBound, Math.max(lowerBound, newPrice));

    // Fiyat düşüşü gerçekleşmişse, gerekli işlemleri uygula
    if (newPrice < lastPrice) {
      let dropUnits = Math.floor(lastPrice - newPrice);
      if (dropUnits >= 1) {
        // Coin'i satın alan kullanıcılardan, her 1 para düşüşünde 1 coin eksilt.
        let allEntries = client.db.all();
        for (let entry of allEntries) {
          if (entry.ID.startsWith("balance_")) {
            let balance = entry.data;
            if (balance[coinName] && balance[coinName] > 0) {
              balance[coinName] = Math.max(0, balance[coinName] - dropUnits);
              client.db.set(entry.ID, balance);
            }
          }
        }
        // Eğer coin'in sahibi varsa, her 1 para düşüşünde ona 2 para bonus öde.
        if (coin.owner) {
          let bonus = 2 * dropUnits;
          let ownerMoney = client.db.get(`money_${coin.owner}`) || 0;
          ownerMoney += bonus;
          client.db.set(`money_${coin.owner}`, Math.round(ownerMoney));
        }
      }
    }

    // Yeni fiyatı history dizisine ekle
    history.push(newPrice);
    // Artık kullanılmayan verileri temizlemek için: Eğer veri sayısı 120'den fazla ise, en eski verileri sil.
    while (history.length > 120) {
      history.shift();
    }
    coin.history = history;
    coins[coinName] = coin;
  });

  client.db.set("coins", coins);
}



function generateMonthlyHistory() {
  const days = 30;
  let history = [];
  let currentPrice = getRandomPrice();
  for (let i = 0; i < days; i++) {
    // Her gün ±%5 dalgalanma
    currentPrice = Math.round(currentPrice * (1 + (Math.random() - 0.5) * 0.1));
    history.push(currentPrice);
  }
  return history;
}

function generateInitialCoins() {
  return {
    Bitcoin: { history: generateMonthlyHistory() },
    Ethereum: { history: generateMonthlyHistory() },
    Litecoin: { history: generateMonthlyHistory() },
    Dogecoin: { history: generateMonthlyHistory() },
    Ripple: { history: generateMonthlyHistory() },
    Cardano: { history: generateMonthlyHistory() },
    Polkadot: { history: generateMonthlyHistory() },
    Solana: { history: generateMonthlyHistory() },
    Chainlink: { history: generateMonthlyHistory() },
    Stellar: { history: generateMonthlyHistory() },
  };
}

function getRandomPrice() {
  return Math.floor(Math.random() * 9000) + 1000;
}

async function sendCoinGraph(message, history, coinName) {
  // Grafikte son 120 veri noktası gösteriliyor.
  let data = history.slice(-120);
  let intervalMinutes = 10;
  let labels = Array.from({ length: data.length }, (_, i) => {
    let minutesAgo = (data.length - 1 - i) * intervalMinutes;
    return formatRelativeTime(minutesAgo);
  });

  const configuration = {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: `${coinName} Fiyat Değişimi`,
          data,
          borderColor: data[data.length - 1] > data[0] ? "green" : "red",
          fill: false,
        },
      ],
    },
  };

  const image = await chartJSNodeCanvas.renderToBuffer(configuration);
  return message.channel.send({
    files: [{ attachment: image, name: "graph.png" }],
  });
}

async function sendCoinTable(message, coins) {
  let embed = new MessageEmbed().setTitle("📈 Coin Durumları").setColor("BLUE");

  Object.keys(coins).forEach((coinName) => {
    let priceHistory = coins[coinName].history;
    let lastPrice = priceHistory.slice(-1)[0];
    let previousPrice =
      priceHistory.length > 1 ? priceHistory[priceHistory.length - 2] : lastPrice;
    let trend = lastPrice > previousPrice ? "📈" : "📉";
    embed.addField(
      coinName,
      `<:cuval_DNX:1347664200620572702> **${lastPrice}** ${trend}`,
      true
    );
  });

  return message.channel.send({ embeds: [embed] });
}

function formatRelativeTime(minutes) {
  if (minutes === 0) return "Şimdi";
  if (minutes < 60) return `${minutes} dakika önce`;
  let hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} saat önce`;
  let days = Math.floor(hours / 24);
  if (days < 30) return `${days} gün önce`;
  let months = Math.floor(days / 30);
  return `${months} ay önce`;
}

exports.help = {
  name: "coin",
  description:
    "Coin al, sat, grafik oluştur, tablo göster, coin oluştur veya sil. (Kesirli alım-satım ve coin düşüş bonus sistemi içerir.)",
  usage: "coin <al|sat|grafik|tablo|oluştur|sil> <coin_adı> <miktar/başlangıçfiyatı>",
};
