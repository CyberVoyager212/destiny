const { MessageEmbed } = require("discord.js");

exports.help = {
  name: "gelecek",
  description: "Senin 10 yıl sonraki hayatını tahmin eder.",
  usage: "k!gelecek",
  example: "k!gelecek",
  category: "Eğlence",
  cooldown: 5,
};

exports.execute = async (client, message, args) => {
  const tahminler = [
    "10 yıl sonra süper zengin bir CEO olacaksın! 🏦💸",
    "Uzay yolculuğu yapacaksın ve Mars'a gideceksin! 🚀",
    "Biraz fazla oyun oynadın, hala aynı odada takılıyorsun... 🎮😂",
    "Efsane bir sanatçı olacaksın ve dünyaca ünlü olacaksın! 🎨✨",
    "Kendi adını taşıyan bir teknoloji şirketi kurmuşsun! 📱",
    "Maalesef ki vergiler yüzünden hala çalışıyorsun... 😩",
    "Dünyayı dolaşan bir gezgin olacaksın! ✈️🌍",
    "Büyük bir aileye sahip olacaksın ve mutlu bir hayat süreceksin! 👨‍👩‍👧‍👦❤️",
    "Sürekli kendini geliştiren bir bilim insanı olacaksın! 🔬🧠",
    "Bir yazar olup çok satan kitaplar yazacaksın! 📚✍️",
    "Profesyonel bir sporcu olarak olimpiyatlarda madalya kazanacaksın! 🥇🏅",
    "Mistik güçlere sahip olup gizemli maceralara atılacaksın! 🔮✨",
    "Kendi restoran zincirini kuracaksın ve lezzetleriyle meşhur olacaksın! 🍽️👨‍🍳",
    "Çevreci bir aktivist olup dünyayı kurtaracaksın! 🌱🌎",
    "Teknoloji dünyasında devrim yaratacak bir mucit olacaksın! 🤖⚙️",
  ];

  const tahmin = tahminler[Math.floor(Math.random() * tahminler.length)];

  const embed = new MessageEmbed()
    .setTitle("🔮 Gelecek Tahmini 🕰️")
    .setDescription(`${message.author.username}, 10 yıl sonra:\n**${tahmin}**`)
    .setColor("#ffcc00");

  message.channel.send({ embeds: [embed] });
};
