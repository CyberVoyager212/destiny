const axios = require("axios");
const botConfig = require("../botConfig.js"); // API anahtarını buradan al
const prefix = [
  "H-hewwo?? ",
  "O-oh... uwu? ",
  "Nyaa~? ",
  "S-sowwy... qwq ",
  "P-pwease no bully! ",
  "U-uwu? W-what’s this? ",
  "M-meep! ",
  "N-notices you... o-oh! ",
  "A-ahh~! >///< ",
  "B-baka! ",
  "H-hmph! ",
  "M-master?? ",
  "N-nani?! ",
  "E-eh?! ",
  "Uwaaa~! ",
  "S-scawy... ",
  "P-pat me? ",
  "O-oh my~ ",
  "H-hiii~ ",
  "U-uwu...? ",
];

const subprefix = [
  " ㅇㅅㅇ",
  " UwU",
  " >w<",
  " QwQ",
  " TwT",
  " nwn",
  " ÚwÚ",
  " 0_0",
  " o3o",
  " ò_ó",
  " >///<",
  " ಥ_ಥ",
  " T_T",
  " x_x",
  " •w•",
  " (≧▽≦)",
  " ಥwಥ",
  " ¬w¬",
  " (⁄ ⁄•⁄ω⁄•⁄ ⁄)",
  " (✿◕‿◕)",
  " (≧ω≦)",
  " (*￣3￣)╭",
  " (๑>ᴗ<๑)",
  " (✧ω✧)",
  " (⌒ω⌒)",
];

// Komut bilgileri
exports.help = {
  name: "robot",
  description: "robot ile konuşur",
  usage: "robot mesaj",
};

// Emojileri silen fonksiyon
function removeEmojis(text) {
  return text.replace(
    /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E0}-\u{1F1FF}]/gu,
    ""
  );
}

// Noktalama işaretlerini silen fonksiyon
function removePunctuation(text) {
  return text.replace(/[.,!?;:"'(){}[\]<>/\\|@#$%^&*~`+=_-]/g, "");
}

// Her kelime için %50 ihtimalle, kelimenin ilk harfini (bazı kelimelerde 2 kere) ekleyip "-" koyarak yeniden yazan fonksiyon
function applyCustomHyphenInsertion(text) {
  return text.split(" ").map(word => {
    if (word.length === 0) return word;
    if (Math.random() < 0.5) {
      // Ek hyphen eklenmeye hak kazandı
      const firstChar = word[0];
      // %50 ihtimalle ilk harf 2 kere yazılsın
      const prefixLetter = Math.random() < 0.5 ? firstChar + firstChar : firstChar;
      return `${prefixLetter}-${word}`;
    }
    return word;
  }).join(" ");
}

// Yapay zeka ile mesaj oluşturma (tüm mesajlar için)
async function getUwUResponse(userInput) {
  try {
    const response = await axios.post(
      "https://api.ai21.com/studio/v1/chat/completions",
      {
        model: "jamba-1.5-large",
        messages: [
          {
            role: "system",
            content:
              "Sen utangaç ve çekingen bir yapay zeka asistansın. Kullanıcıya tatlı ve çekingen bir şekilde cevap ver. Sadece Türkçe konuş. Cevaplarında düzgün Türkçe karakterler kullan. R harflerini W'ye çevir. Noktalama işaretlerini kullanma.",
          },
          {
            role: "user",
            content: userInput,
          },
        ],
        max_tokens: 150,
        temperature: 0.7,
        top_p: 1,
        n: 1,
      },
      {
        headers: {
          Authorization: `Bearer ${botConfig.AI21_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data && response.data.choices && response.data.choices.length > 0) {
      let aiResponse = response.data.choices[0].message.content;
      // Noktalama işaretleri ve emojileri kaldır
      aiResponse = removePunctuation(aiResponse);
      aiResponse = removeEmojis(aiResponse);
      // Sadece R harflerini W'ye çevir (L'lere dokunuluyor)
      aiResponse = aiResponse.replace(/r/g, "w").replace(/R/g, "W");
      // Her kelimeye %50 ihtimalle istenen dönüşümü uygula
      aiResponse = applyCustomHyphenInsertion(aiResponse);
      return aiResponse;
    } else {
      return "B-biwemiyowum qwq";
    }
  } catch (error) {
    console.error(
      "AI21 hata vewdi:",
      error.response ? error.response.data : error.message
    );
    return "A-aa sanıwım biw hata owdu qwq";
  }
}

// Komut çalıştırma
exports.execute = async (client, message, args) => {
  if (!args[0])
    return message.channel.send("Wütfen biw mesaj giwiniz qwq");

  const userMessage = args.join(" ");
  const uwuResponse = await getUwUResponse(userMessage);

  const randomPrefix = prefix[Math.floor(Math.random() * prefix.length)];
  const randomSubprefix = subprefix[Math.floor(Math.random() * subprefix.length)];

  message.channel.send(`${randomPrefix}${uwuResponse}${randomSubprefix}`);
};
