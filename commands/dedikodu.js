const fetch = require("node-fetch");

exports.help = {
  name: "dedikodu",
  aliases: ["dedikoduu", "gıybet"],
  usage: "dedikodu",
  description:
    "Sunucudan rastgele bir kullanıcı hakkında yapay zeka ile dedikodu üretir.",
  category: "Eğlence",
  cooldown: 15,
};

async function generateGossip(AI21_API_KEY) {
  const messages = [
    {
      role: "system",
      content:
        "Sen rastgele bir kişi hakkında kısa, eğlenceli ve uydurma dedikodular üreten bir botsun. Dedikodun kısa, akılda kalıcı, biraz komik ve absürt olsun. Sadece dedikodu ver, başka hiçbir şey yazma.",
    },
    {
      role: "user",
      content: "Bana bir dedikodu uydur.",
    },
  ];

  const response = await fetch(
    "https://api.ai21.com/studio/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${AI21_API_KEY}`,
      },
      body: JSON.stringify({
        model: "jamba-large-1.7",
        messages: messages,
        n: 1,
        max_tokens: 100,
        temperature: 0.7,
        top_p: 1,
        stop: [],
        response_format: { type: "text" },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      `AI21 API isteği başarısız oldu: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();

  if (
    !data.choices ||
    !data.choices[0] ||
    !data.choices[0].message ||
    !data.choices[0].message.content
  ) {
    throw new Error("AI21’den geçerli bir dedikodu gelmedi.");
  }

  return data.choices[0].message.content.trim();
}

exports.execute = async (client, message, args) => {
  try {
    const AI21_API_KEY = client.config.AI21_API_KEY;

    let gossip = await generateGossip(AI21_API_KEY);

    // Sunucudan rastgele bir üye seç
    const members = message.guild.members.cache
      .filter((m) => !m.user.bot && m.user.username)
      .map((m) => m.user.username);
    if (members.length === 0) {
      return message.reply(
        "Sunucuda dedikodu yapılacak kimse yok gibi görünüyor. 😔"
      );
    }
    const randomMember = members[Math.floor(Math.random() * members.length)];

    // Dedikoduda geçen ilk ismi rastgele kullanıcı ismi ile değiştir
    const words = gossip.split(" ");
    let replaced = false;
    for (let i = 0; i < words.length; i++) {
      if (/^[A-Z][a-zçğıöşü]+$/.test(words[i]) && !replaced) {
        words[i] = randomMember;
        replaced = true;
      }
    }
    if (!replaced) {
      // Eğer isim bulunamazsa başına ismi ekle
      gossip = `${randomMember} hakkında duyduğuma göre: ${gossip}`;
    } else {
      gossip = words.join(" ");
    }

    // Embed ile gönder
    const embed = {
      title: "🤫 Dedikodu Vakti!",
      description: gossip,
      color: "#FF69B4",
      footer: { text: `Destiny v14 Dedikodu Botu` },
      timestamp: new Date(),
    };

    message.channel.send({ embeds: [embed] });
  } catch (error) {
    console.error(error);
    message.reply(
      "❌ Dedikodu üretilirken bir hata oluştu, lütfen tekrar dene."
    );
  }
};
