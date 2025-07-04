const { MessageActionRow, MessageButton, MessageEmbed } = require("discord.js");

module.exports = {
  name: "snake",
  description: "Snake tarzı basit bir oyun başlatır.",
  usage: "snake",
  example: "snake",

  async execute(client, message) {
    let snake = [{ x: 6, y: 6 }];
    let direction = "RIGHT";
    let food = {
      x: Math.floor(Math.random() * 11),
      y: Math.floor(Math.random() * 11),
    };
    let score = 0;
    let gameActive = true;
    let speed = 1500;
    const gridSize = 11;
    let lastInteractionTime = Date.now();
    let startTime = Date.now();
    let playerName = message.author.username;
    let leaderboard =
      (await client.db.get(`snake-leaderboard-${message.guild.id}`)) || [];

    async function saveLeaderboard() {
      if (playerName) {
        leaderboard.push({
          name: playerName,
          score,
          time: (Date.now() - startTime) / 1000,
        });
        leaderboard.sort((a, b) => b.score - a.score);
        await client.db.set(
          `snake-leaderboard-${message.guild.id}`,
          leaderboard
        );
      }
    }

    function moveSnake() {
      let newHead;
      switch (direction) {
        case "UP":
          newHead = { x: snake[0].x, y: snake[0].y - 1 };
          break;
        case "DOWN":
          newHead = { x: snake[0].x, y: snake[0].y + 1 };
          break;
        case "LEFT":
          newHead = { x: snake[0].x - 1, y: snake[0].y };
          break;
        case "RIGHT":
          newHead = { x: snake[0].x + 1, y: snake[0].y };
          break;
      }
      snake.unshift(newHead);

      if (newHead.x === food.x && newHead.y === food.y) {
        score += 10;
        food = {
          x: Math.floor(Math.random() * gridSize),
          y: Math.floor(Math.random() * gridSize),
        };
      } else {
        snake.pop();
      }

      if (
        newHead.x < 0 ||
        newHead.x >= gridSize ||
        newHead.y < 0 ||
        newHead.y >= gridSize ||
        snake
          .slice(1)
          .some((segment) => segment.x === newHead.x && segment.y === newHead.y)
      ) {
        gameActive = false;
      }
    }

    function generateGrid() {
      let grid = "";
      for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
          if (x === snake[0].x && y === snake[0].y) {
            grid += "🟩";
          } else if (
            snake.some((segment) => segment.x === x && segment.y === y)
          ) {
            grid += "🟨";
          } else if (x === food.x && y === food.y) {
            grid += "🍏";
          } else {
            grid += "⬛";
          }
        }
        grid += "\n";
      }
      return grid;
    }

    function createEmbed() {
      return new MessageEmbed()
        .setTitle("🐍 Yılan Oyunu")
        .setDescription("Yılanı hareket ettirerek yemleri toplayın!")
        .addFields(
          { name: "🕹️ Oyun Alanı", value: generateGrid(), inline: false },
          { name: "🏆 Puan", value: `${score}`, inline: false }
        )
        .setColor("#FFFF00");
    }

    const row = new MessageActionRow().addComponents(
      new MessageButton().setCustomId("up").setLabel("⬆️").setStyle("PRIMARY"),
      new MessageButton()
        .setCustomId("down")
        .setLabel("⬇️")
        .setStyle("PRIMARY"),
      new MessageButton()
        .setCustomId("left")
        .setLabel("⬅️")
        .setStyle("PRIMARY"),
      new MessageButton()
        .setCustomId("right")
        .setLabel("➡️")
        .setStyle("PRIMARY")
    );

    const gameMessage = await message.channel.send({
      embeds: [createEmbed()],
      components: [row],
    });

    const filter = (interaction) => interaction.user.id === message.author.id;
    const collector = gameMessage.createMessageComponentCollector({
      filter,
      time: 1000000000,
    });

    collector.on("collect", async (interaction) => {
      lastInteractionTime = Date.now();
      if (!gameActive) return;

      if (interaction.customId === "up" && direction !== "DOWN")
        direction = "UP";
      if (interaction.customId === "down" && direction !== "UP")
        direction = "DOWN";
      if (interaction.customId === "left" && direction !== "RIGHT")
        direction = "LEFT";
      if (interaction.customId === "right" && direction !== "LEFT")
        direction = "RIGHT";

      await interaction.update({
        embeds: [createEmbed()],
        components: [row],
      });
    });

    const moveInterval = setInterval(() => {
      if (!gameActive) {
        clearInterval(moveInterval);
        saveLeaderboard();

        const endEmbed = new MessageEmbed()
          .setTitle("🎮 Oyun Bitti!")
          .setDescription(`Puanınız: ${score}`)
          .setColor("#FF0000");

        gameMessage.edit({ embeds: [endEmbed], components: [] });

        const leaderboardEmbed = new MessageEmbed()
          .setTitle("🏅 Liderlik Tablosu")
          .setDescription("İşte en iyi oyuncular:")
          .addFields(
            leaderboard.slice(0, 5).map((entry, index) => ({
              name: `${index + 1}. ${entry.name}`,
              value: `Puan: ${entry.score}, Süre: ${entry.time}s`,
              inline: false,
            }))
          )
          .setColor("#FFFF00");

        message.channel.send({ embeds: [leaderboardEmbed] });
      } else {
        moveSnake();
        if (score % 5 === 0 && score !== 0) {
          speed = Math.max(200, 1500 - score * 10);
        }
        gameMessage.edit({
          embeds: [createEmbed()],
          components: [row],
        });
      }

      if (Date.now() - lastInteractionTime > 60000) {
        gameActive = false;
        const timeoutEmbed = new MessageEmbed()
          .setTitle("⏳ Oyun Süresi Doldu!")
          .setDescription(`Puanınız: ${score}`)
          .setColor("#FF0000");
        gameMessage.edit({ embeds: [timeoutEmbed], components: [] });
        clearInterval(moveInterval);
      }
    }, speed);
  },

  help: {
    name: "snake",
    description: "Yılan oyunu başlatır.",
    usage: "snake",
    category: "Eğlence",
    cooldown: 5,
  },
};
