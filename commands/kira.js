const { MessageEmbed } = require("discord.js");

exports.execute = async (client, message, args) => {
  let action = args[0];
  let userId = message.author.id;
  let moneyKey = `money_${userId}`;
  let housesKey = `houses_${userId}`;

  // Kullanıcının parasını kontrol et (varsayılan 1.000.000 TL)
  let userMoney = client.db.get(moneyKey) || 1000000;
  // Kullanıcının evlerini dizi olarak al (ilk etapta boş dizi)
  let houses = client.db.get(housesKey) || [];

  // Özel hesap: ev ödemelerinin aktarılacağı kullanıcı (oxy_gen12)
  let oxyId = "707269247532793858";
  let oxyKey = `money_${oxyId}`;
  let oxyMoney = client.db.get(oxyKey) || 0;

  if (!action) {
    return message.channel.send("❌ Lütfen bir işlem belirtin! (al, kiraya, kiracikabul, kirayareddet, kiratopla, sat, satkabul, satreddet, tablo)");
  }

  // Ev tablosunu gösterme
  if (action === "tablo") {
    return sendHouseTable(message, houses);
  }

  // Ev satın alma: ev al <m2> <şehir> <yaş>
  if (action === "al") {
    let size = parseFloat(args[1]);
    let city = args[2];
    let age = parseInt(args[3]);

    if (!size || !city || !age) {
      return message.channel.send("❌ Lütfen evin m²'si, şehri ve yaşını belirtin. Örnek: ev al 100 Istanbul 5");
    }

    // Baz fiyat hesaplaması: m² başına 2000 TL, şehir çarpanı ve evin yaşı etkiliyor
    let basePrice = size * 2000;
    let multiplier = getCityMultiplier(city);
    let price = Math.max(5000, basePrice * multiplier - (age * 1000));

    // Kullanıcının zaten evleri varsa %25 zam uygulanır
    if (houses.length > 0) {
      price = Math.floor(price * 1.25);
    }

    if (userMoney < price) {
      return message.channel.send("❌ Yeterli paranız yok!");
    }

    // Kullanıcının parasından düş ve ödemeyi oxy hesabına aktar
    userMoney -= price;
    client.db.set(moneyKey, userMoney);
    oxyMoney += price;
    client.db.set(oxyKey, oxyMoney);

    // Yeni ev nesnesi oluştur (benzersiz ID ile)
    let newHouse = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      size,
      city,
      age,
      purchasePrice: price,
      rented: false,
      rentStart: null,
      lastRentCollection: null,
      agreedRent: null,
      rentOffer: null,
      saleOffer: null,
    };

    houses.push(newHouse);
    client.db.set(housesKey, houses);

    return message.channel.send(`✅ Ev satın alındı! Fiyat: **${price} TL**. Ev ID: **${newHouse.id}**`);
  }

  // Aşağıdaki işlemlerde ilgili evin ID'si gereklidir
  // (kiraya, kiracikabul, kirayareddet, kiratopla, sat, satkabul, satreddet)
  let houseId = args[1];
  if (["kiraya", "kiracikabul", "kirayareddet", "kiratopla", "sat", "satkabul", "satreddet"].includes(action)) {
    if (!houseId) {
      return message.channel.send("❌ Lütfen ev ID'sini belirtin!");
    }
    // Sayısal ID ise parse et
    houseId = isNaN(houseId) ? houseId : parseInt(houseId);
  }

  // İlgili evi dizi içinde ara
  let houseIndex = houses.findIndex(h => h.id === houseId);
  if (houseIndex === -1) {
    return message.channel.send("❌ Belirtilen ID'ye sahip ev bulunamadı!");
  }
  let house = houses[houseIndex];

  // Ev kiraya verme: ev kiraya <evID>
  if (action === "kiraya") {
    if (house.rented) {
      return message.channel.send("❌ Bu ev zaten kiraya verilmiş!");
    }
    let offer = generateRentOffer(house);
    house.rentOffer = offer;
    houses[houseIndex] = house;
    client.db.set(housesKey, houses);
    return message.channel.send(`🤖 Bot kira teklifi: **${offer} TL**. Kabul etmek için \`ev kiracikabul ${house.id}\`, reddetmek için \`ev kirayareddet ${house.id}\` yazın.`);
  }

  // Kiralama teklifini kabul etme: ev kiracikabul <evID>
  if (action === "kiracikabul") {
    if (!house.rentOffer) {
      return message.channel.send("❌ Aktif bir kira teklifi yok!");
    }
    house.rented = true;
    house.agreedRent = house.rentOffer;
    house.rentStart = Date.now();
    house.lastRentCollection = Date.now();
    house.rentOffer = null;
    houses[houseIndex] = house;
    client.db.set(housesKey, houses);
    return message.channel.send(`✅ Kira teklifi kabul edildi. Eviniz artık kiraya verildi. (Kira: **${house.agreedRent} TL/gün**)`);
  }

  // Kiralama teklifini reddetme: ev kirayareddet <evID>
  if (action === "kirayareddet") {
    if (!house.rentOffer) {
      return message.channel.send("❌ Aktif bir kira teklifi yok!");
    }
    let newOffer = generateRentOffer(house);
    house.rentOffer = newOffer;
    houses[houseIndex] = house;
    client.db.set(housesKey, houses);
    return message.channel.send(`🤖 Yeni kira teklifi: **${newOffer} TL**. Kabul etmek için \`ev kiracikabul ${house.id}\`, reddetmek için \`ev kirayareddet ${house.id}\` yazın.`);
  }

  // Kira toplama: ev kiratopla <evID>
  if (action === "kiratopla") {
    if (!house.rented || !house.agreedRent) {
      return message.channel.send("❌ Bu ev kiraya verilmemiş veya kira henüz başlamadı!");
    }
    let now = Date.now();
    let lastCollection = house.lastRentCollection || house.rentStart;
    let daysPassed = Math.floor((now - lastCollection) / (1000 * 60 * 60 * 24));
    if (daysPassed < 1) {
      return message.channel.send("❌ Henüz kira toplamak için yeterli zaman geçmedi!");
    }
    let rentIncome = daysPassed * house.agreedRent;
    house.lastRentCollection = now;
    houses[houseIndex] = house;
    client.db.set(housesKey, houses);
    userMoney += rentIncome;
    client.db.set(moneyKey, userMoney);
    return message.channel.send(`✅ **${rentIncome} TL** kira toplandı (${daysPassed} gün).`);
  }

  // Ev satma: ev sat <evID>
  if (action === "sat") {
    let saleOffer = generateSaleOffer(house);
    house.saleOffer = saleOffer;
    houses[houseIndex] = house;
    client.db.set(housesKey, houses);
    return message.channel.send(`🤖 Bot satış teklifi: **${saleOffer} TL**. Kabul etmek için \`ev satkabul ${house.id}\`, reddetmek için \`ev satreddet ${house.id}\` yazın.`);
  }

  // Satış teklifini kabul etme: ev satkabul <evID>
  if (action === "satkabul") {
    if (!house.saleOffer) {
      return message.channel.send("❌ Aktif bir satış teklifi yok!");
    }
    let salePrice = house.saleOffer;
    userMoney += salePrice;
    client.db.set(moneyKey, userMoney);
    // Ev satıldığı için listeden kaldır
    houses.splice(houseIndex, 1);
    client.db.set(housesKey, houses);
    return message.channel.send(`✅ Ev satıldı! **${salePrice} TL** hesabınıza eklendi.`);
  }

  // Satış teklifini reddetme: ev satreddet <evID>
  if (action === "satreddet") {
    if (!house.saleOffer) {
      return message.channel.send("❌ Aktif bir satış teklifi yok!");
    }
    let newSaleOffer = generateSaleOffer(house);
    house.saleOffer = newSaleOffer;
    houses[houseIndex] = house;
    client.db.set(housesKey, houses);
    return message.channel.send(`🤖 Yeni satış teklifi: **${newSaleOffer} TL**. Kabul etmek için \`ev satkabul ${house.id}\`, reddetmek için \`ev satreddet ${house.id}\` yazın.`);
  }

  return message.channel.send("❌ Geçersiz işlem!");
};

//
// Yardımcı Fonksiyonlar
//

// Daha fazla şehir ekleyerek şehir çarpanını belirleme
function getCityMultiplier(city) {
  const cities = {
    "istanbul": 1.5,
    "ankara": 1.2,
    "izmir": 1.3,
    "bursa": 1.1,
    "antalya": 1.0,
    "adana": 1.0,
    "gaziantep": 1.1,
    "konya": 1.0,
    "eskisehir": 1.0,
    "trabzon": 1.1,
    "kayseri": 1.0,
    "mersin": 1.0,
    // Dilerseniz ek şehirler ekleyebilirsiniz.
  };
  return cities[city.toLowerCase()] || 1.0;
}

// Ev özelliklerine göre kira teklifi oluşturma
function generateRentOffer(house) {
  let baseRent = house.size * 10;
  let ageFactor = Math.max(0.5, 1 - (house.age * 0.01));
  let offer = baseRent * ageFactor;
  // ±%5 rastgele varyasyon
  offer *= (1 + (Math.random() - 0.5) * 0.1);
  return Math.round(offer);
}

// Ev özelliklerine göre satış teklifi oluşturma (±%10 varyasyon)
function generateSaleOffer(house) {
  let variation = 1 + ((Math.random() - 0.5) * 0.2);
  let offer = house.purchasePrice * variation;
  return Math.round(offer);
}

// Kullanıcının evlerini gösteren tablo oluşturma
function sendHouseTable(message, houses) {
  let embed = new MessageEmbed().setTitle("🏠 Ev Durumu").setColor("GREEN");
  if (!houses || houses.length === 0) {
    embed.setDescription("Ev bulunmuyor.");
  } else {
    houses.forEach((house) => {
      let status = house.rented ? "Kirada" : "Boş";
      let rentInfo = house.rented && house.agreedRent ? `Kira: ${house.agreedRent} TL/gün` : "";
      embed.addField(
        `Ev ID: ${house.id}`,
        `Şehir: ${house.city}\nBüyüklük: ${house.size} m²\nYaş: ${house.age}\nSatın Alma: ${house.purchasePrice} TL\nDurum: ${status}\n${rentInfo}`,
        false
      );
    });
  }
  return message.channel.send({ embeds: [embed] });
}

exports.help = {
  name: "ev",
  description: "Ev al, kiraya ver, kira topla veya sat. Birden fazla ev desteği sunar.",
  usage: "ev <al|kiraya|kiracikabul|kirayareddet|kiratopla|sat|satkabul|satreddet|tablo> [parametreler]",
  example: "ev al 100 Istanbul 5",
};
