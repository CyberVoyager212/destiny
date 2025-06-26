const { MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");

// Kart destesi oluşturma
function createDeck() {
  const suits = ["♠", "♥", "♦", "♣"];
  const values = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
  let deck = [];
  for (let suit of suits) {
    for (let value of values) {
      deck.push({ value, suit });
    }
  }
  return deck.sort(() => Math.random() - 0.5);
}

// Kart sıralaması için değer haritası
const cardOrder = {
  "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9,
  "10": 10, "J": 11, "Q": 12, "K": 13, "A": 14
};

// 5 kartlık el değerlendirmesi (hesaplanan rank; yüksek rank daha iyi)
function evaluate5(hand) {
  // hand: 5 kartlık dizi
  // Sıralı kopyasını oluştur
  let sorted = hand.slice().sort((a, b) => cardOrder[a.value] - cardOrder[b.value]);
  let values = sorted.map(card => card.value);
  let suits = sorted.map(card => card.suit);

  // Flush kontrolü: tüm kart aynı türde mi?
  let isFlush = suits.every(s => s === suits[0]);

  // Straight kontrolü:
  let isStraight = false;
  let straightHigh = null;
  let nums = sorted.map(card => cardOrder[card.value]);
  // Normal kontrol
  let consecutive = true;
  for (let i = 1; i < nums.length; i++) {
    if (nums[i] !== nums[i - 1] + 1) {
      consecutive = false;
      break;
    }
  }
  if (consecutive) {
    isStraight = true;
    straightHigh = nums[nums.length - 1];
  } else {
    // Ace düşük kontrolü: A,2,3,4,5
    let lowStraight = [2, 3, 4, 5, 14]; // Ace = 14
    let numsSorted = [...new Set(nums)];
    numsSorted.sort((a, b) => a - b);
    if (JSON.stringify(numsSorted) === JSON.stringify(lowStraight)) {
      isStraight = true;
      straightHigh = 5;
    }
  }

  // Frekanslar (pair, trips, four)
  let freq = {};
  for (let v of values) {
    freq[v] = (freq[v] || 0) + 1;
  }
  let freqValues = Object.values(freq);
  let four = freqValues.includes(4);
  let three = freqValues.includes(3);
  let pairs = freqValues.filter(n => n === 2).length;

  // Rank belirleme (değer: ne kadar yüksekse el o kadar iyi)
  // Rank sistemimiz: 
  // 10: Royal Flush, 9: Straight Flush, 8: Four of a Kind,
  // 7: Full House, 6: Flush, 5: Straight, 4: Three of a Kind,
  // 3: Two Pair, 2: One Pair, 1: High Card
  if (isStraight && isFlush && straightHigh === 14) return { rank: 10, name: "Royal Flush" };
  if (isStraight && isFlush) return { rank: 9, name: "Straight Flush" };
  if (four) return { rank: 8, name: "Four of a Kind" };
  if (three && pairs >= 1) return { rank: 7, name: "Full House" };
  if (isFlush) return { rank: 6, name: "Flush" };
  if (isStraight) return { rank: 5, name: "Straight" };
  if (three) return { rank: 4, name: "Three of a Kind" };
  if (pairs >= 2) return { rank: 3, name: "Two Pair" };
  if (pairs === 1) return { rank: 2, name: "One Pair" };
  return { rank: 1, name: "High Card" };
}

// 7 karttan (2+5) en iyi 5 kartlık kombinasyonu bulan fonksiyon
function evaluateHand(cards) {
  const combinations = getCombinations(cards, 5);
  let best = { rank: 0, name: "" };
  for (let hand of combinations) {
    let evalResult = evaluate5(hand);
    if (evalResult.rank > best.rank) best = evalResult;
  }
  return best;
}

// Kombinasyon üretme fonksiyonu: array'den k elemanlı tüm kombinasyonları döner.
function getCombinations(array, k) {
  let results = [];
  function comb(current, start) {
    if (current.length === k) {
      results.push(current);
      return;
    }
    for (let i = start; i < array.length; i++) {
      comb([...current, array[i]], i + 1);
    }
  }
  comb([], 0);
  return results;
}

// Botların konuşma mesajları
const raiseMessages = [
  "Dostum, raise yapıyorum, hadi oyunu ısıtalım!",
  "Raise: Bahsi artırıyorum, ne yapacaksın?",
  "Ben raise yapıyorum, meydanı sallıyorum!",
  "Raise yapıyorum, senin hamleni görmek istiyorum!",
  "Raise: Bahsimi yükseltiyorum, oyuna renk katıyorum!"
];
const callMessages = [
  "Call yapıyorum, seninle aynıyım.",
  "Call: Bahsi eşitliyorum, devam ediyorum.",
  "Ben call yapıyorum, hamlemi takip ediyorum.",
  "Call: Oyunda kalıyorum, bakalım ne olacak.",
  "Call yapıyorum, senin hamleni görüyorum."
];
const foldMessages = [
  "Fold: Bu eli bırakıyorum, elim bana göre değil.",
  "Fold ediyorum, bugün şansım yaver gitmedi.",
  "Fold: Elimde iyi bir şey yok, çekiliyorum.",
  "Fold ediyorum, oyundan çıkıyorum.",
  "Fold: Bu tur benim için uygun değil."
];

// Poker komutu
exports.execute = async (client, message, args) => {
  // Kullanıcının bakiyesini kontrol et (örneğin quick.eco üzerinden)
  let userBalance = await client.eco.fetchMoney(message.author.id);
  if (userBalance.amount < 10000) {
    return message.channel.send("❌ Oynamak için en az 10000 <:Destinex:1347644229333028864> gerekiyor!");
  }

  // Bahis seçimi embed ve butonlar
  const betEmbed = new MessageEmbed()
    .setTitle("🃏 Poker Bahsi")
    .setDescription(`Ne kadar bahis oynamak istiyorsun? (Bakiyen: **${userBalance.amount}** <:Destinex:1347644229333028864>)`)
    .setColor("BLUE");

  const betRow = new MessageActionRow().addComponents(
    new MessageButton().setCustomId("bet_10000").setLabel("10000").setStyle("PRIMARY"),
    new MessageButton().setCustomId("bet_50000").setLabel("50000").setStyle("PRIMARY"),
    new MessageButton().setCustomId("bet_100000").setLabel("100000").setStyle("PRIMARY")
  );

  let betMsg = await message.channel.send({ embeds: [betEmbed], components: [betRow] });
  const betFilter = i => i.user.id === message.author.id;
  const betCollector = betMsg.createMessageComponentCollector({ filter: betFilter, time: 30000 });

  betCollector.on("collect", async interaction => {
    let betAmount = parseInt(interaction.customId.split("_")[1]);
    if (userBalance.amount < betAmount) {
      return interaction.reply({ content: "❌ Yetersiz bakiye!", ephemeral: true });
    }
    await client.eco.removeMoney(message.author.id, betAmount);

    // Kart dağıtımı
    let deck = createDeck();
    let playerHand = [deck.pop(), deck.pop()];
    let bots = [
      { name: "Bot 1", hand: [deck.pop(), deck.pop()] },
      { name: "Bot 2", hand: [deck.pop(), deck.pop()] },
      { name: "Bot 3", hand: [deck.pop(), deck.pop()] }
    ];
    let communityCards = [deck.pop(), deck.pop(), deck.pop(), deck.pop(), deck.pop()];

    // Kartları açık şekilde göster (kanal mesajı)
    const cardsToString = cards => cards.map(c => `${c.value}${c.suit}`).join(" - ");
    let cardEmbed = new MessageEmbed()
      .setTitle("🃏 Poker Oyunu Başladı!")
      .setDescription(
        `**Senin Kartların:** ${cardsToString(playerHand)}\n` +
        `**Bot Kartları:**\n` +
        `${bots.map(bot => `${bot.name}: ${cardsToString(bot.hand)}`).join("\n")}\n\n` +
        `**Topluluk Kartları:** ${cardsToString(communityCards)}\n` +
        `Bahis: **${betAmount}** <:Destinex:1347644229333028864>`
      )
      .setColor("GREEN");
    await interaction.update({ embeds: [cardEmbed], components: [] });

    // Oyuncuya aksiyon seçenekleri sun: Raise, Call, Fold
    const actionRow = new MessageActionRow().addComponents(
      new MessageButton().setCustomId("action_raise").setLabel("Raise").setStyle("PRIMARY"),
      new MessageButton().setCustomId("action_call").setLabel("Call").setStyle("SUCCESS"),
      new MessageButton().setCustomId("action_fold").setLabel("Fold").setStyle("DANGER")
    );
    let actionMsg = await message.channel.send({ content: "Hamleni seç:", components: [actionRow] });

    const actionFilter = i => i.user.id === message.author.id;
    const actionCollector = actionMsg.createMessageComponentCollector({ filter: actionFilter, time: 30000 });
    
    actionCollector.on("collect", async actionInteraction => {
      let playerDecision = actionInteraction.customId; // "action_raise", "action_call", "action_fold"
      let extraBet = 0;
      if (playerDecision === "action_fold") {
        // Oyuncu fold ederse oyun burada biter
        await actionInteraction.update({ content: "Sen fold ettin. Oyunu kaybettin.", components: [] });
        return;
      } else if (playerDecision === "action_raise") {
        // Raise seçilirse ekstra bahis ekle (örneğin %50 artış)
        extraBet = Math.floor(betAmount * 0.5);
        await client.eco.removeMoney(message.author.id, extraBet);
        betAmount += extraBet;
        await actionInteraction.update({ content: `Raise yaptın! Yeni bahis: **${betAmount}** <:Destinex:1347644229333028864>`, components: [] });
      } else if (playerDecision === "action_call") {
        await actionInteraction.update({ content: "Call yaptın. Hamlene devam ediyorsun.", components: [] });
      }

      // Bot aksiyonlarını simüle etmeden önce kısa bir sohbet zamanı
      await message.channel.send("🤖 Botlar hamlelerini düşünüyor...");

      // Bot aksiyonlarını simüle etme
      let botActions = [];
      bots.forEach(bot => {
        // Her bot için 7 kartlık kombinasyonu: bot.hand + communityCards
        let handScore = evaluateHand([...bot.hand, ...communityCards]);
        let actionText = "";
        if (handScore.rank >= 9) {
          actionText = "raises";
          bot.actionActive = true;
        } else if (handScore.rank >= 2) {
          actionText = "calls";
          bot.actionActive = true;
        } else {
          if (Math.random() < 0.3) {
            actionText = Math.random() < 0.5 ? "calls" : "raises";
            bot.actionActive = true;
          } else {
            actionText = "folds";
            bot.actionActive = false;
          }
        }
        let botActionMsg = "";
        if (actionText === "raises") {
          botActionMsg = raiseMessages[Math.floor(Math.random() * raiseMessages.length)];
        } else if (actionText === "calls") {
          botActionMsg = callMessages[Math.floor(Math.random() * callMessages.length)];
        } else {
          botActionMsg = foldMessages[Math.floor(Math.random() * foldMessages.length)];
        }
        botActions.push(`${bot.name}: ${botActionMsg} (El: ${handScore.name})`);
      });

      let botActionEmbed = new MessageEmbed()
        .setTitle("🤖 Bot Hamleleri")
        .setDescription(botActions.join("\n"))
        .setColor("ORANGE");
      await message.channel.send({ embeds: [botActionEmbed] });

      // Biraz sohbet zamanı ekleyelim...
      await message.channel.send("💬 Botlar arasında kısa bir sohbet geçiyor...");

      // Final sonucuna geçmeden önce 5 saniye bekleyelim
      setTimeout(async () => {
        // Eğer tüm botlar fold ederse, oyuncu otomatik kazanır
        let activeBots = bots.filter(bot => bot.actionActive);
        if (activeBots.length === 0) {
          await client.eco.addMoney(message.author.id, betAmount * 2);
          return message.channel.send(`🎉 **Kazandın!** Tüm botlar fold etti. **${betAmount * 2}** <:Destinex:1347644229333028864> kazandın!`);
        }

        // Oyuncunun elini değerlendir (2 kart + 5 ortak = 7 kart)
        let playerScore = evaluateHand([...playerHand, ...communityCards]);
        let botScores = activeBots.map(bot => ({
          name: bot.name,
          score: evaluateHand([...bot.hand, ...communityCards])
        }));

        // Tüm sonuçları karşılaştır, en yüksek rank kazansın (eşitlik durumunda oyuncu lehine)
        let allResults = [...botScores, { name: "Sen", score: playerScore }];
        allResults.sort((a, b) => b.score.rank - a.score.rank);
        let winner = allResults[0];

        if (winner.name === "Sen") {
          await client.eco.addMoney(message.author.id, betAmount * 2);
          return message.channel.send(`🎉 **Kazanan: Sen!** (${playerScore.name}) **${betAmount * 2}** <:Destinex:1347644229333028864> kazandın!`);
        } else {
          return message.channel.send(`😔 **Kaybettin!** Kazanan: **${winner.name}** (${winner.score.name}).`);
        }
      }, 5000);
    });
  });
};

exports.help = {
  name: "poker",
  description: "Texas Hold'em tarzı poker oynayın. Botlar blöf yapar, sohbet eder ve hamleler için butonlarla etkileşime girilir.",
  usage: "poker",
  example: "poker"
};
