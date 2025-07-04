const fetch = require("node-fetch");

exports.help = {
  name: "animeoner",
  aliases: ["animeöner", "anime"],
  usage: "animeoner",
  description: "Size yeni bir anime önerir ve açıklamasını verir.",
  category: "Eğlence",
  cooldown: 10,
};

async function fetchAnimeFromAI21(db, userId, AI21_API_KEY) {
  const previouslyRecommended =
    (await db.get(`animeRecommended_${userId}`)) || [];

  const messages = [
    {
      role: "assistant",
      content: `Daha önce önerdiğin animeler: ${
        previouslyRecommended.join(", ") || "Yok"
      }. Bunlar dışında yeni bir anime öner ve kısa bir açıklama yap. yani şöyle anime ismi : anime açıklaması başka herhangi bişey yazma!`,
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
        max_tokens: 4000,
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
    throw new Error("AI21’den geçerli bir içerik gelmedi.");
  }

  const content = data.choices[0].message.content.trim();

  // "Anime Adı: Açıklama" formatına göre ayır
  const splitIndex = content.indexOf(":");
  if (splitIndex === -1) {
    return { name: "Bilinmeyen Anime", description: content };
  }

  const name = content.slice(0, splitIndex).trim();
  const description = content.slice(splitIndex + 1).trim();

  return { name, description };
}

exports.execute = async (client, message, args) => {
  try {
    const db = client.db; // quick.db instance (afk sistemindeki gibi)
    const userId = message.author.id;
    const AI21_API_KEY = client.config.AI21_API_KEY;

    // Kullanıcıya daha önce önerilen animeleri çek
    const previouslyRecommended =
      (await db.get(`animeRecommended_${userId}`)) || [];

    // AI21 API'den yeni anime önerisi al
    const anime = await fetchAnimeFromAI21(db, userId, AI21_API_KEY);

    if (previouslyRecommended.includes(anime.name)) {
      return message.reply(
        `❌ ${anime.name} zaten sana önerilmişti. Lütfen tekrar dene.`
      );
    }

    // Veriyi quick.db'ye kaydet
    previouslyRecommended.push(anime.name);
    await db.set(`animeRecommended_${userId}`, previouslyRecommended);

    // Mesajı gönder
    const embed = {
      title: `🎬 Anime Önerisi: ${anime.name}`,
      description: anime.description,
      color: "#00FFAA",
      footer: { text: `Öneren: Destiny v14 Anime Önerici` },
      timestamp: new Date(),
    };

    return message.channel.send({ embeds: [embed] });
  } catch (error) {
    console.error(error);
    return message.reply(
      "❌ Anime önerisi alınırken bir hata oluştu, lütfen tekrar deneyiniz."
    );
  }
};
