// dedektifvaka.js (komut modülü)
const { MessageActionRow, MessageButton } = require("discord.js");
const fetch = require("node-fetch");
const crypto = require("crypto");
const config = require("../botConfig.js");

// Oyun durumlarını tutmak için global obje
let games = {};

exports.help = {
  name: "dedektifvaka",
  description:
    "Interaktif dedektif vakası oyunu. Komutlar: oluştur, git, topla, çöz, şüpheliler, suçla",
  usage: "k!dedektifvaka [oyunID] [komut] [arg...]",
  aliases: ["vaka", "dedektif"],
};

exports.execute = async (client, message, args) => {
  if (args.length < 2) {
    return message.reply(
      "Lütfen önce bir oyun ID'si ve komut belirtin. Örnek: `k!vaka 123 oluştur`"
    );
  }

  const gameId = args.shift(); // Oyun ID'si
  const command = args.shift().toLowerCase();

  // Oyun oluşturma: k!vaka [oyunID] oluştur
  if (command === "oluştur") {
    if (games[gameId]) {
      return message.reply(`Oyun ID \`${gameId}\` zaten mevcut.`);
    }

    // 1. AI'den 9 harfli katil ismi üretelim.
    let killerName = await generateKillerName();
    killerName = killerName.toLowerCase().replace(/[^a-z]/g, "");
    if (killerName.length > 9) {
      killerName = killerName.substring(0, 9);
    } else if (killerName.length < 9) {
      while (killerName.length < 9) {
        killerName += String.fromCharCode(97 + Math.floor(Math.random() * 26));
      }
    }

    // 2. AI'den 3 adet mekan (lokasyon) üretelim.
    let locationsString = await generateLocations();
    let locations = locationsString
      .split(",")
      .map((s) => s.trim().toLowerCase());
    if (locations.length > 3) {
      locations = locations.slice(0, 3);
    } else if (locations.length < 3) {
      while (locations.length < 3) {
        locations.push("lokasyon" + (locations.length + 1));
      }
    }

    // 3. AI'den, katil ismi hariç 4 şüpheli ismi üretelim.
    let suspectsString = await generateSuspects(killerName);
    let staticSuspects = suspectsString
      .split(",")
      .map((s) => s.trim().toLowerCase());
    staticSuspects = staticSuspects.filter((name) => name !== killerName);
    while (staticSuspects.length < 4) {
      staticSuspects.push(generateRandomName(5));
    }
    let suspects = shuffleArray(staticSuspects).slice(0, 4);

    // 4. Katil ismindeki 9 harften, her lokasyon için 1 harfi seçmek üzere indeksler belirleyelim.
    let indices = [];
    while (indices.length < locations.length) {
      let idx = Math.floor(Math.random() * killerName.length);
      if (!indices.includes(idx)) indices.push(idx);
    }
    indices.sort((a, b) => a - b);

    // 5. Her lokasyon için AI'den eşya ismi üretelim.
    let items = {};
    for (let i = 0; i < locations.length; i++) {
      const letter = killerName[indices[i]];
      let itemName = await generateItemForLocation(locations[i], letter);
      let encryptedItem = encrypt(itemName);
      items[locations[i]] = { itemName, encryptedItem, letter };
    }

    // Oyun durumunu kaydedelim
    games[gameId] = {
      killerName,
      locations,
      items,
      suspects,
      collected: {},
      solved: false,
      currentLocation: null,
      locationItems: {},
    };

    // Atmosferik senaryo metnini AI'dan alalım
    const aiScenario = await generateScenarioNarrative(locations, suspects);
    games[gameId].scenario = aiScenario; // Oyunun senaryosu saklanıyor (detaylı bilgi için)

    // Kısa senaryo metni (oyunun ana fikrini özetler)
    const shortScenario = `🔍 Yeni Dedektif Vaka Oluşturuldu!
Oyun ID: ${gameId}

Senaryo: Bir cinayet vakası mevcut. Üç farklı mekanda saklı ipuçları var. İpuçlarını toplayarak katilin izini sürün!`;

    // 1. Senaryo mesajı sade metin olarak gönderiliyor.
    await message.channel.send(shortScenario);

    // 2. "Nasıl oynanır?" butonunu içeren mesaj gönderiliyor.
    const howToPlayButton = new MessageActionRow().addComponents(
      new MessageButton()
        .setCustomId("howToPlay")
        .setLabel("Nasıl oynanır?")
        .setStyle("PRIMARY")
    );

    await message.channel.send({
      content:
        "Oyunun nasıl oynanacağı hakkında bilgi almak için aşağıdaki butona tıklayın.",
      components: [howToPlayButton],
    });
    return;
  }

  // Eğer oyun oluşturulmamışsa hata mesajı
  let game = games[gameId];
  if (!game) {
    return message.reply(
      `Oyun ID \`${gameId}\` bulunamadı. Lütfen önce oluşturun: \`k!vaka ${gameId} oluştur\``
    );
  }

  // Oyun sona ermişse (doğru/yanlış suçlamada), yalnızca "şüpheliler" gibi bilgi veren komutlara izin verelim.
  if (game.solved && command !== "şüpheliler") {
    return message.reply("Oyun zaten sona erdi. Yeni bir oyun oluşturunuz.");
  }

  // "git" komutu: Belirtilen lokasyona gitmek
  if (command === "git") {
    if (args.length < 1)
      return message.reply("Lütfen gitmek istediğiniz konumu belirtin.");
    // Tüm argümanları birleştiriyoruz:
    const location = args.join(" ").toLowerCase();
    if (!game.locations.includes(location)) {
      return message.reply(
        `Konum \`${location}\` geçerli değil. Geçerli konumlar: ${game.locations.join(
          ", "
        )}`
      );
    }
    game.currentLocation = location;
    // İlgili konum için eşya listesi oluşturma işlemi
    const locationItems = generateLocationItems(
      location,
      game.items[location].encryptedItem
    );
    game.locationItems[location] = locationItems;
    const msg = `📍 ${location.toUpperCase()} Konumu\nBu konumda şu eşyalar gözüküyor:\n` +
      locationItems
        .map((item, index) => `\`${index + 1}\` ${item}`)
        .join("\n") +
      "\n\nÖzel hex kodlu eşya öne çıkar; onu toplayın!";
    return message.channel.send(msg);
  }

  // "topla" komutu: Belirtilen lokasyondaki özel eşyanın toplanması
  if (command === "topla") {
    if (args.length < 2)
      return message.reply("Lütfen konum ve eşya şifresini belirtin.");
    // Son argümanı eşya şifresi olarak al, kalanlarını birleştirerek lokasyon elde et:
    const providedEncrypted = args.pop();
    const location = args.join(" ").toLowerCase();
    if (!game.locations.includes(location)) {
      return message.reply(
        `Konum \`${location}\` geçerli değil. Geçerli konumlar: ${game.locations.join(
          ", "
        )}`
      );
    }
    const itemData = game.items[location];
    if (!itemData) {
      return message.reply(`Konum \`${location}\` için bir ipucu bulunamadı.`);
    }
    if (providedEncrypted !== itemData.encryptedItem) {
      return message.reply("Verilen eşya şifresi yanlış.");
    }
    game.collected[location] = { ...itemData, collected: true };
    return message.channel.send(
      `**${location}** konumundaki özel eşyayı topladınız!`
    );
  }

  // "çöz" komutu: Toplanan özel eşyanın şifresinin çözülmesi
  else if (command === "çöz") {
    if (args.length < 1)
      return message.reply(
        "Lütfen çözmek istediğiniz eşyanın şifresini belirtin."
      );
    const providedEncrypted = args[0];
    let found = null;
    for (const loc in game.collected) {
      if (game.collected[loc].encryptedItem === providedEncrypted) {
        found = game.collected[loc];
        break;
      }
    }
    if (!found)
      return message.reply("Bu şifreli eşya bulunamadı veya henüz toplanmadı.");
    return message.channel.send(
      `**${found.itemName}** eşyasının şifresi çözüldü! Bu size katilin isminin harfi: **${found.letter.toUpperCase()}**`
    );
  }

  // "şüpheliler" komutu: Şüpheli isimleri gösteriliyor
  else if (command === "şüpheliler") {
    return message.channel.send(`Şüpheliler: ${game.suspects.join(", ")}`);
  }

  // "suçla" komutu: Oyuncunun şüpheliyi suçlaması (oyun kazanılır veya kaybedilir)
  else if (command === "suçla") {
    if (args.length < 1)
      return message.reply(
        "Lütfen suçlamak istediğiniz şüpheli ismini belirtin."
      );
    const accused = args.join(" ").toLowerCase();
    if (!game.suspects.some((s) => s.toLowerCase() === accused)) {
      return message.reply(`\`${accused}\` isimli şüpheli bulunamadı.`);
    }
    game.solved = true;
    if (accused === game.killerName.toLowerCase()) {
      message.channel.send(
        `Tebrikler! Doğru suçlama! Katil: **${game.killerName.toUpperCase()}** bulundu.`
      );
    } else {
      message.channel.send(
        `Yanlış suçlama! \`${accused}\` katil değil. Oyunu kaybettiniz.`
      );
    }
    // Oyun sonlandığı için ilgili oyun durumu siliniyor.
    delete games[gameId];
    console.log(`Oyun ${gameId} sonlandırıldı ve silindi.`);
    return;
  } else {
    return message.reply(
      "Geçersiz komut. Geçerli komutlar: oluştur, git, topla, çöz, şüpheliler, suçla"
    );
  }
};

//═════════════════════════════════════════
// ★ Ekstra Fonksiyonlar ★
//═════════════════════════════════════════

// Rastgele 10-15 eşya ismi üreten fonksiyon
function generateLocationItems(location, specialEncrypted) {
  const count = Math.floor(Math.random() * 6) + 10; // 10-15 arası
  const possibleItems = [
    "kitap",
    "kalem",
    "defter",
    "masa",
    "sandalye",
    "lamba",
    "pencere",
    "kapı",
    "beyaz tahta",
    "kupa",
    "telefon",
    "bilgisayar",
    "dosya",
    "çiçek",
    "tablo",
    "sepet",
    "koltuk",
    "perde",
  ];
  let items = [];
  for (let i = 0; i < count; i++) {
    const randomItem =
      possibleItems[Math.floor(Math.random() * possibleItems.length)];
    items.push(randomItem);
  }
  const replaceIndex = Math.floor(Math.random() * count);
  items[replaceIndex] = specialEncrypted;
  return items;
}

// AES-256-CBC algoritması ile şifreleme (güncellenmiş sürüm)
// Artık crypto.createCipher yerine crypto.createCipheriv kullanıyoruz.
function encrypt(text) {
  const key = crypto.scryptSync("sifrelemeAnahtari", "salt", 32);
  // Güvenlik için idealde IV rastgele oluşturulmalı ve şifreli verinin bir parçası olarak saklanmalıdır.
  const iv = Buffer.alloc(16, 0);
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return encrypted;
}

// AI21 API kullanarak atmosferik ve tutarlı dedektif vakası senaryosu oluşturma
async function generateScenarioNarrative(locations, suspects) {
  const prompt = `Aşağıdaki unsurlara dayalı, atmosferik ve tutarlı bir dedektif vakası senaryosu oluştur:
Konumlar: ${locations.join(", ")}.
Şüpheliler: ${suspects.join(", ")}.
Senaryoda farklı binalar ve mekanlar belirgin olsun, karakterler uyumlu ve hikaye mantıklı bir şekilde gelişsin.
Katilin kimliği dolaylı olarak ima edilsin fakat açıkça belirtilmesin.
Oyuncuların dikkatini çekebilecek detaylı atmosferik ipuçları olsun.`;
  try {
    const response = await fetch(
      "https://api.ai21.com/studio/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.AI21_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "jamba-1.5-large",
          messages: [
            {
              role: "system",
              content:
                "Sen, atmosferik ve tutarlı bir dedektif vakası senaryosu oluşturuyorsun. Hikayede mekanlar, karakterler ve detaylar uyumlu olsun. Katili doğrudan belirtmeden ipuçları ver.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          n: 1,
          max_tokens: 300,
          temperature: 0.7,
          top_p: 1,
          stop: [],
          response_format: { type: "text" },
        }),
      }
    );
    const data = await response.json();
    const aiScenario = data.choices?.[0]?.message?.content.trim();
    return aiScenario || "Bir cinayet vakası var. İpuçlarını toplayın!";
  } catch (error) {
    console.error("Senaryo oluşturma hatası:", error);
    return "Bir cinayet vakası var. İpuçlarını toplayın!";
  }
}

// AI21 API kullanarak lokasyona uygun gizemli eşya adı üretme
async function generateItemForLocation(location, letter) {
  try {
    const response = await fetch(
      "https://api.ai21.com/studio/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.AI21_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "jamba-1.5-large",
          messages: [
            {
              role: "system",
              content: `Sen, ${location} ortamına uygun, gizemli bir eşya adı üretirken içinde gizli bir harf (${letter.toUpperCase()}) ima etmelisin.`,
            },
            {
              role: "user",
              content: `Bana ${location} için gizemli bir eşya adı üret.`,
            },
          ],
          n: 1,
          max_tokens: 50,
          temperature: 0.8,
          top_p: 1,
          stop: [],
          response_format: { type: "text" },
        }),
      }
    );
    const data = await response.json();
    return data.choices?.[0]?.message?.content.trim() || `${location} eşyası`;
  } catch (error) {
    console.error("Eşya üretme hatası:", error);
    return `${location} eşyası`;
  }
}

// AI21 API kullanarak 9 harfli katil ismi üretme
async function generateKillerName() {
  const prompt =
    "Lütfen 9 harfli, sadece küçük harflerden oluşan, rastgele bir katil ismi üret.";
  try {
    const response = await fetch(
      "https://api.ai21.com/studio/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.AI21_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "jamba-1.5-large",
          messages: [
            {
              role: "system",
              content: "Sadece 9 harfli, küçük harflerden oluşan bir kelime üret.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          n: 1,
          max_tokens: 10,
          temperature: 0.8,
          top_p: 1,
          stop: [],
          response_format: { type: "text" },
        }),
      }
    );
    const data = await response.json();
    return data.choices?.[0]?.message?.content.trim() || generateRandomName(9);
  } catch (error) {
    console.error("Katil ismi oluşturma hatası:", error);
    return generateRandomName(9);
  }
}

// AI21 API kullanarak 3 lokasyon ismi üretme
async function generateLocations() {
  const prompt =
    "Dedektif oyunu için, birbirinden farklı 3 mekan ismi üret. Lütfen mekan isimlerini virgülle ayırarak listele. (Örnek: 'hastane, kütüphane, polis')";
  try {
    const response = await fetch(
      "https://api.ai21.com/studio/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.AI21_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "jamba-1.5-large",
          messages: [
            {
              role: "system",
              content: "3 adet benzersiz mekan ismi üret.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          n: 1,
          max_tokens: 50,
          temperature: 0.8,
          top_p: 1,
          stop: [],
          response_format: { type: "text" },
        }),
      }
    );
    const data = await response.json();
    return (
      data.choices?.[0]?.message?.content.trim() ||
      "hastane, kütüphane, polis"
    );
  } catch (error) {
    console.error("Mekan oluşturma hatası:", error);
    return "hastane, kütüphane, polis";
  }
}

// AI21 API kullanarak 4 şüpheli ismi üretme (katil ismi hariç)
async function generateSuspects(excludeName) {
  const prompt = `Dedektif oyunu için, katil ismi "${excludeName}" hariç, 4 benzersiz şüpheli ismi üret. İsimleri virgülle ayırarak listele.`;
  try {
    const response = await fetch(
      "https://api.ai21.com/studio/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.AI21_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "jamba-1.5-large",
          messages: [
            {
              role: "system",
              content: "Katil ismi hariç 4 adet şüpheli ismi üret.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          n: 1,
          max_tokens: 50,
          temperature: 0.8,
          top_p: 1,
          stop: [],
          response_format: { type: "text" },
        }),
      }
    );
    const data = await response.json();
    return (
      data.choices?.[0]?.message?.content.trim() ||
      "ayşe, ali, fatma, vesayre"
    );
  } catch (error) {
    console.error("Şüpheli isim oluşturma hatası:", error);
    return "ayşe, ali, fatma, vesayre";
  }
}

// Yardımcı: Rastgele isim oluşturma (fallback)
function generateRandomName(length) {
  const chars = "abcdefghijklmnopqrstuvwxyz";
  let name = "";
  for (let i = 0; i < length; i++) {
    name += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return name;
}

// Yardımcı: Diziyi karıştıran fonksiyon
function shuffleArray(array) {
  let currentIndex = array.length,
    randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }
  return array;
}
