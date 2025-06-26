const { MessageEmbed } = require("discord.js");
const { ChartJSNodeCanvas } = require("chartjs-node-canvas");

const width = 800;
const height = 400;
const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });

exports.execute = async (client, message, args) => {
  // Yetkilendirme (Sadece belirli kullanıcılar komutu çalıştırabilir)
  const allowedUsers = ["707269247532793858"];
  if (!allowedUsers.includes(message.author.id)) {
    return message.channel.send("❌ **Bu komutu kullanma yetkiniz yok!**");
  }

  let action = args[0]; // "fiyat" veya "grafik"
  if (!action || (action !== "fiyat" && action !== "grafik")) {
    return message.channel.send("❌ **Geçerli bir işlem belirtin! (fiyat/grafik)**");
  }

  let coins = client.db.get("coins") || {};
  
  // **Fiyat Güncelleme Modu (Doğrudan Fiyat Ayarlama)**
  if (action === "fiyat") {
    let coinName = args[1];
    let targetPrice = parseFloat(args[2]);

    if (!coinName || isNaN(targetPrice)) {
      return message.channel.send("❌ **Geçerli bir coin adı ve hedef fiyat belirtin!**");
    }

    if (coinName === "tümü") {
      // Tüm coinlerin fiyatını belirli bir hedef fiyata ayarlama
      Object.keys(coins).forEach((name) => {
        let history = coins[name].history;
        history.push(targetPrice);
        coins[name].history = history;
      });

      client.db.set("coins", coins);
      return message.channel.send(`✅ **Tüm coinlerin fiyatı ${targetPrice} olarak ayarlandı!**`);
    }

    if (!coins[coinName]) {
      return message.channel.send("❌ **Belirtilen coin mevcut değil!**");
    }

    let history = coins[coinName].history;
    history.push(targetPrice);
    coins[coinName].history = history;
    client.db.set("coins", coins);

    return message.channel.send(`✅ **${coinName} fiyatı ${targetPrice} olarak ayarlandı!**`);
  }

  // **Grafik Gösterme Modu**
  if (action === "grafik") {
    return sendAllCoinGraphs(message, coins);
  }
};

// **Tüm Coinlerin Grafiğini Gönderme Fonksiyonu**
async function sendAllCoinGraphs(message, coins) {
  let embed = new MessageEmbed()
    .setTitle("📈 Tüm Coinlerin Fiyat Grafiği")
    .setColor("BLUE");

  for (let coinName of Object.keys(coins)) {
    let history = coins[coinName].history;
    let image = await generateGraph(history, coinName);
    await message.channel.send({ files: [{ attachment: image, name: `${coinName}.png` }] });
  }
}

// **Grafik Oluşturma Fonksiyonu**
async function generateGraph(history, coinName) {
  let data = history.slice(-120); // Son 120 veri noktası
  let labels = Array.from({ length: data.length }, (_, i) => `${i + 1}`);

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

  return await chartJSNodeCanvas.renderToBuffer(configuration);
}

exports.help = {
  name: "coinconfig",
  aliases: ["cconfig", "c2"],
  description: "Coinlerin fiyatını belirlenen fiyata ayarlar veya grafiklerini görüntüler.",
  usage: "cconfig fiyat <coin_adı/tümü> <hedef_fiyat> | cconfig grafik",
};
