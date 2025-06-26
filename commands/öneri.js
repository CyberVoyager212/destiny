const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');
const api = require("srod-v2");
const axios = require('axios');
const config = require('../botConfig.js');

module.exports = {
  name: "advice",
  description: "Rastgele bir tavsiye verir.",
  usage: "advice",
  category: "Eğlence",
  aliases: [],

  execute: async (client, message, args) => {
    try {
      // API'den rastgele tavsiye al
      const data = await api.GetAdvice({ Color: "YELLOW" });

      // Geçerli bir yanıt olup olmadığını kontrol et
      if (!data || !data.embed || !data.embed.description) {
        return message.reply("Bir hata oluştu, lütfen tekrar deneyin.");
      }

      const adviceText = data.embed.description;

      // Embed mesajı oluştur
      const embed = new MessageEmbed()
        .setColor("YELLOW")
        .setDescription(adviceText);

      // Çeviri butonu oluştur
      const translateButton = new MessageButton()
        .setCustomId("translate_advice")
        .setLabel("Türkçeye Çevir")
        .setStyle("PRIMARY");

      const row = new MessageActionRow().addComponents(translateButton);

      // Embed ve butonu gönder
      const msg = await message.channel.send({ embeds: [embed], components: [row] });

      // Butona tıklamayı dinle
      const filter = i => i.customId === "translate_advice" && i.user.id === message.author.id;
      const collector = msg.createMessageComponentCollector({ filter, time: 60000 });

      collector.on("collect", async interaction => {
        await interaction.deferUpdate();

        const translatedText = await translateToTurkish(adviceText);
        
        // Çeviri yapılmış embed oluştur
        const translatedEmbed = new MessageEmbed()
          .setColor("BLUE")
          .setDescription(`**Çeviri:** ${translatedText}`);

        // Mesajı çeviriyle güncelle ve butonu kaldır
        await msg.edit({ embeds: [translatedEmbed], components: [] });
      });

    } catch (error) {
      console.error(error);
      message.reply("Bir hata oluştu, lütfen tekrar deneyin.");
    }
  }
};

// İngilizceden Türkçeye çeviri yapacak fonksiyon
async function translateToTurkish(text) {
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${config.geminiApiKey}`,
      { contents: [{ parts: [{ text: `Bunu İngilizceden Türkçeye çevir: ${text}` }] }] } 
    );
    
    return response.data.candidates[0]?.content?.parts[0]?.text || "Çeviri başarısız.";
  } catch (error) {
    console.error("Çeviri hatası:", error);
    return "Çeviri başarısız.";
  }
}
module.exports.help = {
    name: "advice",
    description: "Returns a random advice.",
    usage: "advice",
  };