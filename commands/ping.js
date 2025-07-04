const { MessageEmbed } = require("discord.js");

exports.execute = async (client, message, args) => {
  const gatewayLatency = Math.floor(client.ws.ping);
  const sentMsg = await message.channel.send("🏓 Pinging...");

  const clientLatency = sentMsg.createdTimestamp - message.createdTimestamp;

  // Ping durumuna göre emoji seçimi
  let emoji;
  if (clientLatency <= 80) {
    emoji = "<:4tikliwifi:1389557094276927498>"; // En iyi
  } else if (clientLatency <= 150) {
    emoji = "<:3tikliwifi:1389557141014319125>";
  } else if (clientLatency <= 300) {
    emoji = "<:2tikliwifi:1389557156956602510>";
  } else {
    emoji = "<:1tikliwifi:1389557122223702047>"; // En kötü
  }

  const embed = new MessageEmbed()
    .setTitle("🏓 Pong!")
    .setColor(
      clientLatency <= 80
        ? "#43B581"
        : clientLatency <= 150
        ? "#FAA61A"
        : "#F04747"
    )
    .addFields(
      { name: "API Latency", value: `${gatewayLatency}ms`, inline: true },
      {
        name: "Client Latency",
        value: `${clientLatency}ms ${emoji}`,
        inline: true,
      }
    )
    .setTimestamp()
    .setFooter({
      text: `Requested by ${message.author.tag}`,
      iconURL: message.author.displayAvatarURL({ dynamic: true }),
    });

  sentMsg.edit({ content: null, embeds: [embed] });
};

exports.help = {
  name: "ping",
  aliases: ["pong", "latency", "ms", "gecikme"],
  usage: "ping",
  category: "Bot",
  description:
    "Botun API ve istemci gecikmesini ölçer ve durumuna göre wifi sinyal emojisi gösterir.",
};
